// ============================================================
// SKETCH - the main p5 file. setup() runs once, draw() runs every frame.
// STAGE 6: strokes tangle and regrow from particles; help and error messages.
// ============================================================

let mouseMode = CONFIG.mouseModeStartsOn;
let debugOn = CONFIG.showDebug;   // press D to hide or show the testing text

function preload() {
  startHandTracking();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(...CONFIG.background);

  // Each frame, in order:
  updateGesture();   // 1. what gesture is the hand making?
  updatePointer();   // 2. where is the smoothed pen tip?
  updateDrawing();   // 3. what does that gesture do to the strokes?
  growStrokes();     // 4. let the branches grow (paused while frozen)
  ageStrokes();      // 5. age the strokes; old ones dissolve (paused while frozen)
  updateParticles(); // 6. move the particles (paused while frozen)
  updateInteractions(); // 7. particles landing on living strokes (paused while frozen)

  drawStrokes();
  drawParticles();
  drawSparks();
  if (pointer.visible) drawPointer();
  if (gesture === "fist") drawFrozenBorder();

  drawPreview();
  drawHelp();
  drawStatusMessage();
  drawGestureLabel();
  drawDebugText();
}

// Thin coloured frame so everyone can see the canvas is frozen
function drawFrozenBorder() {
  noFill();
  stroke(...GESTURE_LABELS.fist.col, 150);
  strokeWeight(6);
  rect(3, 3, width - 6, height - 6);
}

// The pen tip. Its shape tells you the gesture even without reading the label.
function drawPointer() {
  const c = GESTURE_LABELS[gesture].col;
  const x = pointer.x, y = pointer.y;
  push();
  noStroke();
  fill(...c, 50);
  circle(x, y, 44);                         // soft glow
  if (gesture === "pinch") {                // solid dot = drawing
    fill(...c);
    circle(x, y, 18);
  } else if (gesture === "palm") {          // big ring = eraser (same size as the real eraser)
    noFill(); stroke(...c); strokeWeight(2);
    circle(x, y, CONFIG.eraseRadius * 2);
  } else if (gesture === "fist") {          // square = frozen
    noFill(); stroke(...c); strokeWeight(2);
    rectMode(CENTER); square(x, y, 30);
  } else {                                  // small hollow dot = just hovering
    noFill(); stroke(...c); strokeWeight(2);
    circle(x, y, 14);
  }
  // Orange dot = where the hand really is, before smoothing (for comparing)
  if (CONFIG.showRawPoint && debugOn) {
    noStroke(); fill(255, 150, 60, 200);
    circle(pointer.rawX, pointer.rawY, 6);
  }
  pop();
}

// Small mirrored camera picture in the bottom-right corner
function drawPreview() {
  if (!CONFIG.showPreview || mouseMode) return;
  const w = CONFIG.previewWidth;
  const h = w * CONFIG.videoHeight / CONFIG.videoWidth;
  const x = width - w - 16;
  const y = height - h - 16;

  push();
  translate(x + w, y);   // move to the right edge of the preview...
  scale(-1, 1);          // ...then flip sideways = mirror
  image(video, 0, 0, w, h);
  pop();

  // Little dots on the hand landmarks, drawn on the preview
  if (hands.length > 0) {
    fill(255, 200, 80);
    noStroke();
    for (const k of hands[0].keypoints) {
      circle(x + w - (k.x / CONFIG.videoWidth) * w, y + (k.y / CONFIG.videoHeight) * h, 4);
    }
  }
  noFill();
  stroke(255, 60);
  rect(x, y, w, h);
}

// The big gesture word at the top of the screen (always visible, it helps new users)
function drawGestureLabel() {
  const g = GESTURE_LABELS[gesture];
  noStroke();
  textAlign(CENTER, TOP);
  textSize(36);
  fill(...g.col);
  text(g.text, width / 2, 16);
}

// Testing text in the top-left (press D to hide it)
function drawDebugText() {
  if (!debugOn) return;
  noStroke();
  fill(255, 170);
  textSize(14);
  textAlign(LEFT, TOP);
  text(mouseMode ? "MOUSE MODE (press M for camera)" : "Camera mode (press M for mouse mode)", 16, 16);
  text("fps: " + nf(frameRate(), 2, 0) + "   tracking: " + nf(trackingRate, 2, 0) + "/s   strokes: " + strokes.length +
       "   branches: " + branchTotal + "   particles: " + particles.length + "   speed: " + nf(pointer.speed, 1, 1), 16, 36);
  text("tangles: " + stats.tangles + "   regrown from particles: " + stats.regrown + "   (D hides this text)", 16, 56);
  if (!mouseMode) {
    text("pinch gap: " + nf(gestureInfo.pinchRatio, 1, 2) +
         "  (start < " + CONFIG.pinchStart + ", release > " + CONFIG.pinchRelease + ")", 16, 76);
    text("fingers curled: " + gestureInfo.curled + "  extended: " + gestureInfo.extended, 16, 96);
  } else {
    text("click = draw, hold E = erase, hold F = freeze", 16, 76);
  }
}

// Keyboard is only for testing. The real tool is hand-only.
function keyPressed() {
  if (key === "m" || key === "M") mouseMode = !mouseMode;
  if (key === "d" || key === "D") debugOn = !debugOn;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
