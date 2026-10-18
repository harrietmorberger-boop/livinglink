// ============================================================
// STROKES - the lines you draw (the "trunk" that branches grow from).
// A stroke is a list of points. Pinch starts a new stroke, keeps adding points
// while you hold the pinch, and ends when you let go.
// Each point remembers how fast the hand was moving, which sets its thickness
// and how likely it is to sprout a branch.
//
// LIFE CYCLE: once you let go, the stroke starts to age. After its lifespan it
// begins to dissolve: random chunks of ink disappear, shedding particles, until
// nothing is left.
// ============================================================

const strokes = [];          // every stroke on screen
let currentStroke = null;    // the stroke being drawn right now (or null)

class Stroke {
  constructor() {
    this.points = [];        // each point: { x, y, w (thickness), amount (0..1 speed) }
    this.branches = [];      // the first branches growing off this stroke
    this.sinceSeed = 0;      // pixels drawn since the last branch started
    this.nextGap = CONFIG.seedGapSlow * random(0.3, 1);   // pixels until the next branch (randomised)
    this.curve = [];         // smooth version of the points, rebuilt when they change
    this.dirty = true;

    // --- life cycle ---
    this.finished = false;   // true once you let go (it only ages after that)
    this.age = 0;            // seconds since it was finished
    this.lifespan = CONFIG.lifespan * random(0.8, 1.2);   // each stroke lives a slightly different time
    this.alphaScale = 1;     // 1 = solid, fades to 0 right at the end
    this.noiseSeed = random(1000);   // makes the dissolve patchy but smooth along the stroke
    this.pointCounter = 0;
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
    // dieAt: when (0 to 1) through the dissolve this bit of ink will disappear.
    // Using noise() means neighbouring points go at similar times, so the stroke
    // breaks into chunks instead of looking like static.
    const n = noise(this.noiseSeed + this.pointCounter++ * 0.06);
    const dieAt = constrain(map(n, 0.25, 0.75, 0, 1), 0, 1);
    const point = { x, y, w, amount, dieAt };
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
      if (this.sinceSeed >= this.nextGap && branchTotal < CONFIG.maxBranches) {
        this.seedBranch(point, amount);
        this.sinceSeed = 0;
        // Pick a random distance to the next branch, so they come in clusters and
        // gaps instead of evenly spaced. Fast hand = shorter average distance.
        this.nextGap = lerp(CONFIG.seedGapSlow, CONFIG.seedGapFast, amount) *
                       random(CONFIG.seedGapJitterMin, CONFIG.seedGapJitterMax);
      }
    }
  }

  // Start a branch growing out of the stroke at this point
  seedBranch(point, amount) {
    const n = this.points.length;
    // Which way is the stroke heading? Look back a few points.
    const back = this.points[max(0, n - 6)];
    const heading = atan2(point.y - back.y, point.x - back.x);
    // Leave the stroke at a slightly random angle, on a random side
    const side = random([-1, 1]);
    const angle = heading + side * radians(CONFIG.seedAngle) * random(0.6, 1.4) + random(-0.3, 0.3);
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
    this.branches = this.branches.filter(b => {
      if (b.touches(x, y, radius)) { b.burst(); return false; }
      return true;
    });
    for (const b of this.branches) b.prune(x, y, radius);
  }

  // Precision eraser, part 2: remove only the points inside the circle.
  // Returns null if nothing was inside (stroke untouched), otherwise a list of
  // what is left. Erasing the middle leaves TWO pieces, erasing the end leaves one
  // shorter stroke, erasing everything leaves an empty list.
  erasePart(x, y, radius) {
    return this.splitWhere(p => dist(p.x, p.y, x, y) < radius, CONFIG.eraseParticleChance);
  }

  // The general "remove some points" tool. The eraser and the dissolving both use it.
  // shouldRemove(point) says which points go. particleChance = chance each removed
  // point turns into a particle. Branches stay with the piece they grew from.
  splitWhere(shouldRemove, particleChance) {
    const removed = [];
    const pieces = [];
    let run = [];                      // the points we are keeping, in a row
    for (const p of this.points) {
      if (shouldRemove(p)) {
        removed.push(p);               // this point goes: close off the current run
        if (run.length > 0) { pieces.push(run); run = []; }
      } else {
        run.push(p);
      }
    }
    if (removed.length === 0) return null;
    if (run.length > 0) pieces.push(run);

    for (const p of removed) {
      if (random() < particleChance) spawnParticle(p.x, p.y, p.w * 0.35);
    }

    // Turn each run of points into its own stroke. Tiny leftovers become particles.
    const result = [];
    const owner = new Map();           // which new stroke owns each point
    for (const pts of pieces) {
      if (pts.length < 3) {
        for (const p of pts) spawnParticle(p.x, p.y, p.w * 0.35);
        continue;
      }
      const piece = this.makePiece(pts);
      result.push(piece);
      for (const p of pts) owner.set(p, piece);
    }
    // Each branch goes with the piece it grew from. If that bit of ink is gone, it bursts.
    for (const b of this.branches) {
      const piece = owner.get(b.anchor);
      if (piece) piece.branches.push(b);
      else b.burst();
    }
    return result;
  }

  // A new stroke made from some of this stroke's points. It keeps the same age.
  makePiece(pts) {
    const piece = new Stroke();
    piece.points = pts;
    piece.finished = this.finished;
    piece.age = this.age;
    piece.lifespan = this.lifespan;
    piece.alphaScale = this.alphaScale;
    piece.pointCounter = this.pointCounter;
    return piece;
  }

  // Turn the whole stroke into particles at once
  burst(chance) {
    for (const p of this.points) if (random() < chance) spawnParticle(p.x, p.y, p.w * 0.35);
    for (const b of this.branches) b.burst();
  }

  // Called every frame once the stroke is finished. Returns:
  //   null          = nothing changed
  //   [] or [...]   = replace this stroke with these (empty list = it is gone)
  ageStep(dt) {
    this.age += dt;
    // progress: 0 = still healthy, 1 = fully dissolved
    const progress = constrain((this.age - this.lifespan) / CONFIG.decaySeconds, 0, 1);
    if (progress <= 0) return null;

    // Fade out over the last 30% so nothing pops away at the very end
    this.alphaScale = 1 - constrain((progress - 0.7) / 0.3, 0, 1);
    if (progress >= 1) { this.burst(0.5); return []; }

    // Remove every point whose time has come
    return this.splitWhere(p => p.dieAt < progress, CONFIG.decayParticleChance);
  }

  display() {
    if (this.points.length < 2) return;
    if (this.dirty) this.buildCurve();
    noStroke();
    fill(...CONFIG.inkColor, 45 * this.alphaScale);   // soft glow underneath
    this.drawRibbon(CONFIG.strokeGlow);
    fill(...CONFIG.inkColor, 255 * this.alphaScale);  // solid ink on top
    this.drawRibbon(1);

    // The branches are thin lines
    noFill();
    strokeJoin(ROUND);
    strokeCap(ROUND);
    for (const b of this.branches) b.display(this.alphaScale);
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

// Ages every finished stroke, so it eventually dissolves. Skipped while frozen (fist).
function ageStrokes() {
  if (gesture === "fist") return;
  const dt = min(deltaTime, 50) / 1000;      // seconds since the last frame (capped)
  for (let i = strokes.length - 1; i >= 0; i--) {
    const s = strokes[i];
    if (!s.finished) continue;               // still being drawn
    const result = s.ageStep(dt);
    if (result) strokes.splice(i, 1, ...result);
  }
}

function startStroke() {
  currentStroke = new Stroke();
  strokes.push(currentStroke);
  // Limit how many strokes exist at once (keeps the frame rate up).
  // The oldest one bursts into particles so it doesn't just blink out.
  if (strokes.length > CONFIG.maxStrokes) strokes.shift().burst(0.5);
}

function endStroke() {
  if (!currentStroke) return;
  // A tiny accidental pinch makes a stroke with almost no points: throw it away
  if (currentStroke.points.length < 3) {
    const i = strokes.indexOf(currentStroke);
    if (i >= 0) strokes.splice(i, 1);
  }
  currentStroke.finished = true;             // from now on it ages
  currentStroke = null;
}

function drawStrokes() {
  for (const s of strokes) s.display();
}
