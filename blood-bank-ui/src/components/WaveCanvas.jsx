import { useRef, useEffect } from 'react';
import { createWaveWebGLRenderer } from '../lib/waveWebGLRenderer';

// PS3 XMB-style background rendered with WebGL (GPU) while physics + mesh generation
// run in a dedicated Web Worker so React stays responsive.
function WaveCanvas({ isHovered, variant = 'dark' }) {
  const canvasRef = useRef(null);
  const workerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer;
    let disposed = false;

    try {
      renderer = createWaveWebGLRenderer(canvas);
    } catch {
      return undefined;
    }

    const getSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = window.innerWidth;
      const cssH = window.innerHeight;
      return {
        cssW,
        cssH,
        pxW: Math.round(cssW * dpr),
        pxH: Math.round(cssH * dpr),
      };
    };

    const applyCanvasSize = () => {
      const { cssW, cssH, pxW, pxH } = getSize();
      canvas.width = pxW;
      canvas.height = pxH;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      renderer.setResolution(pxW, pxH);
      return { pxW, pxH };
    };

    const worker = new Worker(new URL('../workers/wavePhysics.worker.js', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    worker.onmessage = (event) => {
      if (disposed || event.data?.type !== 'frame') return;
      renderer.render(event.data);
    };

    const { pxW, pxH } = applyCanvasSize();
    worker.postMessage({
      type: 'init',
      width: pxW,
      height: pxH,
      hover: isHovered,
      variant,
    });

    const onResize = () => {
      const size = applyCanvasSize();
      worker.postMessage({ type: 'resize', width: size.pxW, height: size.pxH });
    };

    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      worker.postMessage({ type: 'stop' });
      worker.terminate();
      workerRef.current = null;
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    workerRef.current?.postMessage({
      type: 'config',
      hover: isHovered,
      variant,
    });
  }, [isHovered, variant]);

  return (
    <canvas
      ref={canvasRef}
      className="ps3-wave-canvas-substrate"
      aria-hidden="true"
    />
  );
}

export default WaveCanvas;
