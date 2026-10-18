// ============================================================
// LIVING INK - all settings live here.
// Change a number, save, refresh the page. No other file needs editing.
// (Settings for later stages get added as we build them.)
// ============================================================

const CONFIG = {
  // ---- Look ----
  background: [6, 8, 15],        // near-black blue (R, G, B)
  inkColor: [80, 150, 255],      // blue ink (R, G, B)

  // ---- Camera ----
  videoWidth: 640,               // camera resolution. Lower = faster tracking
  videoHeight: 480,

  // ---- Gestures ----
  // Pinch gap is measured as a fraction of hand size (wrist to middle knuckle),
  // so it works near or far from the camera. Smaller = fingers must be closer.
  pinchStart: 0.25,              // gap needed to START a pinch
  pinchRelease: 0.40,            // gap needed to END a pinch (bigger = stickier)
  // Finger curl: tip distance / knuckle distance, both measured from the wrist.
  extendedRatio: 1.5,            // above this = finger straight out
  curledRatio: 1.2,              // below this = finger curled in
  // Anti-flicker: how many frames in a row before a new gesture is accepted
  gestureHoldFrames: 5,          // ~0.15 seconds at 30 fps
  handLostFrames: 10,            // frames with no hand before we say "no hand"

  // ---- Testing helpers ----
  showPreview: true,             // small camera picture in the corner
  previewWidth: 200,
  showDebug: true,               // gesture label, fps, mode text
  mouseModeStartsOn: false,      // press M in the sketch to switch at any time
};
