// ============================================================
// UI - the text a first-time user needs: how to use it, and what's wrong
// if something isn't working. (The testing/debug text stays in sketch.js.)
// ============================================================

// Short instructions along the bottom. Big until you draw your first stroke,
// then small and faint so they stay out of the way.
function drawHelp() {
  if (!CONFIG.showHelp || mouseMode) return;
  const first = strokesStarted === 0;
  noStroke();
  textAlign(CENTER, BOTTOM);
  textSize(first ? 22 : 13);
  fill(200, 220, 255, first ? 230 : 90);
  text("PINCH thumb + finger to draw     ·     OPEN PALM to erase     ·     FIST to freeze",
       width / 2, height - 24);
}

// A message in the middle of the screen when something needs fixing
function drawStatusMessage() {
  let msg = null;
  const problem = cameraProblem();
  if (problem) msg = problem;
  else if (!mouseMode && !modelReady) msg = "Loading hand tracking...";
  else if (!mouseMode && gesture === "nohand") msg = "Hold your hand up to the camera";
  if (!msg) return;

  noStroke();
  textAlign(CENTER, CENTER);
  textSize(problem ? 22 : 24);
  fill(problem ? color(255, 170, 120) : color(200, 220, 255, 150));
  text(msg, width * 0.15, height / 2 - 80, width * 0.7, 160);
}
