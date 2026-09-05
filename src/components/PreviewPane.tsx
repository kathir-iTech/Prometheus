// src/components/PreviewPane.tsx
'use client';

import Link from 'next/link';
import { ScoreRing } from './ScoreRing';
import { SectionLabel } from './SectionLabel';
import { TokenPill } from './TokenPill';
import type { RubricScore } from '@/types/argument';

function formatSigned(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export function PreviewPane({
  firstPassScore,
  revisedScore,
  prediction,
  sourceCitation,
  trackId,
  stageLabel = 'Live preview',
  compact = false,
}: {
  firstPassScore?: RubricScore | null;
  revisedScore?: RubricScore | null;
  prediction?: number;
  sourceCitation?: string;
  trackId?: string;
  stageLabel?: string;
  compact?: boolean;
}) {
  const hasVerdict = !!(firstPassScore && revisedScore);
  const actual = revisedScore
    ? Math.round((revisedScore.rigor + revisedScore.evidence + revisedScore.clarity) / 3)
    : null;

  const delta = (a?: number, b?: number) =>
    a !== undefined && b !== undefined ? b - a : 0;

  const status = hasVerdict
    ? 'Verdict ready'
    : firstPassScore
      ? 'Challenged — defend next'
      : 'Awaiting claim';

  const trajectory: { l: string; v: number }[] | null = firstPassScore
    ? [
        { l: 'Rigor', v: firstPassScore.rigor },
        { l: 'Evidence', v: firstPassScore.evidence },
        { l: 'Clarity', v: firstPassScore.clarity },
      ]
    : null;

  return (
    <aside className="glass-deep glow-amber sticky top-6 hidden w-[400px] shrink-0 flex-col gap-5 self-start rounded-3xl p-6 lg:flex">
      <div className="flex items-center justify-between">
        <SectionLabel amberDot>{stageLabel}</SectionLabel>
        <TokenPill live={hasVerdict} tone={hasVerdict ? 'amber' : 'neutral'}>
          {status}
        </TokenPill>
      </div>

      {/* Scores */}
      <div>
        <SectionLabel className="mb-3">Rubric trajectory</SectionLabel>
        {hasVerdict ? (
          <div className="glass-ethereal flex items-center justify-around rounded-2xl px-2 py-5">
            <ScoreRing label="Rigor" from={firstPassScore!.rigor} to={revisedScore!.rigor} />
            <ScoreRing label="Evidence" from={firstPassScore!.evidence} to={revisedScore!.evidence} />
            <ScoreRing label="Clarity" from={firstPassScore!.clarity} to={revisedScore!.clarity} />
          </div>
        ) : trajectory ? (
          <div className="glass-ethereal rounded-2xl p-5">
            <div className="flex items-end justify-between gap-2">
              {trajectory.map((b) => (
                <div key={b.l} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-24 w-full items-end justify-center rounded-xl bg-white/[0.03] p-1.5">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-[#F39C12] via-[#FF9E64] to-[#FFB077] opacity-80"
                      style={{ height: `${Math.min(Math.max(b.v, 4), 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280]">
                    {b.l} · {b.v}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-white/40">
              First-pass scores from the analysis. Defend to move them.
            </p>
          </div>
        ) : (
          <div className="glass-ethereal rounded-2xl p-5">
            <div className="flex items-end justify-between gap-2" aria-hidden="true">
              {['Rigor', 'Evidence', 'Clarity'].map((l) => (
                <div key={l} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-24 w-full items-end justify-center rounded-xl bg-white/[0.03] p-1.5">
                    <div className="w-full rounded-lg bg-white/[0.06]" style={{ height: '6%' }} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280]">
                    {l}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-white/40">
              Awaiting your claim — trajectory appears after analysis.
            </p>
          </div>
        )}
      </div>

      {/* Prediction meter */}
      <div>
        <SectionLabel className="mb-3">Calibration</SectionLabel>
        <div className="glass-ethereal rounded-2xl p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-white/50">Predicted</span>
            <span className="text-2xl font-bold tracking-tight text-white">
              {prediction ?? 50}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FFB077] via-[#FF9E64] to-[#F39C12]"
              style={{ width: `${prediction ?? 50}%` }}
            />
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-white/[0.06] pt-3">
            <span className="text-xs text-white/50">Actual average</span>
            <span className="text-lg font-bold tracking-tight text-amber-core">
              {actual ?? '—'}
            </span>
          </div>
          {hasVerdict && prediction !== undefined && actual !== null && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <TokenPill
                tone={Math.abs(prediction - actual) <= 10 ? 'green' : 'amber'}
                title="Absolute gap between your prediction and the actual average"
              >
                off by {Math.abs(prediction - actual)} pts
                {Math.abs(prediction - actual) <= 10 ? ' · calibrated' : ' · miscalibrated'}
              </TokenPill>
              {(['rigor', 'evidence', 'clarity'] as const).map((k) => {
                const d = delta(firstPassScore?.[k], revisedScore?.[k]);
                return (
                  <TokenPill key={k} tone="neutral" title={`First-pass to revised change in ${k}`}>
                    {k} {formatSigned(d)}
                  </TokenPill>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Source */}
      <div>
        <SectionLabel className="mb-3">Source vault</SectionLabel>
        <div className="rounded-2xl border border-amber-core/25 bg-gradient-to-b from-[rgba(255,176,119,0.12)] to-[rgba(243,156,18,0.05)] p-5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FFB077]">
            {trackId === 'sandbox'
              ? 'Sandbox — No fixed source'
              : hasVerdict
                ? 'Source unsealed'
                : 'Source sealed'}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-white/85">
            {trackId === 'sandbox'
              ? "This was the AI's own assessment."
              : hasVerdict
                ? sourceCitation
                : 'Defend your argument to unlock the withheld evidence.'}
          </p>
        </div>
      </div>

      {!compact && (
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-4 text-[12px] text-white/40">
          <Link href="/progress" className="transition-colors duration-300 ease-expo hover:text-amber-core">
            View progress →
          </Link>
          <span>Stored locally</span>
        </div>
      )}
    </aside>
  );
}
