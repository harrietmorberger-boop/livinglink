// ============================================================
// SKETCH - the main p5 file. setup() runs once, draw() runs every frame.
// STAGE 2: adds pinch / palm / fist detection and on-screen labels.
// ============================================================

let mouseMode = CONFIG.mouseModeStartsOn;

function preload() {
  startHandTracking();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(...CONFIG.background);

  // Where is the "pointer"? Fingertip normally, mouse in mouse mode.
  const tip = mouseMode ? { x: mouseX, y: mouseY } : getIndexTip();

  updateGesture();   // work out the stable gesture for this frame

  // The dot on the fingertip. Its look changes with the gesture.
  if (tip) drawPointer(tip);

  drawPreview();
  drawDebugText(tip);
}

// The fingertip dot. Shape tells you the gesture even without reading the label.
function drawPointer(tip) {
  const c = GESTURE_LABELS[gesture].col;
  noStroke();
  fill(...c, 50);
  circle(tip.x, tip.y, 44);                 // soft glow
  if (gesture === "pinch") {                // solid dot = drawing
    fill(...c);
    circle(tip.x, tip.y, 18);
  } else if (gesture === "palm") {          // big ring = eraser
    noFill(); stroke(...c); strokeWeight(2);
    circle(tip.x, tip.y, 70);
  } else if (gesture === "fist") {          // square = frozen
    noFill(); stroke(...c); strokeWeight(2);
    rectMode(CENTER); square(tip.x, tip.y, 30);
  } else {                                  // small hollow dot = just hovering
    noFill(); stroke(...c); strokeWeight(2);
    circle(tip.x, tip.y, 14);
  }
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

// Text in the top-left so we can see what the program thinks is happening
function drawDebugText(tip) {
  if (!CONFIG.showDebug) return;
  noStroke();
  fill(255, 170);
  textSize(14);
  textAlign(LEFT, TOP);
  let status;
  if (mouseMode) status = "MOUSE MODE (press M for camera)";
  else if (!modelReady) status = "Loading hand model...";
  else if (!tip) status = "No hand seen";
  else status = "Hand tracked";
  text(status, 16, 16);
  text("fps: " + nf(frameRate(), 2, 0), 16, 36);
  if (!mouseMode) {
    text("pinch gap: " + nf(gestureInfo.pinchRatio, 1, 2) +
         "  (start < " + CONFIG.pinchStart + ", release > " + CONFIG.pinchRelease + ")", 16, 56);
    text("fingers curled: " + gestureInfo.curled + "  extended: " + gestureInfo.extended, 16, 76);
  } else {
    text("click = draw, hold E = erase, hold F = freeze", 16, 56);
  }

  // Big gesture label, top centre
  const g = GESTURE_LABELS[gesture];
  textAlign(CENTER, TOP);
  textSize(36);
  fill(...g.col);
  text(g.text, width / 2, 16);
}

// Keyboard is only for testing. The real tool is hand-only.
function keyPressed() {
  if (key === "m" || key === "M") mouseMode = !mouseMode;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
