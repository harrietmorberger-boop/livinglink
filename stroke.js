// ============================================================
// STROKES - the lines you draw.
// A stroke is a list of points. Pinch starts a new stroke, keeps adding points
// while you hold the pinch, and ends when you let go.
// (Stage 4 adds branches and Stage 5 adds fading to this class.)
// ============================================================

const strokes = [];          // every stroke on screen
let currentStroke = null;    // the stroke being drawn right now (or null)

class Stroke {
  constructor() {
    this.points = [];        // each point: { x, y, speed }
  }

  // Add a point, but only if the pointer has moved far enough from the last one.
  // This keeps the point count (and the work per frame) low.
  addPoint(x, y, speed) {
    const last = this.points[this.points.length - 1];
    if (last && dist(last.x, last.y, x, y) < CONFIG.minPointDistance) return;
    this.points.push({ x, y, speed });
    // Safety limit: if a stroke gets huge, drop its oldest point
    if (this.points.length > CONFIG.maxPointsPerStroke) this.points.shift();
  }

  // Precision eraser: remove only the points inside the circle.
  // If nothing was inside, returns null (stroke untouched).
  // Otherwise returns a list of what is left. Erasing the middle of a stroke
  // leaves TWO pieces, erasing the end leaves one shorter stroke, and erasing
  // everything leaves an empty list.
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
      result.push(piece);
    }
    return result;
  }

  display() {
    if (this.points.length < 2) return;
    noFill();
    strokeJoin(ROUND);
    strokeCap(ROUND);
    // Soft glow underneath, then the solid ink line on top
    stroke(...CONFIG.inkColor, 45);
    strokeWeight(CONFIG.strokeWidth * CONFIG.strokeGlow);
    this.trace();
    stroke(...CONFIG.inkColor);
    strokeWeight(CONFIG.strokeWidth);
    this.trace();
  }

  // Draw a smooth curve through all the points.
  // curveVertex bends the line gently through each point instead of using
  // straight segments, which rounds off the angles you get when the hand is fast.
  // (p5 wants the first and last point repeated, that is what the extra lines do.)
  trace() {
    const pts = this.points;
    curveTightness(CONFIG.curveTightness);   // 0 = very curvy, 1 = straight lines
    beginShape();
    curveVertex(pts[0].x, pts[0].y);
    for (const p of pts) curveVertex(p.x, p.y);
    curveVertex(pts[pts.length - 1].x, pts[pts.length - 1].y);
    endShape();
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

  // PALM = erase only the parts of strokes inside the eraser circle
  if (gesture === "palm" && pointer.visible) {
    for (let i = strokes.length - 1; i >= 0; i--) {
      const left = strokes[i].erasePart(pointer.x, pointer.y, CONFIG.eraseRadius);
      if (left) strokes.splice(i, 1, ...left);   // swap the old stroke for what is left
    }
  }
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
