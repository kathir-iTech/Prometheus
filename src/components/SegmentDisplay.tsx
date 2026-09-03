// src/components/SegmentDisplay.tsx
'use client';

import type { ArgumentSegment, SegmentType } from '@/types/argument';

const LABEL_MAP: Record<SegmentType, { label: string; className: string }> = {
  unsupported_claim: { label: 'Needs Defense', className: 'border-amber-300/25 bg-amber-400/10 text-amber-100' },
  reasoning_error: { label: 'Needs Defense', className: 'border-amber-300/25 bg-amber-400/10 text-amber-100' },
  knowledge_gap: { label: 'Needs Defense', className: 'border-amber-300/25 bg-amber-400/10 text-amber-100' },
  premise_conflict: { label: 'Conflicts with Evidence', className: 'border-red-300/25 bg-red-400/10 text-red-100' },
  normal: { label: 'Supported', className: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100' },
};

export function SegmentDisplay({ segments, ungrounded }: { segments: ArgumentSegment[]; ungrounded?: boolean }) {
  return (
    <div className="space-y-2">
      {ungrounded && (
        <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50 backdrop-blur-md">
          AI's own assessment — ungrounded, no verified source.
        </p>
      )}
      {segments.map((seg, i) => {
        const { label, className } = LABEL_MAP[seg.type];
        return (
          <div key={i} className={`rounded-2xl border p-4 text-sm backdrop-blur-md ${className}`}>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide opacity-80">{label}</span>
            <p className="text-white/90">{seg.text}</p>
          </div>
        );
      })}
    </div>
  );
}
