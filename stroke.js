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

  // Is any point of this stroke inside a circle? (used by the eraser)
  touches(x, y, radius) {
    for (const p of this.points) {
      if (dist(p.x, p.y, x, y) < radius) return true;
    }
    return false;
  }

  display() {
    if (this.points.length < 2) return;
    noFill();
    strokeJoin(ROUND);
    strokeCap(ROUND);
    // Soft glow underneath, then the solid ink line on top
    stroke(...CONFIG.inkColor, 45);
    strokeWeight(CONFIG.strokeWidth * 4);
    this.trace();
    stroke(...CONFIG.inkColor);
    strokeWeight(CONFIG.strokeWidth);
    this.trace();
  }

  // Draw the line through all the points
  trace() {
    beginShape();
    for (const p of this.points) vertex(p.x, p.y);
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

  // PALM = erase every stroke the palm touches
  if (gesture === "palm" && pointer.visible) {
    for (let i = strokes.length - 1; i >= 0; i--) {
      if (strokes[i].touches(pointer.x, pointer.y, CONFIG.eraseRadius)) strokes.splice(i, 1);
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
