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

  // ---- Smoothing (the pen tip eases toward your real hand) ----
  smoothSlow: 0.08,              // easing when hand is still. Smaller = steadier but floatier
  smoothFast: 0.85,              // easing when hand moves fast. Bigger = less lag (1 = no smoothing)
  smoothFastDistance: 30,        // how far behind (pixels) counts as "fast"
  curveTightness: 0.5,           // 0 = rounded curves (good for circles), 1 = straight segments (good for zigzags)
  handMargin: 0.12,              // ignore the camera's outer 12% so you can reach the screen edges

  // ---- Drawing ----
  strokeWidthMin: 6,             // thickness when the hand is slow (pixels)
  strokeWidthMax: 18,            // thickness when the hand is fast
  strokeGlow: 2.2,               // soft glow is this many times wider than the line
  curveStep: 6,                  // the smooth curve gets a point every ~6px (smaller = smoother, heavier)
  minPointDistance: 4,           // a new point is added every 4px of movement
  maxPointsPerStroke: 1500,
  maxStrokes: 60,                // oldest stroke is removed beyond this (performance safety)
  eraseRadius: 30,               // how big the palm eraser is (smaller = more precise)

  // ---- Hand speed ----
  // Speed is measured in pixels per frame on a 900px tall screen
  // (bigger or smaller screens are scaled to match). Watch "speed" in the
  // debug text while you draw, then set these two numbers to suit your hand.
  speedSlow: 2,                  // at or below this = fully "slow"
  speedFast: 20,                 // at or above this = fully "fast"

  // ---- Branches ----
  // Each setting has a Slow and Fast version. Your hand speed picks a value in between.
  seedGapSlow: 90,               // pixels of stroke between new branches (slow hand: few)
  seedGapFast: 45,               // ...(fast hand: many)
  seedAngle: 55,                 // degrees a branch leaves the stroke at
  branchLengthSlow: 25,          // how long a first branch grows (pixels)
  branchLengthFast: 90,
  growSpeedSlow: 0.35,           // how fast branches grow (pixels per frame)
  growSpeedFast: 1.5,
  maxDepthSlow: 1,               // how many times a branch may fork into smaller ones
  maxDepthFast: 3,
  branchAngle: 28,               // degrees between a fork's two new branches
  branchShrink: 0.7,             // each generation is 70% as long as the last (Shiffman uses 0.67)
  branchStartWidth: 0.5,         // first branch is half as thick as the stroke it grows from
  branchThin: 0.7,               // each generation is 70% as thick as the last
  minBranchWidth: 1.5,
  minBranchLength: 8,            // stop forking when a branch would be shorter than this
  maxBranches: 800,              // total on screen at once (performance safety)

  // ---- Testing helpers ----
  showRawPoint: true,            // small orange dot = unsmoothed hand, to compare
  showPreview: true,             // small camera picture in the corner
  previewWidth: 200,
  showDebug: true,               // gesture label, fps, mode text
  mouseModeStartsOn: false,      // press M in the sketch to switch at any time
};
