// src/components/AppShell.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { UtilitySidebar } from './UtilitySidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Dynamic amber glow tracking: drives --glow-x / --glow-y on .glow-amber cards
  useEffect(() => {
    function onMove(e: MouseEvent) {
      const el = (e.target as HTMLElement)?.closest?.('.glow-amber') as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / Math.max(r.width, 1)) * 100;
      const y = ((e.clientY - r.top) / Math.max(r.height, 1)) * 100;
      el.style.setProperty('--glow-x', `${x.toFixed(1)}%`);
      el.style.setProperty('--glow-y', `${y.toFixed(1)}%`);
    }
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [pathname]);

  return (
    <div className="relative z-10 min-h-screen text-white md:grid md:grid-cols-[72px_minmax(0,1fr)]">
      <UtilitySidebar />

      {/* Mobile top rail */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-[rgba(11,12,14,0.72)] px-5 py-3 backdrop-blur-[24px] md:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-[#FFB077] to-[#F39C12] shadow-[0_0_16px_rgba(255,158,100,0.7)]" />
          <span className="text-sm font-bold tracking-tight text-white">VivaMind</span>
        </Link>
        <div className="flex items-center gap-2 text-[12px] text-white/50">
          <Link href="/" className="rounded-full px-3 py-1.5 hover:bg-white/[0.06] hover:text-white">
            Tracks
          </Link>
          <Link
            href="/progress"
            className="rounded-full border border-amber-core/30 bg-amber-core/10 px-3 py-1.5 text-amber-core"
          >
            Progress
          </Link>
        </div>
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
