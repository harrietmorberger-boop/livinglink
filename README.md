# Living Ink

Air-drawing prototype (RMIT Computational Prototyping, Assignment 3).
p5.js + ml5.js handPose. Hand only: pinch = draw, open palm = erase, fist = freeze.

## How to run

The webcam only works on `localhost` or `https`, so double-clicking `index.html` will NOT work.
Start a tiny local server in this folder instead:

**Option A (Python, already on most Macs/PCs):**

    python3 -m http.server 8000

then open http://localhost:8000 in Chrome and click Allow for the camera.

**Option B (VS Code):** install the "Live Server" extension, right-click `index.html`, choose "Open with Live Server".

You need an internet connection the first time (the libraries and hand model load from the web).

## Keys (testing only)

- `M` = switch mouse mode on/off (mouse replaces the fingertip)
- In mouse mode: click = draw, hold `E` = erase, hold `F` = freeze

## Files

- `config.js` all settings
- `hands.js` webcam + hand tracking
- `gestures.js` pinch / palm / fist detection
- `pointer.js` smoothed pen tip
- `stroke.js` strokes: drawing and erasing
- `sketch.js` main loop and on-screen UI
