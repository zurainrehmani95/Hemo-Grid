// Off-main-thread physics + geometry for the PS3-style wave background.
// The worker owns the simulation loop; the main thread only uploads buffers and draws via WebGL.

const RIBBONS = [
  { yFactor: 0.50, amp: 60, thickness: 120, freq: 0.0015, phaseOff: 0.0, alpha: 0.10 },
  { yFactor: 0.54, amp: 42, thickness: 80, freq: 0.0022, phaseOff: Math.PI / 2, alpha: 0.09 },
  { yFactor: 0.46, amp: 78, thickness: 55, freq: 0.0011, phaseOff: Math.PI, alpha: 0.07 },
  { yFactor: 0.50, amp: 34, thickness: 22, freq: 0.0030, phaseOff: Math.PI / 3, alpha: 0.16 },
];

const PARTICLE_COUNT = 55;
const STEP = 10;

let width = 1;
let height = 1;
let hover = false;
let variant = 'dark';
let heat = 0;
let phase = 0;
let running = false;
let particles = [];

const mix = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const crestAt = (x, r) =>
  Math.sin(x * r.freq + phase + r.phaseOff) * r.amp +
  Math.sin(x * r.freq * 0.5 - phase * 0.6 + r.phaseOff) * r.amp * 0.4;

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

function buildRibbonMesh(r, isLast) {
  const baseY = height * r.yFactor;
  const cols = Math.max(2, Math.floor(width / STEP) + 1);
  const topY = new Float32Array(cols);
  const botY = new Float32Array(cols);

  for (let i = 0; i < cols; i++) {
    const x = Math.min(i * STEP, width);
    topY[i] = baseY + crestAt(x, r);
    botY[i] =
      baseY +
      r.thickness +
      crestAt(x, r) * 0.85 +
      Math.sin(x * r.freq + phase + 0.7) * 6;
  }

  const triCount = (cols - 1) * 2;
  const vertices = new Float32Array(triCount * 3 * 3);
  let offset = 0;

  for (let i = 0; i < cols - 1; i++) {
    const x0 = i * STEP;
    const x1 = Math.min((i + 1) * STEP, width);
    const t0 = topY[i];
    const t1 = topY[i + 1];
    const b0 = botY[i];
    const b1 = botY[i + 1];

    vertices[offset++] = x0; vertices[offset++] = t0; vertices[offset++] = 0;
    vertices[offset++] = x0; vertices[offset++] = b0; vertices[offset++] = 1;
    vertices[offset++] = x1; vertices[offset++] = t1; vertices[offset++] = 0;

    vertices[offset++] = x0; vertices[offset++] = b0; vertices[offset++] = 1;
    vertices[offset++] = x1; vertices[offset++] = b1; vertices[offset++] = 1;
    vertices[offset++] = x1; vertices[offset++] = t1; vertices[offset++] = 0;
  }

  let crest = null;
  if (isLast) {
    crest = new Float32Array(cols * 2);
    for (let i = 0; i < cols; i++) {
      const x = Math.min(i * STEP, width);
      crest[i * 2] = x;
      crest[i * 2 + 1] = topY[i];
    }
  }

  return { vertices, crest };
}

function simulateFrame() {
  const target = hover ? 1 : 0;
  heat += (target - heat) * 0.05;
  phase += 0.0022 + heat * 0.0016;

  const isLight = variant === 'light';
  const COOL = isLight ? [2, 132, 199] : [150, 205, 255];
  const WARM = isLight ? [225, 29, 72] : [255, 90, 120];
  const rib = mix(COOL, WARM, heat);

  const particleData = new Float32Array(PARTICLE_COUNT * 4);
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

    const alpha = p.baseAlpha * (isLight ? 1.35 : 1) * (0.55 + 0.45 * Math.sin(p.twinkle));
    const base = i * 4;
    particleData[base] = p.x;
    particleData[base + 1] = p.y;
    particleData[base + 2] = p.size;
    particleData[base + 3] = alpha;
  }

  const ribbons = RIBBONS.map((r, i) => ({
    alpha: r.alpha,
    ...buildRibbonMesh(r, i === RIBBONS.length - 1),
  }));

  return {
    type: 'frame',
    width,
    height,
    heat,
    color: rib,
    isLight,
    alphaScale: isLight ? 2.1 : 1,
    crestAlpha: (isLight ? 0.55 : 0.35) + heat * 0.2,
    ribbons,
    particles: particleData,
  };
}

function loop() {
  if (!running) return;
  const frame = simulateFrame();
  const transfer = [
    frame.particles.buffer,
    ...frame.ribbons.flatMap((r) => [
      r.vertices.buffer,
      ...(r.crest ? [r.crest.buffer] : []),
    ]),
  ];
  self.postMessage(frame, transfer);
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
