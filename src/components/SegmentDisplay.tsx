// src/components/SegmentDisplay.tsx
'use client';

import type { ArgumentSegment, SegmentType } from '@/types/argument';

const LABEL_MAP: Record<SegmentType, { label: string; className: string }> = {
  unsupported_claim: { label: 'NEEDS DEFENSE', className: 'border-amber-500/50 bg-amber-500/[0.06] text-amber-200' },
  reasoning_error: { label: 'NEEDS DEFENSE', className: 'border-amber-500/50 bg-amber-500/[0.06] text-amber-200' },
  knowledge_gap: { label: 'NEEDS DEFENSE', className: 'border-amber-500/50 bg-amber-500/[0.06] text-amber-200' },
  premise_conflict: { label: 'CONFLICTS WITH EVIDENCE', className: 'border-red-500/50 bg-red-500/[0.06] text-red-200' },
  normal: { label: 'SUPPORTED', className: 'border-emerald-500/50 bg-emerald-500/[0.06] text-emerald-200' },
};

export function SegmentDisplay({ segments, ungrounded }: { segments: ArgumentSegment[]; ungrounded?: boolean }) {
  return (
    <div className="space-y-2">
      {ungrounded && (
        <p className="rounded-none border border-white/10 bg-white/[0.02] px-3 py-2 font-mono text-[11px] text-white/40">
          [ AI's own assessment — ungrounded, no verified source ]
        </p>
      )}
      {segments.map((seg, i) => {
        const { label, className } = LABEL_MAP[seg.type];
        return (
          <div key={i} className={`rounded-none border-l-2 p-3 text-sm ${className}`}>
            <span className="mb-1 block font-mono text-[10px] font-semibold tracking-[0.2em] opacity-80">
              &gt; {label}
            </span>
            <p className="text-white/90">{seg.text}</p>
          </div>
        );
      })}
    </div>
  );
}
