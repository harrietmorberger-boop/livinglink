// ============================================================
// GESTURES - turns hand landmarks into one of these words:
//   "pinch"  = draw         "palm" = erase        "fist" = freeze
//   "none"   = hand visible but no gesture        "nohand" = no hand visible
//
// Two tricks stop the label flickering:
//  1. PINCH HYSTERESIS: it takes a smaller gap to START a pinch than to END it.
//  2. HOLD FRAMES: a new gesture must be seen for several frames in a row
//     before we believe it.
// ============================================================

let gesture = "nohand";        // the stable answer the rest of the program uses
let candidate = "nohand";      // what we are currently thinking of switching to
let candidateCount = 0;        // how many frames in a row we have seen it
let pinchHeld = false;         // remembers if we are mid-pinch (for hysteresis)

// Numbers shown in the debug text so we can tune thresholds while testing
let gestureInfo = { pinchRatio: 0, curled: 0, extended: 0 };

// Call once per frame from draw()
function updateGesture() {
  const raw = mouseMode ? readMouseGesture() : readHandGesture();

  if (raw === gesture) {            // nothing new, reset the counter
    candidate = gesture;
    candidateCount = 0;
    return;
  }
  // Is this the same "maybe" as last frame? Count it. Otherwise start over.
  if (raw === candidate) candidateCount++;
  else { candidate = raw; candidateCount = 1; }

  // Losing the hand needs more frames, so one dropped frame doesn't cancel a stroke
  const needed = raw === "nohand" ? CONFIG.handLostFrames : CONFIG.gestureHoldFrames;
  if (candidateCount >= needed) {
    gesture = raw;
    candidateCount = 0;
  }
}

// Reads the landmarks and guesses the gesture for THIS frame only.
function readHandGesture() {
  if (hands.length === 0) { pinchHeld = false; return "nohand"; }

  // Put the landmarks into an easy lookup: pts.wrist, pts.thumb_tip, ...
  const pts = {};
  for (const k of hands[0].keypoints) pts[k.name] = k;

  // Hand size = wrist to the knuckle of the middle finger.
  // Dividing by this means everything works whether the hand is near or far.
  const handSize = dist(pts.wrist.x, pts.wrist.y, pts.middle_finger_mcp.x, pts.middle_finger_mcp.y);

  // --- Finger curl check ---
  // For each finger: how far is the tip from the wrist, compared to its knuckle?
  // Big number = finger straight out. Small number = finger curled in.
  let curled = 0, extended = 0;
  for (const f of ["index", "middle", "ring", "pinky"]) {
    const tip = pts[f + "_finger_tip"];
    const knuckle = pts[f + "_finger_mcp"];
    const ratio = dist(tip.x, tip.y, pts.wrist.x, pts.wrist.y) /
                  dist(knuckle.x, knuckle.y, pts.wrist.x, pts.wrist.y);
    if (ratio < CONFIG.curledRatio) curled++;
    if (ratio > CONFIG.extendedRatio) extended++;
  }

  // --- Pinch check (with hysteresis) ---
  const pinchRatio = dist(pts.thumb_tip.x, pts.thumb_tip.y, pts.index_finger_tip.x, pts.index_finger_tip.y) / handSize;
  if (pinchHeld) pinchHeld = pinchRatio < CONFIG.pinchRelease;   // easy to keep
  else           pinchHeld = pinchRatio < CONFIG.pinchStart;     // harder to start

  gestureInfo = { pinchRatio, curled, extended };

  // Order matters. Fist first, so a closed hand is never mistaken for a pinch.
  if (curled === 4) return "fist";
  if (pinchHeld) return "pinch";
  if (extended === 4) return "palm";
  return "none";
}

// Mouse mode stand-in: hold mouse = pinch, hold E = palm, hold F = fist
function readMouseGesture() {
  if (mouseIsPressed) return "pinch";
  if (keyIsDown(69)) return "palm";   // E
  if (keyIsDown(70)) return "fist";   // F
  return "none";
}

// The point where thumb and index meet, in canvas pixels. Drawing uses this later.
function getPinchPoint() {
  if (mouseMode) return { x: mouseX, y: mouseY };
  if (hands.length === 0) return null;
  const t = hands[0].keypoints.find(k => k.name === "thumb_tip");
  const i = hands[0].keypoints.find(k => k.name === "index_finger_tip");
  if (!t || !i) return null;
  return videoToCanvas({ x: (t.x + i.x) / 2, y: (t.y + i.y) / 2 });
}

// Friendly text + colour for each gesture (for the on-screen label)
const GESTURE_LABELS = {
  pinch:  { text: "DRAW",   col: [80, 150, 255] },
  palm:   { text: "ERASE",  col: [255, 140, 90] },
  fist:   { text: "FREEZE", col: [150, 230, 255] },
  none:   { text: "...",    col: [150, 150, 160] },
  nohand: { text: "no hand", col: [90, 90, 100] },
};
