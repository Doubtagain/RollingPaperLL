import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';

const MAX_FLAKES = 120;

interface Flake {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  phase: number;
  alpha: number;
}

/** canvas 기반 눈 효과. 입자 수는 화면 넓이에 비례(최대 120), reduced-motion 이면 렌더링하지 않음 */
export function Snowfall() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduced) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let flakes: Flake[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const make = (randomY: boolean): Flake => ({
      x: Math.random() * w,
      y: randomY ? Math.random() * h : -5,
      r: 0.8 + Math.random() * 2.2,
      vy: 0.3 + Math.random() * 0.9,
      vx: -0.2 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.4 + Math.random() * 0.5,
    });

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.min(MAX_FLAKES, Math.round((w * h) / 9000));
      while (flakes.length < target) flakes.push(make(true));
      flakes = flakes.slice(0, target);
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.phase += 0.01;
        f.y += f.vy;
        f.x += f.vx + Math.sin(f.phase) * 0.3;
        if (f.y > h + 5) Object.assign(f, make(false));
        if (f.x < -5) f.x = w + 5;
        if (f.x > w + 5) f.x = -5;
        ctx.globalAlpha = f.alpha;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(tick);
    };

    resize();
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced]);

  if (reduced) return null;
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />;
}
