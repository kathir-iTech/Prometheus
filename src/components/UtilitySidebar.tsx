// src/components/UtilitySidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const NAV = [
  {
    href: '/',
    label: 'Tracks',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/workspace/scientific_reasoning',
    label: 'Workspace',
    match: '/workspace',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
        <rect x="8" y="8" width="8" height="8" rx="2" />
      </svg>
    ),
  },
  {
    href: '/progress',
    label: 'Progress',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l5-6 4 4 6-8" />
        <path d="M15 7h3v3" />
      </svg>
    ),
  },
  {
    href: '/workspace/sandbox',
    label: 'Sandbox',
    match: '/workspace/sandbox',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
        <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
      </svg>
    ),
  },
];

export function UtilitySidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-30 hidden h-screen w-[72px] shrink-0 flex-col items-center gap-2 border-r border-white/[0.06] bg-[rgba(18,20,24,0.55)] py-5 backdrop-blur-[16px] md:flex">
      {/* Core mark */}
      <Link
        href="/"
        className="group relative mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[rgba(255,176,119,0.18)] to-[rgba(243,156,18,0.08)] transition-all duration-500 ease-expo hover:border-amber-core/40"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-[#FFB077] to-[#F39C12] shadow-[0_0_16px_rgba(255,158,100,0.7)]" />
        <span className="absolute inset-0 rounded-2xl bg-[radial-gradient(40px_at_50%_0%,rgba(255,158,100,0.25),transparent_70%)]" />
      </Link>

      {NAV.map((item) => {
        const active = item.match
          ? pathname?.startsWith(item.match)
          : pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            title={item.label}
            className={cn(
              'group relative flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-500 ease-expo',
              active
                ? 'border-amber-core/50 bg-white/[0.06] text-amber-core shadow-amber-ring'
                : 'border-transparent bg-transparent text-white/40 hover:border-white/[0.08] hover:bg-white/[0.05] hover:text-white/80 active:scale-[0.94]'
            )}
          >
            {active && (
              <span className="absolute -left-[13px] h-6 w-[2px] rounded-full bg-gradient-to-b from-[#FFB077] to-[#F39C12] shadow-[0_0_12px_rgba(255,158,100,0.8)]" />
            )}
            {item.icon}
            <span className="pointer-events-none absolute left-[52px] z-50 whitespace-nowrap rounded-full border border-white/[0.08] bg-[rgba(18,20,24,0.9)] px-2.5 py-1 text-[11px] text-white/70 opacity-0 backdrop-blur-xl transition-all duration-300 ease-expo group-hover:opacity-100">
              {item.label}
            </span>
          </Link>
        );
      })}

      <div className="mt-auto flex flex-col items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[10px] font-bold tracking-tight text-amber-core">
          VM
        </div>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
      </div>
    </aside>
  );
}
