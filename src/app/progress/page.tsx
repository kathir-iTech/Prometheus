// src/app/progress/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { readLedger, type LedgerEntry } from '@/lib/ledger';
import { TRACK_METADATA } from '@/lib/track-metadata';
import { SectionLabel } from '@/components/SectionLabel';
import { TokenPill } from '@/components/TokenPill';

function average(scores: number[]) {
  return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}

export default function ProgressPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    setEntries(readLedger());
  }, []);

  const totalAttempts = entries.length;
  const best = entries.length
    ? Math.max(...entries.map((e) => average([e.revisedScore.rigor, e.revisedScore.evidence, e.revisedScore.clarity])))
    : 0;
  const meanDelta = entries.length
    ? Math.round(
        entries.reduce((acc, e) => {
          const b = average([e.firstPassScore.rigor, e.firstPassScore.evidence, e.firstPassScore.clarity]);
          const a = average([e.revisedScore.rigor, e.revisedScore.evidence, e.revisedScore.clarity]);
          return acc + (a - b);
        }, 0) / entries.length
      )
    : 0;

  if (entries.length === 0) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-[1280px] px-5 py-10 lg:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div className="glass-ethereal glow-amber min-w-0 rounded-3xl p-8 md:p-10">
            <TokenPill tone="neutral">No reps logged yet</TokenPill>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Your progress</h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">
              No completed exercises yet on this browser. Progress is stored locally, so it won't
              appear on a different browser or after clearing site data. Run one defense to ignite the chart.
            </p>
            <Link
              href="/"
              className="btn-amber mt-6 inline-block rounded-full px-6 py-2.5 text-sm font-bold tracking-tight"
            >
              Pick a track →
            </Link>
          </div>
          <aside className="glass-deep mt-4 hidden flex-col gap-3 rounded-3xl p-6 lg:flex">
            <SectionLabel amberDot>What gets tracked</SectionLabel>
            {['Attempts per track', 'Rigor / Evidence / Clarity Δ', 'Prediction calibration'].map((t) => (
              <div key={t} className="glass-ethereal rounded-2xl px-4 py-3 text-sm text-white/60">{t}</div>
            ))}
          </aside>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[1280px] px-5 py-8 lg:px-8 lg:py-10 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TokenPill live tone="amber">{totalAttempts} defenses logged</TokenPill>
            <TokenPill tone="neutral">Local ledger</TokenPill>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Your progress</h1>
          <p className="mt-1.5 text-sm text-white/50">Trajectory per track — higher bars mean stronger revisions.</p>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {[
              [String(totalAttempts), 'Attempts'],
              [`+${meanDelta}`, 'Avg improvement'],
              [String(best), 'Best average'],
            ].map(([v, l]) => (
              <div key={l} className="glass-ethereal glow-amber rounded-2xl p-4 text-center">
                <p className="bg-gradient-to-r from-[#FFB077] to-[#F39C12] bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">{v}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-[#6B7280]">{l}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-3.5">
            {TRACK_METADATA.map((track, ti) => {
              const trackEntries = entries.filter((e) => e.trackId === track.id);
              if (trackEntries.length === 0) return null;
              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: ti * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="glass-ethereal glow-amber rounded-3xl p-5 md:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <SectionLabel>{trackEntries.length} attempt{trackEntries.length > 1 ? 's' : ''}</SectionLabel>
                      <h2 className="mt-1 font-bold tracking-tight text-white">{track.title}</h2>
                    </div>
                    <Link
                      href={`/workspace/${track.id}`}
                      className="rounded-full border border-amber-core/30 bg-amber-core/10 px-4 py-1.5 text-xs font-semibold text-amber-core transition-all duration-300 ease-expo hover:shadow-amber-ring"
                    >
                      Train again →
                    </Link>
                  </div>
                  <div className="mt-4 flex h-[96px] items-end gap-1.5 rounded-2xl border border-white/[0.06] bg-black/20 p-3">
                    {trackEntries.map((e, i) => {
                      const avg = average([e.revisedScore.rigor, e.revisedScore.evidence, e.revisedScore.clarity]);
                      const before = average([e.firstPassScore.rigor, e.firstPassScore.evidence, e.firstPassScore.clarity]);
                      return (
                        <div key={i} title={`${before} → ${avg}/100`} className="group relative flex-1">
                          <div
                            className="w-full rounded-t-lg bg-gradient-to-t from-[#F39C12] via-[#FF9E64] to-[#FFB077] shadow-[0_0_14px_rgba(255,158,100,0.35)] transition-all duration-500 ease-expo group-hover:brightness-110"
                            style={{ height: `${Math.max((avg / 100) * 72, 5)}px` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {trackEntries.slice(-4).map((e, i) => {
                      const avg = average([e.revisedScore.rigor, e.revisedScore.evidence, e.revisedScore.clarity]);
                      const cal = Math.abs(e.prediction - avg);
                      return (
                        <TokenPill key={i} tone={cal <= 10 ? 'green' : 'amber'}>
                          #{trackEntries.length - Math.min(trackEntries.length, 4) + i + 1} · {avg} (Δ{cal})
                        </TokenPill>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <aside className="hidden self-start lg:sticky lg:top-6 lg:flex lg:flex-col lg:gap-4">
          <div className="glass-deep glow-amber rounded-3xl p-6">
            <SectionLabel amberDot>Calibration ledger</SectionLabel>
            <div className="mt-4 space-y-3">
              {entries.slice(-5).reverse().map((e, i) => {
                const avg = average([e.revisedScore.rigor, e.revisedScore.evidence, e.revisedScore.clarity]);
                const track = TRACK_METADATA.find((t) => t.id === e.trackId);
                return (
                  <div key={i} className="glass-ethereal rounded-2xl p-3.5">
                    <p className="truncate text-[13px] font-semibold tracking-tight text-white">
                      {track?.title.split(':')[0] ?? e.trackId}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#FFB077] to-[#F39C12]"
                        style={{ width: `${avg}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-white/45">
                      Predicted <span className="text-white">{e.prediction}</span> · Actual{' '}
                      <span className="text-amber-core">{avg}</span>
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 border-t border-white/[0.06] pt-3 text-center text-[11px] text-white/35">
              Stored locally · clears with site data
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
