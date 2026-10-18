// ============================================================
// STROKES - the lines you draw (the "trunk" that branches grow from).
// A stroke is a list of points. Pinch starts a new stroke, keeps adding points
// while you hold the pinch, and ends when you let go.
// Each point remembers how fast the hand was moving, which sets its thickness
// and how likely it is to sprout a branch.
// (Stage 5 adds fading and particles to this class.)
// ============================================================

const strokes = [];          // every stroke on screen
let currentStroke = null;    // the stroke being drawn right now (or null)

class Stroke {
  constructor() {
    this.points = [];        // each point: { x, y, w (thickness), amount (0..1 speed) }
    this.branches = [];      // the first branches growing off this stroke
    this.sinceSeed = 0;      // pixels drawn since the last branch started
    this.side = 1;           // branches alternate left / right of the stroke
    this.curve = [];         // smooth version of the points, rebuilt when they change
    this.dirty = true;
  }

  // Add a point, but only if the pointer has moved far enough from the last one.
  // This keeps the point count (and the work per frame) low.
  addPoint(x, y, speed) {
    const last = this.points[this.points.length - 1];
    if (last && dist(last.x, last.y, x, y) < CONFIG.minPointDistance) return;

    // FAST hand = thick, SLOW hand = thin. The width eases so it changes smoothly.
    const amount = speedAmount(speed);
    const target = lerp(CONFIG.strokeWidthMin, CONFIG.strokeWidthMax, amount);
    const w = last ? lerp(last.w, target, 0.2) : target;
    const point = { x, y, w, amount };
    this.points.push(point);
    this.dirty = true;

    // Safety limit: if a stroke gets huge, drop its oldest point (and its branches)
    if (this.points.length > CONFIG.maxPointsPerStroke) {
      const old = this.points.shift();
      this.branches = this.branches.filter(b => b.anchor !== old);
    }

    // Should a new branch start here? Fast hand = more often.
    if (last) {
      this.sinceSeed += dist(last.x, last.y, x, y);
      const gap = lerp(CONFIG.seedGapSlow, CONFIG.seedGapFast, amount);
      if (this.sinceSeed >= gap && branchTotal < CONFIG.maxBranches) {
        this.seedBranch(point, amount);
        this.sinceSeed = 0;
      }
    }
  }

  // Start a branch growing out of the stroke at this point
  seedBranch(point, amount) {
    const n = this.points.length;
    // Which way is the stroke heading? Look back a few points.
    const back = this.points[max(0, n - 6)];
    const heading = atan2(point.y - back.y, point.x - back.x);
    // Leave the stroke at an angle, alternating sides
    this.side *= -1;
    const angle = heading + this.side * radians(CONFIG.seedAngle) + random(-0.25, 0.25);
    // Fast hand = longer branches
    const len = lerp(CONFIG.branchLengthSlow, CONFIG.branchLengthFast, amount) * random(0.8, 1.2);
    const width = max(CONFIG.minBranchWidth, point.w * CONFIG.branchStartWidth);
    this.branches.push(new Branch(point.x, point.y, angle, len, width, 0, amount, point));
  }

  // Called every frame: let the branches grow
  grow() {
    for (const b of this.branches) b.grow();
  }

  // Precision eraser, part 1: cut off branches the eraser circle touches.
  eraseBranches(x, y, radius) {
    this.branches = this.branches.filter(b => !b.touches(x, y, radius));
    for (const b of this.branches) b.prune(x, y, radius);
  }

  // Precision eraser, part 2: remove only the points inside the circle.
  // If nothing was inside, returns null (stroke untouched).
  // Otherwise returns a list of what is left. Erasing the middle of a stroke
  // leaves TWO pieces, erasing the end leaves one shorter stroke, and erasing
  // everything leaves an empty list. Branches stay with the piece they grew from.
  erasePart(x, y, radius) {
    let hitSomething = false;
    const pieces = [];
    let run = [];                      // the points we are keeping, in a row
    for (const p of this.points) {
      if (dist(p.x, p.y, x, y) < radius) {
        hitSomething = true;           // this point is erased: close off the current run
        if (run.length > 0) { pieces.push(run); run = []; }
      } else {
        run.push(p);
      }
    }
    if (!hitSomething) return null;
    if (run.length > 0) pieces.push(run);

    // Turn each run of points into its own stroke. Tiny leftovers are dropped.
    const result = [];
    for (const pts of pieces) {
      if (pts.length < 3) continue;
      const piece = new Stroke();
      piece.points = pts;
      piece.branches = this.branches.filter(b => pts.includes(b.anchor));
      result.push(piece);
    }
    return result;
  }

  display() {
    if (this.points.length < 2) return;
    if (this.dirty) this.buildCurve();
    noStroke();
    fill(...CONFIG.inkColor, 45);               // soft glow underneath
    this.drawRibbon(CONFIG.strokeGlow);
    fill(...CONFIG.inkColor);                   // solid ink on top
    this.drawRibbon(1);

    // The branches are thin lines
    noFill();
    strokeJoin(ROUND);
    strokeCap(ROUND);
    for (const b of this.branches) b.display();
  }

  // Draws the stroke as a ribbon: a filled shape that is wider where the hand was fast.
  // We walk down one edge, then back up the other.
  drawRibbon(scale) {
    const c = this.curve;
    beginShape();
    for (const p of c) vertex(p.x + p.nx * p.w * scale / 2, p.y + p.ny * p.w * scale / 2);
    for (let i = c.length - 1; i >= 0; i--) {
      const p = c[i];
      vertex(p.x - p.nx * p.w * scale / 2, p.y - p.ny * p.w * scale / 2);
    }
    endShape(CLOSE);
    // Round ends (solid pass only, so the glow doesn't get bright blobs)
    if (scale === 1) {
      const a = c[0], z = c[c.length - 1];
      circle(a.x, a.y, a.w);
      circle(z.x, z.y, z.w);
    }
  }

  // Builds a smooth centre line through the points (extra points between the
  // real ones so fast, long gaps become curves, not straight lines),
  // plus a "normal" at each spot so we know which way is sideways.
  buildCurve() {
    const pts = this.points;
    const n = pts.length;
    const k = 1 - CONFIG.curveTightness;       // 1 = curviest, 0 = straight
    const out = [];
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[min(i + 2, n - 1)];
      const steps = max(1, ceil(dist(p1.x, p1.y, p2.x, p2.y) / CONFIG.curveStep));
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        // Standard smooth-curve (Hermite) blend between p1 and p2
        const h1 = 2 * t3 - 3 * t2 + 1, h2 = -2 * t3 + 3 * t2;
        const h3 = t3 - 2 * t2 + t, h4 = t3 - t2;
        out.push({
          x: h1 * p1.x + h2 * p2.x + h3 * k * (p2.x - p0.x) / 2 + h4 * k * (p3.x - p1.x) / 2,
          y: h1 * p1.y + h2 * p2.y + h3 * k * (p2.y - p0.y) / 2 + h4 * k * (p3.y - p1.y) / 2,
          w: lerp(p1.w, p2.w, t),
        });
      }
    }
    const last = pts[n - 1];
    out.push({ x: last.x, y: last.y, w: last.w });

    // Work out the sideways direction at each point
    for (let i = 0; i < out.length; i++) {
      const a = out[max(i - 1, 0)], b = out[min(i + 1, out.length - 1)];
      let tx = b.x - a.x, ty = b.y - a.y;
      const len = Math.hypot(tx, ty) || 1;
      out[i].nx = -ty / len;
      out[i].ny = tx / len;
    }
    this.curve = out;
    this.dirty = false;
  }
}

// Decides what the current gesture does. Call once per frame.
function updateDrawing() {
  // FIST = freeze: nothing is drawn or erased
  if (gesture === "fist") { endStroke(); return; }

  // PINCH = draw
  if (gesture === "pinch" && pointer.visible) {
    if (!currentStroke) startStroke();
    currentStroke.addPoint(pointer.x, pointer.y, pointer.speed);
  } else {
    endStroke();
  }

  // PALM = erase: prune touched branches, then cut the touched part of the stroke
  if (gesture === "palm" && pointer.visible) {
    for (let i = strokes.length - 1; i >= 0; i--) {
      strokes[i].eraseBranches(pointer.x, pointer.y, CONFIG.eraseRadius);
      const left = strokes[i].erasePart(pointer.x, pointer.y, CONFIG.eraseRadius);
      if (left) strokes.splice(i, 1, ...left);   // swap the old stroke for what is left
    }
  }
}

// Lets every branch grow a little. Skipped while frozen (fist).
// Also recounts the branches so we can keep them under the limit.
function growStrokes() {
  if (gesture !== "fist") for (const s of strokes) s.grow();
  branchTotal = 0;
  for (const s of strokes) for (const b of s.branches) branchTotal += b.count();
}

function startStroke() {
  currentStroke = new Stroke();
  strokes.push(currentStroke);
  // Limit how many strokes exist at once (keeps the frame rate up)
  if (strokes.length > CONFIG.maxStrokes) strokes.shift();
}

function endStroke() {
  if (!currentStroke) return;
  // A tiny accidental pinch makes a stroke with almost no points: throw it away
  if (currentStroke.points.length < 3) {
    const i = strokes.indexOf(currentStroke);
    if (i >= 0) strokes.splice(i, 1);
  }
  currentStroke = null;
}

function drawStrokes() {
  for (const s of strokes) s.display();
}
