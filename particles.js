// ============================================================
// PARTICLES - the little flecks of ink that break off a dying stroke
// and drift away.
//
// Each particle is just a small object (position, speed, size, age).
// They wander on a "flow field": p5's noise() gives every spot on the screen
// a gentle direction to push in, so the flecks drift in soft, curving paths
// instead of flying in straight lines (idea from Nature of Code ch. 6).
// ============================================================

const particles = [];

// Make one particle at (x, y). Called whenever ink disappears.
// canSeed = true for particles from a DYING stroke: those can start new growth
// if they land on a living stroke (see interaction.js).
function spawnParticle(x, y, size, canSeed) {
  if (particles.length >= CONFIG.maxParticles) return;   // too many already: skip
  const angle = random(TWO_PI);
  const speed = random(0.2, 1.0);
  particles.push({
    x, y,
    vx: cos(angle) * speed,                // starts drifting in a random direction
    vy: sin(angle) * speed - 0.2,          // ...with a slight upward lean
    size: max(1.5, size) * random(0.6, 1.2),
    life: 0,                               // seconds alive so far
    maxLife: random(CONFIG.particleLifeMin, CONFIG.particleLifeMax),
    shade: random(0.75, 1.25),             // some flecks a little lighter or darker
    seed: !!canSeed,
  });
}

// Move every particle a little. Called once per frame. Skipped while frozen.
function updateParticles() {
  if (gesture === "fist") return;
  const dt = min(deltaTime, 50) / 1000;    // seconds since last frame (capped)
  const f = dt * 60;                       // 1.0 at 60 fps, so speed looks the same at any fps

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    // The flow field: look up a direction for this spot, and nudge toward it
    const a = noise(p.x * CONFIG.driftScale, p.y * CONFIG.driftScale, frameCount * 0.004) * TWO_PI * 2;
    p.vx += cos(a) * CONFIG.driftForce * f;
    p.vy += sin(a) * CONFIG.driftForce * f - CONFIG.floatUp * f;
    // Drag slows them down so they don't speed up forever
    const drag = pow(CONFIG.particleDrag, f);
    p.vx *= drag;
    p.vy *= drag;
    p.x += p.vx * f;
    p.y += p.vy * f;

    p.life += dt;
    if (p.life >= p.maxLife) {             // dead: swap with the last one and remove (fast)
      particles[i] = particles[particles.length - 1];
      particles.pop();
    }
  }
}

function drawParticles() {
  noStroke();
  const [r, g, b] = CONFIG.inkColor;
  for (const p of particles) {
    const k = 1 - p.life / p.maxLife;      // 1 = new, 0 = about to vanish
    fill(min(255, r * p.shade), min(255, g * p.shade), min(255, b * p.shade), 220 * k);
    circle(p.x, p.y, p.size * (0.5 + 0.5 * k));   // shrinks as it fades
  }
}
