// src/components/SegmentDisplay.tsx
'use client';

import type { ArgumentSegment, SegmentType } from '@/types/argument';

const LABEL_MAP: Record<SegmentType, { label: string; className: string }> = {
  unsupported_claim: { label: 'Needs Defense', className: 'border-amber-400 bg-amber-50' },
  reasoning_error: { label: 'Needs Defense', className: 'border-amber-400 bg-amber-50' },
  knowledge_gap: { label: 'Needs Defense', className: 'border-amber-400 bg-amber-50' },
  premise_conflict: { label: 'Conflicts with Evidence', className: 'border-red-400 bg-red-50' },
  normal: { label: 'Supported', className: 'border-green-400 bg-green-50' },
};

export function SegmentDisplay({ segments }: { segments: ArgumentSegment[] }) {
  return (
    <div className="space-y-2">
      {segments.map((seg, i) => {
        const { label, className } = LABEL_MAP[seg.type];
        return (
          <div key={i} className={`rounded-md border-l-4 p-3 text-sm ${className}`}>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              {label}
            </span>
            <p>{seg.text}</p>
          </div>
        );
      })}
    </div>
  );
}
