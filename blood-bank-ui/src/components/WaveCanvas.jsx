import { useRef, useEffect } from 'react';

// PS3 XMB-style animated background: soft, translucent "ribbon" waves plus drifting particles.
// Physics runs in a Web Worker; Canvas 2D rendering stays on the main thread so the original
// glow, gradients, shadow blur, and hover warmth are preserved exactly.
function WaveCanvas({ isHovered, variant = 'dark' }) {
  const canvasRef = useRef(null);
  const workerRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    const ribbons = [
      { yFactor: 0.50, amp: 60, thickness: 120, freq: 0.0015, phaseOff: 0.0, alpha: 0.10 },
      { yFactor: 0.54, amp: 42, thickness: 80, freq: 0.0022, phaseOff: Math.PI / 2, alpha: 0.09 },
      { yFactor: 0.46, amp: 78, thickness: 55, freq: 0.0011, phaseOff: Math.PI, alpha: 0.07 },
      { yFactor: 0.50, amp: 34, thickness: 22, freq: 0.0030, phaseOff: Math.PI / 3, alpha: 0.16 },
    ];

    const mix = (a, b, t) => [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t),
    ];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      workerRef.current?.postMessage({
        type: 'resize',
        width: canvas.width,
        height: canvas.height,
      });
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const worker = new Worker(new URL('../workers/wavePhysics.worker.js', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    worker.onmessage = (event) => {
      if (event.data?.type === 'frame') {
        frameRef.current = event.data;
      }
    };

    worker.postMessage({
      type: 'init',
      width: canvas.width,
      height: canvas.height,
      hover: isHovered,
      variant,
    });

    const crestAt = (x, r, phase) =>
      Math.sin(x * r.freq + phase + r.phaseOff) * r.amp +
      Math.sin(x * r.freq * 0.5 - phase * 0.6 + r.phaseOff) * r.amp * 0.4;

    const render = () => {
      const frame = frameRef.current;
      if (!frame) {
        animationId = requestAnimationFrame(render);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const { heat, phase, isLight } = frame;
      const COOL = isLight ? [2, 132, 199] : [150, 205, 255];
      const WARM = isLight ? [225, 29, 72] : [255, 90, 120];
      const alphaScale = isLight ? 2.1 : 1;
      const crestAlpha = isLight ? 0.55 : 0.35;

      const rib = mix(COOL, WARM, heat);
      const ribStr = (a) => `rgba(${rib[0]}, ${rib[1]}, ${rib[2]}, ${a})`;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ribbons.forEach((r, i) => {
        const baseY = h * r.yFactor;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 10) {
          const y = baseY + crestAt(x, r, phase);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let x = w; x >= 0; x -= 10) {
          const y = baseY + r.thickness + crestAt(x, r, phase) * 0.85 + Math.sin(x * r.freq + phase + 0.7) * 6;
          ctx.lineTo(x, y);
        }
        ctx.closePath();

        const g = ctx.createLinearGradient(0, baseY - r.amp, 0, baseY + r.thickness + r.amp);
        g.addColorStop(0.0, ribStr(0));
        g.addColorStop(0.5, ribStr(r.alpha * alphaScale + heat * 0.06));
        g.addColorStop(1.0, ribStr(0));
        ctx.fillStyle = g;
        ctx.shadowBlur = (isLight ? 28 : 40) + heat * 30;
        ctx.shadowColor = ribStr(0.5);
        ctx.fill();

        if (i === ribbons.length - 1) {
          ctx.beginPath();
          for (let x = 0; x <= w; x += 10) {
            const y = baseY + crestAt(x, r, phase);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = ribStr(crestAlpha + heat * 0.2);
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      frame.particles.forEach((p) => {
        const alpha = p.baseAlpha * (isLight ? 1.35 : 1) * (0.55 + 0.45 * Math.sin(p.twinkle));
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
      worker.postMessage({ type: 'stop' });
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    workerRef.current?.postMessage({
      type: 'config',
      hover: isHovered,
      variant,
    });
  }, [isHovered, variant]);

  return <canvas ref={canvasRef} className="ps3-wave-canvas-substrate" />;
}

export default WaveCanvas;
