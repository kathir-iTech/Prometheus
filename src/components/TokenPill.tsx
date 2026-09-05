// src/components/TokenPill.tsx
'use client';

import { cn } from '@/lib/cn';

type Tone = 'amber' | 'neutral' | 'green' | 'red';

const TONE_DOT: Record<Tone, string> = {
  amber: 'bg-amber-core shadow-[0_0_8px_#FF9E64]',
  neutral: 'bg-white/40',
  green: 'bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)]',
  red: 'bg-red-300 shadow-[0_0_8px_rgba(252,165,165,0.8)]',
};

export function TokenPill({
  children,
  tone = 'amber',
  live = false,
  className,
  title,
}: {
  children: React.ReactNode;
  tone?: Tone;
  live?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/70 backdrop-blur-xl transition-all duration-500 ease-expo',
        className
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', TONE_DOT[tone], live && 'dot-live')}
      />
      {children}
    </span>
  );
}
