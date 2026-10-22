/**
 * AnimationController-style helpers for CustomPainter ports (SVG redraw on the JS thread).
 * Declarative, view-level animations use Reanimated directly in the screens.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export const Curves = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - (1 - t) * (1 - t),
  easeIn: (t: number) => t * t,
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  elasticOut: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

/** Flutter Interval(begin, end, curve) */
export function interval(t: number, begin: number, end: number, curve: (x: number) => number = Curves.linear) {
  if (t <= begin) return 0;
  if (t >= end) return 1;
  return curve((t - begin) / (end - begin));
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Minimal AnimationController: value in [0,1], forward()/repeat()/reverse-repeat via rAF.
 */
export function useController({
  duration, repeat = false, reverse = false, autoStart = false,
}: { duration: number; repeat?: boolean; reverse?: boolean; autoStart?: boolean }) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef(0);
  const mode = useRef<'forward' | 'repeat' | 'stopped'>('stopped');

  const stop = useCallback(() => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
    raf.current = null;
    mode.current = 'stopped';
  }, []);

  const loop = useCallback(
    (now: number) => {
      const elapsed = now - start.current;
      let t = elapsed / duration;
      if (mode.current === 'repeat') {
        if (reverse) {
          const cycle = Math.floor(t);
          const frac = t - cycle;
          t = cycle % 2 === 0 ? frac : 1 - frac;
        } else t = t % 1;
        setValue(t);
        raf.current = requestAnimationFrame(loop);
      } else {
        if (t >= 1) { setValue(1); stop(); return; }
        setValue(t);
        raf.current = requestAnimationFrame(loop);
      }
    },
    [duration, reverse, stop],
  );

  const forward = useCallback(() => {
    stop();
    mode.current = 'forward';
    start.current = performance.now();
    raf.current = requestAnimationFrame(loop);
  }, [loop, stop]);

  const startRepeat = useCallback(() => {
    stop();
    mode.current = 'repeat';
    start.current = performance.now();
    raf.current = requestAnimationFrame(loop);
  }, [loop, stop]);

  const reset = useCallback(() => { stop(); setValue(0); }, [stop]);

  useEffect(() => {
    if (autoStart) (repeat ? startRepeat : forward)();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { value, forward, repeat: startRepeat, reset, stop };
}

/** Deterministic PRNG (Flutter used math.Random(42); Dart's generator is not reproducible in JS). */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** SVG arc path helper (angles in radians, 0 = +x axis, clockwise like Flutter canvas). */
export function arcPath(cx: number, cy: number, r: number, start: number, sweep: number) {
  const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(start + sweep), y2 = cy + r * Math.sin(start + sweep);
  const large = Math.abs(sweep) > Math.PI ? 1 : 0;
  const dir = sweep >= 0 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} ${dir} ${x2} ${y2}`;
}
