// ============================================================
// POINTER - the smoothed "pen tip" that drawing uses.
//
// The camera reports a slightly shaky hand position every frame. If we drew
// that directly the lines would look jittery. So the pointer only moves PART
// of the way toward the real hand position each frame (this is called
// "easing", like lerp in p5).
//
// The trick: how far it moves depends on how far behind it is.
//   - hand nearly still  -> move a tiny bit  (kills the shake)
//   - hand moving fast   -> move a lot       (so it doesn't feel laggy)
// ============================================================

let pointer = {
  x: 0, y: 0,          // smoothed position (use this for drawing)
  rawX: 0, rawY: 0,    // unsmoothed position (only for the debug dot)
  speed: 0,            // how fast the pointer is moving (pixels per frame)
  visible: false,      // is there a hand (or mouse) to follow?
};
let lastPointerGesture = "nohand";

// Where is the hand right now, before smoothing?
function getRawPointer() {
  if (mouseMode) return { x: mouseX, y: mouseY };
  if (gesture === "palm") return getPalmPoint();   // erasing: follow the palm
  return getPinchPoint();                          // otherwise: where thumb meets finger
}

// Call once per frame, after updateGesture()
function updatePointer() {
  if (gesture === "nohand") { pointer.visible = false; lastPointerGesture = gesture; return; }

  const raw = getRawPointer();
  if (!raw) return;                 // hand lost for a moment: stay where we are
  pointer.rawX = raw.x;
  pointer.rawY = raw.y;

  // Jump straight to the hand (no gliding) when the hand first appears or the
  // gesture changes. Otherwise the pointer would streak across the screen
  // from the old spot, and that streak would be drawn as ink.
  if (!pointer.visible || gesture !== lastPointerGesture) {
    pointer.x = raw.x;
    pointer.y = raw.y;
    pointer.speed = 0;
    pointer.visible = true;
    lastPointerGesture = gesture;
    return;
  }

  // How far behind the real hand are we?
  const lag = dist(pointer.x, pointer.y, raw.x, raw.y);
  // 0 = barely behind (hand still), 1 = far behind (hand moving fast)
  // Squaring it (t * t) keeps slow, careful drawing heavily smoothed and only
  // lets the pen "speed up" when the hand is really moving.
  let t = constrain(lag / CONFIG.smoothFastDistance, 0, 1);
  t = t * t;
  // Small lag -> smoothSlow (heavy smoothing). Big lag -> smoothFast (light smoothing).
  const amount = lerp(CONFIG.smoothSlow, CONFIG.smoothFast, t);

  const oldX = pointer.x, oldY = pointer.y;
  pointer.x = lerp(pointer.x, raw.x, amount);
  pointer.y = lerp(pointer.y, raw.y, amount);

  // Speed = how far we actually moved this frame, averaged a little so it's steady.
  // Stage 4 uses this to decide how thick and branchy a stroke is.
  const moved = dist(oldX, oldY, pointer.x, pointer.y);
  pointer.speed = lerp(pointer.speed, moved, 0.2);
}
