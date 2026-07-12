// Particle physics + heat/phase simulation off the main thread.
// Rendering stays on Canvas 2D in WaveCanvas for the original PS3 glow look.

const PARTICLE_COUNT = 55;

let width = 1;
let height = 1;
let hover = false;
let variant = 'dark';
let heat = 0;
let phase = 0;
let running = false;
let particles = [];

function seedParticles() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.4,
      speedX: Math.random() * 0.3 - 0.15,
      speedY: Math.random() * -0.35 - 0.05,
      baseAlpha: Math.random() * 0.5 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
    });
  }
}

function simulateFrame() {
  const target = hover ? 1 : 0;
  heat += (target - heat) * 0.05;
  phase += 0.0022 + heat * 0.0016;

  const isLight = variant === 'light';

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = particles[i];
    p.x += p.speedX * (1 + heat);
    p.y += p.speedY * (1 + heat * 0.6);
    p.twinkle += 0.03;

    if (p.y < -5) {
      p.y = height + 5;
      p.x = Math.random() * width;
    }
    if (p.x < -5) p.x = width + 5;
    if (p.x > width + 5) p.x = -5;
  }

  return {
    type: 'frame',
    heat,
    phase,
    isLight,
    particles: particles.map((p) => ({
      x: p.x,
      y: p.y,
      size: p.size,
      baseAlpha: p.baseAlpha,
      twinkle: p.twinkle,
    })),
  };
}

function loop() {
  if (!running) return;
  self.postMessage(simulateFrame());
  requestAnimationFrame(loop);
}

self.onmessage = (event) => {
  const msg = event.data;

  if (msg.type === 'init') {
    width = msg.width;
    height = msg.height;
    hover = !!msg.hover;
    variant = msg.variant || 'dark';
    heat = 0;
    phase = 0;
    seedParticles();
    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
    return;
  }

  if (msg.type === 'resize') {
    width = msg.width;
    height = msg.height;
    seedParticles();
    return;
  }

  if (msg.type === 'config') {
    hover = !!msg.hover;
    variant = msg.variant || 'dark';
    return;
  }

  if (msg.type === 'stop') {
    running = false;
  }
};
