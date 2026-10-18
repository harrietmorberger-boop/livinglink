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
  constructor(x, y, angle, len, width, depth, amount, anchor) {
    this.points = [{ x, y }, { x, y }];   // the last point is the growing tip
    this.heading = angle;                 // direction the tip is heading (radians)
    this.len = len;                       // how long it will grow in total
    this.grown = 0;                       // how long it is so far
    this.width = width;
    this.depth = depth;                   // 0 = first branch off the stroke
    this.amount = amount;
    this.anchor = anchor;
    // How much it curves as it grows (radians per pixel). Always at least a little curved.
    this.bend = random(CONFIG.branchCurveMin, CONFIG.branchCurveMax) * random([-1, 1]);
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
      // Move the tip forward a little, turning slightly as it goes
      this.heading += this.bend * this.growSpeed;
      tip.x += cos(this.heading) * this.growSpeed;
      tip.y += sin(this.heading) * this.growSpeed;
      this.grown += this.growSpeed;

      // Every few pixels, lock in the tip as a real point and start a new tip
      const prev = this.points[this.points.length - 2];
      if (dist(prev.x, prev.y, tip.x, tip.y) > 4) this.points.push({ x: tip.x, y: tip.y });

      if (this.grown >= this.len) {
        this.done = true;
        this.fork();
      }
    }
    for (const c of this.children) c.grow();
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
                                    childWidth, this.depth + 1, this.amount, this.anchor));
    }
  }

  display() {
    const a = max(90, 255 - this.depth * 35);          // thinner twigs are a bit fainter
    stroke(...CONFIG.inkColor, a);
    strokeWeight(this.width);
    beginShape();
    for (const p of this.points) vertex(p.x, p.y);
    endShape();
    for (const c of this.children) c.display();
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
  prune(x, y, r) {
    this.children = this.children.filter(c => !c.touches(x, y, r));
    for (const c of this.children) c.prune(x, y, r);
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
