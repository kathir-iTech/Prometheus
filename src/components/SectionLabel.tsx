// src/components/SectionLabel.tsx
'use client';

import { cn } from '@/lib/cn';

export function SectionLabel({
  children,
  className,
  amberDot = false,
}: {
  children: React.ReactNode;
  className?: string;
  amberDot?: boolean;
}) {
  return (
    <p
      className={cn(
        'flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[#6B7280]',
        className
      )}
    >
      {amberDot && (
        <span className="dot-live inline-block h-1.5 w-1.5 rounded-full bg-amber-core shadow-[0_0_8px_#FF9E64]" />
      )}
      {children}
    </p>
  );
}
