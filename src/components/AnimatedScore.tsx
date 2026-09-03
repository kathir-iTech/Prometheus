// src/components/AnimatedScore.tsx
'use client';

import { useEffect, useState } from 'react';

export function AnimatedScore({ from, to, duration = 1200 }: { from: number; to: number; duration?: number }) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    let start: number | null = null;
    let raf: number;
    function step(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [from, to, duration]);

  return <span>{value}</span>;
}
