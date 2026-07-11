import { useRef, useEffect } from 'react';

// PS3 XMB-style animated background: soft, translucent "ribbon" waves plus drifting particles.
// `isHovered` speeds motion and warms the colour. `variant` tunes contrast for light vs dark
// backdrops so the ribbons stay visible in both workspace themes.
function WaveCanvas({ isHovered, variant = 'dark' }) {
  const canvasRef = useRef(null);
  const hoverRef = useRef(isHovered);
  const variantRef = useRef(variant);
  hoverRef.current = isHovered;
  variantRef.current = variant;

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Smooth easing between the resting and hover states (0 = calm blue, 1 = warm/red + faster).
    let heat = 0;
    let phase = 0;

    // The layered ribbons. Each is a soft, semi-transparent band that flows with its own
    // amplitude/frequency/phase, so together they overlap like folding silk.
    const ribbons = [
      { yFactor: 0.50, amp: 60, thickness: 120, freq: 0.0015, phaseOff: 0.0,            alpha: 0.10 },
      { yFactor: 0.54, amp: 42, thickness: 80,  freq: 0.0022, phaseOff: Math.PI / 2,    alpha: 0.09 },
      { yFactor: 0.46, amp: 78, thickness: 55,  freq: 0.0011, phaseOff: Math.PI,        alpha: 0.07 },
      { yFactor: 0.50, amp: 34, thickness: 22,  freq: 0.0030, phaseOff: Math.PI / 3,    alpha: 0.16 },
    ];

    // Floating light particles that drift slowly upward.
    const particles = [];
    const particleCount = 55;
    const seedParticles = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.4,
          speedX: Math.random() * 0.3 - 0.15,
          speedY: Math.random() * -0.35 - 0.05,
          baseAlpha: Math.random() * 0.5 + 0.2,
          twinkle: Math.random() * Math.PI * 2,
        });
      }
    };
    seedParticles();

    // Linearly blend two [r,g,b] colours by t (0..1).
    const mix = (a, b, t) => [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t),
    ];

    // The vertical height of a ribbon's crest at a given x (two summed sines for an organic flow).
    const crestAt = (x, r) =>
      Math.sin(x * r.freq + phase + r.phaseOff) * r.amp +
      Math.sin(x * r.freq * 0.5 - phase * 0.6 + r.phaseOff) * r.amp * 0.4;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Ease heat + advance phase. Motion stays slow and calm, PS3-style.
      const target = hoverRef.current ? 1 : 0;
      heat += (target - heat) * 0.05;
      phase += 0.0022 + heat * 0.0016;

      const isLight = variantRef.current === 'light';
      const COOL = isLight ? [2, 132, 199] : [150, 205, 255];
      const WARM = isLight ? [225, 29, 72] : [255, 90, 120];
      const alphaScale = isLight ? 2.1 : 1;
      const crestAlpha = isLight ? 0.55 : 0.35;

      const rib = mix(COOL, WARM, heat);
      const ribStr = (a) => `rgba(${rib[0]}, ${rib[1]}, ${rib[2]}, ${a})`;

      // --- Ribbons ---
      ctx.save();
      ctx.globalCompositeOperation = 'lighter'; // additive, so overlaps glow like light
      ribbons.forEach((r, i) => {
        const baseY = h * r.yFactor;
        ctx.beginPath();
        // Top edge, left -> right.
        for (let x = 0; x <= w; x += 10) {
          const y = baseY + crestAt(x, r);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        // Bottom edge, right -> left (slightly phase-shifted so the band breathes in width).
        for (let x = w; x >= 0; x -= 10) {
          const y = baseY + r.thickness + crestAt(x, r) * 0.85 + Math.sin(x * r.freq + phase + 0.7) * 6;
          ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Soft top/bottom falloff via a vertical gradient across the whole band.
        const g = ctx.createLinearGradient(0, baseY - r.amp, 0, baseY + r.thickness + r.amp);
        g.addColorStop(0.0, ribStr(0));
        g.addColorStop(0.5, ribStr((r.alpha * alphaScale) + heat * 0.06));
        g.addColorStop(1.0, ribStr(0));
        ctx.fillStyle = g;
        ctx.shadowBlur = (isLight ? 28 : 40) + heat * 30;
        ctx.shadowColor = ribStr(0.5);
        ctx.fill();

        // A brighter thin crest line on the top edge of the sharpest ribbon for silk sheen.
        if (i === ribbons.length - 1) {
          ctx.beginPath();
          for (let x = 0; x <= w; x += 10) {
            const y = baseY + crestAt(x, r);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = ribStr(crestAlpha + heat * 0.2);
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
      ctx.restore();

      // --- Particles ---
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      particles.forEach((p) => {
        p.x += p.speedX * (1 + heat);
        p.y += p.speedY * (1 + heat * 0.6);
        p.twinkle += 0.03;

        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;

        const alpha = (p.baseAlpha * (isLight ? 1.35 : 1)) * (0.55 + 0.45 * Math.sin(p.twinkle));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = ribStr(alpha);
        ctx.shadowBlur = 8;
        ctx.shadowColor = ribStr(0.6);
        ctx.fill();
      });
      ctx.restore();

      ctx.shadowBlur = 0;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="ps3-wave-canvas-substrate" />;
}

export default WaveCanvas;
