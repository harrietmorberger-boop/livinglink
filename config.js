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

  // ---- Testing helpers ----
  showPreview: true,             // small camera picture in the corner
  previewWidth: 200,
  showDebug: true,               // gesture label, fps, mode text
  mouseModeStartsOn: false,      // press M in the sketch to switch at any time
};
