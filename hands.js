// ============================================================
// HANDS - talks to the webcam and ml5 handPose.
// Everything about "where is my hand?" lives in this file.
// ============================================================

let video;            // the webcam feed
let handPose;         // the ml5 hand tracking model
let hands = [];       // latest hands found (ml5 updates this for us)
let modelReady = false;

// Called from sketch.js preload(). Loads the model and starts the camera.
function startHandTracking() {
  // ml5 v1: handPose model. flipped:false because we mirror the picture ourselves
  // (that way we control exactly how mirroring works).
  handPose = ml5.handPose({ flipped: false }, () => {
    modelReady = true;
    // Tell the model to keep looking at the video and call gotHands each time
    handPose.detectStart(video, gotHands);
  });

  video = createCapture(VIDEO);
  video.size(CONFIG.videoWidth, CONFIG.videoHeight);
  video.hide(); // hide the default HTML video element, we draw it ourselves
}

// ml5 calls this every time it has a new result
// We also count how many results arrive per second ("tracking rate"). The model
// is usually slower than the screen, and that limits how smooth fast drawing can be.
let trackingRate = 0, trackCount = 0, trackStart = 0;
function gotHands(results) {
  hands = results;
  trackCount++;
  const now = millis();
  if (now - trackStart >= 1000) {
    trackingRate = (trackCount * 1000) / (now - trackStart);
    trackCount = 0;
    trackStart = now;
  }
}

// Returns the index fingertip as a point on the CANVAS, mirrored so that
// moving your hand right moves the dot right (like a mirror).
// Returns null if no hand is visible.
function getIndexTip() {
  if (hands.length === 0) return null;
  const tip = hands[0].keypoints.find(k => k.name === "index_finger_tip");
  if (!tip) return null;
  return videoToCanvas(tip);
}

// Convert a point in camera pixels into canvas pixels, and mirror it.
// handMargin: your hand is hard to track at the very edge of the camera view,
// so we stretch the middle of the camera view to cover the whole canvas.
function videoToCanvas(pt) {
  const m = CONFIG.handMargin;
  const nx = constrain((pt.x / CONFIG.videoWidth - m) / (1 - 2 * m), 0, 1);
  const ny = constrain((pt.y / CONFIG.videoHeight - m) / (1 - 2 * m), 0, 1);
  return {
    x: (1 - nx) * width,   // "1 - nx" = the mirror flip
    y: ny * height,
  };
}
