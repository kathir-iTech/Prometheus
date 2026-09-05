// src/components/SegmentDisplay.tsx
'use client';

import type { ArgumentSegment, SegmentType } from '@/types/argument';
import { TokenPill } from './TokenPill';

const LABEL_MAP: Record<SegmentType, { label: string; pill: 'amber' | 'green' | 'red'; card: string }> = {
  unsupported_claim: { label: 'Needs Defense', pill: 'amber', card: 'border-amber-core/25 bg-amber-core/[0.08] text-amber-100' },
  reasoning_error: { label: 'Needs Defense', pill: 'amber', card: 'border-amber-core/25 bg-amber-core/[0.08] text-amber-100' },
  knowledge_gap: { label: 'Needs Defense', pill: 'amber', card: 'border-amber-core/25 bg-amber-core/[0.08] text-amber-100' },
  premise_conflict: { label: 'Conflicts with Evidence', pill: 'red', card: 'border-red-300/25 bg-red-400/10 text-red-100' },
  normal: { label: 'Supported', pill: 'green', card: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100' },
};

export function SegmentDisplay({ segments, ungrounded }: { segments: ArgumentSegment[]; ungrounded?: boolean }) {
  return (
    <div className="space-y-2.5">
      {ungrounded && (
        <div className="glass-ethereal rounded-xl px-3 py-2.5">
          <TokenPill tone="neutral">AI's own assessment — ungrounded, no verified source</TokenPill>
        </div>
      )}
      {segments.map((seg, i) => {
        const meta = LABEL_MAP[seg.type];
        const isFlagged = seg.type !== 'normal';
        return (
          <div
            key={i}
            className={`glow-amber rounded-2xl border p-4 text-sm backdrop-blur-[12px] transition-colors duration-500 ease-expo hover:border-white/[0.12] ${meta.card} ${
              isFlagged
                ? 'border-t-white/[0.08] border-l-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.35),0_0_28px_rgba(255,158,100,0.08)]'
                : ''
            }`}
          >
            <span className="mb-2 block">
              <TokenPill tone={meta.pill} live={isFlagged}>
                {meta.label}
              </TokenPill>
            </span>
            <p className="leading-relaxed text-white/90">{seg.text}</p>
          </div>
        );
      })}
    </div>
  );
}
