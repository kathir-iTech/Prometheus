// src/components/SegmentDisplay.tsx
'use client';

import type { ArgumentSegment, SegmentType } from '@/types/argument';

const LABEL_MAP: Record<SegmentType, { label: string; className: string }> = {
  unsupported_claim: { label: 'Needs Defense', className: 'border-amber-500/40 bg-amber-500/10 text-amber-100' },
  reasoning_error: { label: 'Needs Defense', className: 'border-amber-500/40 bg-amber-500/10 text-amber-100' },
  knowledge_gap: { label: 'Needs Defense', className: 'border-amber-500/40 bg-amber-500/10 text-amber-100' },
  premise_conflict: { label: 'Conflicts with Evidence', className: 'border-red-500/40 bg-red-500/10 text-red-100' },
  normal: { label: 'Supported', className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100' },
};

export function SegmentDisplay({ segments, ungrounded }: { segments: ArgumentSegment[]; ungrounded?: boolean }) {
  return (
    <div className="space-y-2">
      {ungrounded && (
        <p className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white/50">
          AI's own assessment — ungrounded, no verified source.
        </p>
      )}
      {segments.map((seg, i) => {
        const { label, className } = LABEL_MAP[seg.type];
        return (
          <div key={i} className={`rounded-xl border-l-4 p-3 text-sm ${className}`}>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide opacity-70">{label}</span>
            <p>{seg.text}</p>
          </div>
        );
      })}
    </div>
  );
}
