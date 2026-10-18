// ============================================================
// BRANCHES - the fractal-tree part (idea from Shiffman, Nature of Code ch. 8).
//
// A branch starts at a point on a stroke and GROWS along a gentle curve.
// When it reaches its full length it FORKS into 1 or 2 smaller, thinner
// branches. Those grow and fork too, until they reach the maximum depth.
// That repeating "branch makes smaller branches" is what makes it a fractal.
//
// Hand speed decides how wild it gets (see speedAmount below):
//   fast hand -> long branches, 2 forks, deeper, grows quickly
//   slow hand -> short branches, 1 gentle tendril, shallow, grows slowly
// ============================================================

let branchTotal = 0;   // how many branches exist right now (we cap this for speed)

// Turns a hand speed into a number from 0 (slow) to 1 (fast).
function speedAmount(speed) {
  return constrain((speed - CONFIG.speedSlow) / (CONFIG.speedFast - CONFIG.speedSlow), 0, 1);
}

class Branch {
  // anchor = the stroke point this branch grew from (so we know if it gets erased)
  // amount = 0..1 how fast the hand was moving when it was born
  constructor(x, y, angle, len, width, depth, amount, anchor, ownerId) {
    this.points = [{ x, y }, { x, y }];   // the last point is the growing tip
    this.heading = angle;                 // direction the tip is heading (radians)
    this.len = len;                       // how long it will grow in total
    this.grown = 0;                       // how long it is so far
    this.width = width;
    this.depth = depth;                   // 0 = first branch off the stroke
    this.amount = amount;
    this.anchor = anchor;
    this.ownerId = ownerId;               // which stroke this belongs to (branches only tangle with OTHER strokes)
    this.canTangle = random() < CONFIG.tangleChance;
    this.tangled = false;                 // has it already tied a knot?
    this.curlLeft = 0;                    // pixels of curling still to do after touching
    this.knot = null;                     // where it tied its knot
    // How much it curves as it grows (radians per pixel). Always at least a little curved.
    // A fast hand makes straighter, stick-like branches (see branchStraightFast).
    this.bend = random(CONFIG.branchCurveMin, CONFIG.branchCurveMax) * random([-1, 1]) *
                lerp(1, 1 - CONFIG.branchStraightFast, amount);
    this.growSpeed = lerp(CONFIG.growSpeedSlow, CONFIG.growSpeedFast, amount);
    this.maxDepth = round(lerp(CONFIG.maxDepthSlow, CONFIG.maxDepthFast, amount));
    this.done = false;
    this.children = [];
    branchTotal++;
  }

  // Called every frame
  grow() {
    if (!this.done) {
      const tip = this.points[this.points.length - 1];
      if (this.canTangle && !this.tangled) this.steerToNeighbours(tip);
      // Move the tip forward a little, turning slightly as it goes
      this.heading += this.bend * this.growSpeed;
      tip.x += cos(this.heading) * this.growSpeed;
      tip.y += sin(this.heading) * this.growSpeed;
      this.grown += this.growSpeed;

      // Every few pixels, lock in the tip as a real point and start a new tip
      const prev = this.points[this.points.length - 2];
      if (dist(prev.x, prev.y, tip.x, tip.y) > 4) this.points.push({ x: tip.x, y: tip.y });

      if (this.curlLeft > 0) {
        // Curling around a knot. When the curl is finished the branch carries on
        // as normal: it forks into smaller branches from where the curl ended.
        this.curlLeft -= this.growSpeed;
        if (this.curlLeft <= 0) {
          this.done = true;
          this.fork();
        }
      } else if (this.grown >= this.len) {
        this.done = true;
        this.fork();
      }
    }
    for (const c of this.children) c.grow();
  }

  // TANGLING: bend toward ink from another stroke that is close by.
  // When it gets close enough it hooks around it in a small curl and ties a knot.
  steerToNeighbours(tip) {
    // Each stroke may only tie so many knots, or it would turn into a bead necklace
    if ((tangleCounts.get(this.ownerId) || 0) >= CONFIG.maxTanglesPerStroke) return;
    const target = findTangleTarget(tip.x, tip.y, this.ownerId);
    if (!target) return;
    const d = dist(tip.x, tip.y, target.x, target.y);

    if (d < CONFIG.tangleTouch) {
      // Touching! Start curling around it. The curl turns whichever way wraps round the target.
      const cross = cos(this.heading) * (target.y - tip.y) - sin(this.heading) * (target.x - tip.x);
      this.bend = (cross >= 0 ? 1 : -1) * CONFIG.tangleCurlBend;
      this.curlLeft = CONFIG.tangleCurlLength;
      this.knot = { x: target.x, y: target.y };
      this.tangled = true;
      stats.tangles++;
      tangleCounts.set(this.ownerId, (tangleCounts.get(this.ownerId) || 0) + 1);
      return;
    }

    // Not touching yet: turn a little toward it. Closer = stronger pull.
    // (Ignore anything behind us, so branches don't do U-turns.)
    const wanted = atan2(target.y - tip.y, target.x - tip.x);
    const diff = atan2(sin(wanted - this.heading), cos(wanted - this.heading));   // -PI..PI
    if (abs(diff) > 1.75) return;
    const pull = CONFIG.tangleStrength * this.growSpeed * (1 - d / CONFIG.tangleRadius);
    this.heading += constrain(diff, -pull, pull);
  }

  // Make the smaller branches at the tip (the "recursive" step)
  fork() {
    if (this.depth >= this.maxDepth) return;
    const childLen = this.len * CONFIG.branchShrink;     // each generation is shorter
    if (childLen < CONFIG.minBranchLength) return;
    if (branchTotal >= CONFIG.maxBranches) return;       // too many on screen already

    const tip = this.points[this.points.length - 1];
    const childWidth = max(CONFIG.minBranchWidth, this.width * CONFIG.branchThin);
    const spread = radians(CONFIG.branchAngle);
    // Sometimes a fork (2 branches), sometimes a single curl (1 branch).
    // A fast hand forks more often than a slow one.
    const forkChance = lerp(CONFIG.forkChanceSlow, CONFIG.forkChanceFast, this.amount);
    const count = random() < forkChance ? 2 : 1;

    for (let i = 0; i < count; i++) {
      const side = count === 2 ? (i === 0 ? -1 : 1) : random([-1, 1]) * 0.5;
      const angle = this.heading + side * spread + random(-0.2, 0.2);
      this.children.push(new Branch(tip.x, tip.y, angle, childLen * random(0.85, 1.1),
                                    childWidth, this.depth + 1, this.amount, this.anchor, this.ownerId));
    }
  }

  // alphaScale: 1 = normal, 0 = invisible (used when the stroke is dying)
  display(alphaScale) {
    const a = max(90, 255 - this.depth * 35) * alphaScale;   // thinner twigs are a bit fainter
    stroke(...CONFIG.inkColor, a);
    strokeWeight(this.width);
    beginShape();
    for (const p of this.points) vertex(p.x, p.y);
    endShape();
    // The knot: a small dot where it tied itself to another stroke
    if (this.knot) {
      push();
      noStroke();
      fill(...CONFIG.inkColor, a);
      circle(this.knot.x, this.knot.y, this.width * 2 + 2);
      pop();
    }
    for (const c of this.children) c.display(alphaScale);
  }

  // Does the eraser circle touch this branch? If so, it gets pruned, along with
  // everything growing out of it (like cutting a twig off a tree).
  touches(x, y, r) {
    for (let i = 1; i < this.points.length; i++) {
      const a = this.points[i - 1], b = this.points[i];
      if (distToSegment(x, y, a.x, a.y, b.x, b.y) < r + this.width / 2) return true;
    }
    return false;
  }

  // Remove touched branches from the tree below this one.
  // Cut-off branches turn into particles.
  prune(x, y, r) {
    this.children = this.children.filter(c => {
      if (c.touches(x, y, r)) { c.burst(); return false; }
      return true;
    });
    for (const c of this.children) c.prune(x, y, r);
  }

  // --- Dissolving outward, from the drawn line to the tips ---
  // When the ink a branch grew from dissolves, the branch is "cut loose" and starts
  // to dissolve: it is eaten away from its base toward its tip. Only when it has
  // gone completely do the smaller branches on it start doing the same.
  startDying() {
    this.dying = true;
    this.done = true;            // stop growing and forking
  }

  // Eat a little of the branch. Returns true when this branch and all its children are gone.
  dissolveStep(dt) {
    if (this.points.length > 1) {
      let budget = CONFIG.branchDissolveSpeed * dt;     // pixels to eat this frame
      while (budget > 0 && this.points.length > 1) {
        const p0 = this.points[0], p1 = this.points[1];
        const seg = dist(p0.x, p0.y, p1.x, p1.y);
        if (random() < budget * CONFIG.branchDissolveParticles) {
          spawnParticle(p0.x, p0.y, this.width * 0.6, true);
        }
        if (seg <= budget) {                            // eat the whole piece up to the next point
          budget -= seg;
          this.points.shift();
        } else {                                        // eat part of it: slide the start along
          p0.x += (p1.x - p0.x) * budget / seg;
          p0.y += (p1.y - p0.y) * budget / seg;
          budget = 0;
        }
      }
      return false;                                     // still has branch left
    }
    // This branch is gone: now its children dissolve
    this.children = this.children.filter(c => !c.dissolveStep(dt));
    return this.children.length === 0;
  }

  // Turn this branch (and everything on it) into drifting particles instantly
  burst() {
    for (let i = 0; i < this.points.length; i += 3) {
      if (random() < 0.7) spawnParticle(this.points[i].x, this.points[i].y, this.width * 0.6);
    }
    for (const c of this.children) c.burst();
  }

  // Adds up this branch and everything below it (for the on-screen count)
  count() {
    let n = 1;
    for (const c of this.children) n += c.count();
    return n;
  }
}

// Shortest distance from point (px, py) to the line segment (ax, ay)-(bx, by)
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = constrain(t, 0, 1);
  return dist(px, py, ax + t * dx, ay + t * dy);
}

// ---- Branches that have been cut loose from a dissolving stroke ----
const dyingBranches = [];

function dissolveBranch(branch) {
  branch.startDying();
  dyingBranches.push(branch);
}

function updateDyingBranches(dt) {
  for (let i = dyingBranches.length - 1; i >= 0; i--) {
    if (dyingBranches[i].dissolveStep(dt)) dyingBranches.splice(i, 1);
  }
}

function drawDyingBranches() {
  noFill();
  strokeJoin(ROUND);
  strokeCap(ROUND);
  for (const br of dyingBranches) br.display(1);
}
