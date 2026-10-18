// ============================================================
// INTERACTION - how strokes affect each other.
//
//  1. TANGLING: a growing branch is pulled toward ink from a DIFFERENT stroke
//     that is close by. When it touches, it curls around it and ties a small knot.
//     (The steering itself lives in branch.js; this file finds the neighbours.)
//
//  2. REGROWTH: particles shed by a dying stroke can land on a LIVING stroke.
//     When one does, it is absorbed (with a little ring flash) and sometimes
//     starts a brand new branch right there.
//
// To find neighbours quickly we sort all the living ink into a "grid" of boxes.
// Then a branch tip or particle only has to look in the 9 boxes around it,
// instead of checking every point on screen.
// ============================================================

const stats = { tangles: 0, regrown: 0 };   // counters, shown in the debug text
const tangleCounts = new Map();             // stroke id -> how many knots it has tied

let grid = new Map();      // box position -> list of nearby ink points
const sparks = [];         // the little ring flashes when a particle lands
let seedTokens = 3;        // limits how fast particles can start new branches

function gridKey(cx, cy) {
  return (cx + 100) + (cy + 100) * 4096;
}

// Rebuild the grid from every HEALTHY stroke (dying strokes don't take part).
function rebuildGrid() {
  grid = new Map();
  for (const s of strokes) {
    if (!s.isHealthy()) continue;
    for (let i = 0; i < s.points.length; i += 2) {
      addToGrid(s.points[i].x, s.points[i].y, s, s.points[i], null);
    }
    for (const b of s.branches) addBranchToGrid(s, b);
  }
}

function addBranchToGrid(s, b) {
  for (let i = 0; i < b.points.length; i += 3) addToGrid(b.points[i].x, b.points[i].y, s, null, b);
  const tip = b.points[b.points.length - 1];
  addToGrid(tip.x, tip.y, s, null, b);
  for (const c of b.children) addBranchToGrid(s, c);
}

// Each entry remembers where it is, which stroke owns it, and whether it is
// part of the trunk (point) or of a branch.
function addToGrid(x, y, stroke, point, branch) {
  const key = gridKey(floor(x / CONFIG.gridCell), floor(y / CONFIG.gridCell));
  let list = grid.get(key);
  if (!list) { list = []; grid.set(key, list); }
  list.push({ x, y, stroke, owner: stroke.id, point, branch });
}

// Calls fn() for every ink point in the 9 boxes around (x, y)
function forEachNear(x, y, fn) {
  const cx = floor(x / CONFIG.gridCell), cy = floor(y / CONFIG.gridCell);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const list = grid.get(gridKey(cx + dx, cy + dy));
      if (list) for (const a of list) fn(a);
    }
  }
}

// Used by branches: the closest ink from a DIFFERENT stroke, or null if none is near
function findTangleTarget(x, y, ownerId) {
  let best = null, bestD = CONFIG.tangleRadius;
  forEachNear(x, y, a => {
    if (a.owner === ownerId) return;       // ignore ink from our own stroke
    const d = dist(x, y, a.x, a.y);
    if (d < bestD) { bestD = d; best = a; }
  });
  return best;
}

// Called once per frame (skipped while frozen)
function updateInteractions() {
  if (gesture === "fist") return;
  const dt = min(deltaTime, 50) / 1000;
  seedTokens = min(3, seedTokens + dt * CONFIG.maxParticleSeedsPerSecond);
  if (frameCount % 3 === 0) rebuildGrid();    // every 3rd frame is plenty
  checkParticleHits();
  for (let i = sparks.length - 1; i >= 0; i--) {
    sparks[i].t += dt;
    if (sparks[i].t > 0.45) sparks.splice(i, 1);
  }
}

// Did any dying-stroke particle land on living ink?
function checkParticleHits() {
  if (CONFIG.particleSeedChance <= 0) return;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (!p.seed) continue;                    // only particles from dying strokes count
    let hit = null, bestD = CONFIG.particleHitDistance;
    forEachNear(p.x, p.y, a => {
      const d = dist(p.x, p.y, a.x, a.y);
      if (d < bestD) { bestD = d; hit = a; }
    });
    if (!hit) continue;

    // The particle is absorbed into the living ink, with a small ring flash
    if (sparks.length < 60) sparks.push({ x: p.x, y: p.y, t: 0 });
    particles[i] = particles[particles.length - 1];
    particles.pop();

    // Sometimes it also starts new growth (limited per second, and by the branch cap)
    if (random() < CONFIG.particleSeedChance && seedTokens >= 1 && branchTotal < CONFIG.maxBranches) {
      if (growFromHit(hit, p.x, p.y)) { seedTokens--; stats.regrown++; }
    }
  }
}

// Start a new branch where a particle landed. Returns true if it worked.
function growFromHit(hit, px, py) {
  if (!strokes.includes(hit.stroke)) return false;       // that stroke was erased meanwhile
  if (hit.branch && hit.branch.dying) return false;
  const amount = 0.5;                                    // a medium-sized branch
  const len = lerp(CONFIG.branchLengthSlow, CONFIG.branchLengthFast, amount) * random(0.8, 1.2);
  // Grow outward, in the direction the particle came from
  const angle = (px === hit.x && py === hit.y) ? random(TWO_PI) : atan2(py - hit.y, px - hit.x);
  if (hit.branch) {
    // Landed on a branch: add a new twig onto it
    const w = max(CONFIG.minBranchWidth, hit.branch.width * CONFIG.branchThin);
    hit.branch.children.push(new Branch(hit.x, hit.y, angle, len, w, hit.branch.depth + 1,
                                        amount, hit.branch.anchor, hit.owner));
  } else {
    // Landed on the main line: add a new branch to the stroke
    const w = max(CONFIG.minBranchWidth, hit.point.w * CONFIG.branchStartWidth);
    hit.stroke.branches.push(new Branch(hit.x, hit.y, angle, len, w, 0, amount, hit.point, hit.owner));
  }
  return true;
}

// The expanding ring flash where a particle lands
function drawSparks() {
  noFill();
  strokeWeight(1.5);
  for (const s of sparks) {
    const k = s.t / 0.45;
    stroke(190, 225, 255, 200 * (1 - k));
    circle(s.x, s.y, 6 + k * 24);
  }
}
