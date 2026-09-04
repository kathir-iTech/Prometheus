// src/app/page.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TRACK_METADATA } from '@/lib/track-metadata';
import { SectionLabel } from '@/components/SectionLabel';
import { TokenPill } from '@/components/TokenPill';

const TRACK_META: Record<string, { time: string; level: string; attempts: string }> = {
  scientific_reasoning: { time: '12 min', level: 'Core', attempts: '2.4k defends' },
  historical_analysis: { time: '15 min', level: 'Core', attempts: '1.8k defends' },
  policy_evaluation: { time: '14 min', level: 'Advanced', attempts: '1.2k defends' },
  sandbox: { time: 'Open', level: 'Ungraded', attempts: 'Playground' },
};

export default function TrackSelectPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[1280px] px-5 py-8 lg:px-8 lg:py-12 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        {/* Expansive workspace */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TokenPill live tone="amber">Socratic engine live</TokenPill>
            <TokenPill tone="neutral">4 tracks</TokenPill>
            <TokenPill tone="neutral">Never reveals the answer</TokenPill>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 text-5xl font-extrabold tracking-tight text-white lg:text-6xl"
          >
            VivaMind
            <span className="bg-gradient-to-r from-[#FFB077] via-[#FF9E64] to-[#F39C12] bg-clip-text text-transparent">
              .
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60"
          >
            Pick a track. VivaMind won't fix your argument or give you the answer — it'll find the
            weakest point and make you defend it.
          </motion.p>

          <div className="mt-6 flex items-center justify-between">
            <SectionLabel amberDot>Select your arena</SectionLabel>
            <Link href="/progress" className="text-xs text-white/40 transition-colors duration-300 ease-expo hover:text-amber-core">
              View progress →
            </Link>
          </div>

          <div className="mt-3 grid gap-3.5">
            {TRACK_METADATA.map((track, i) => {
              const meta = TRACK_META[track.id] ?? { time: '—', level: '—', attempts: '—' };
              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.12 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={`/workspace/${track.id}`}
                    className={
                      track.ungraded
                        ? 'glass-ethereal glow-amber group block rounded-2xl border-dashed p-5 transition-all duration-500 ease-expo hover:border-amber-core/40 hover:backdrop-blur-2xl md:p-6'
                        : 'glass-ethereal glow-amber group block rounded-2xl p-5 transition-all duration-500 ease-expo hover:border-white/[0.12] hover:backdrop-blur-2xl md:p-6'
                    }
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-core">
                            {String(i + 1).padStart(2, '0')} — {meta.level}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-white/25">· {meta.time}</span>
                        </div>
                        <h2 className="mt-1.5 text-lg font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-[#FFD9B8] md:text-xl">
                          {track.title}
                        </h2>
                        <p className="mt-1 text-[13px] text-white/45">{track.rubricCriteria.join(' · ')}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {track.rubricCriteria.map((c) => (
                            <TokenPill key={c} tone={track.ungraded ? 'neutral' : 'amber'}>
                              {c}
                            </TokenPill>
                          ))}
                        </div>
                      </div>
                      <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/50 transition-all duration-500 ease-expo group-hover:border-amber-core/50 group-hover:bg-amber-core/10 group-hover:text-amber-core group-hover:shadow-[0_0_20px_rgba(255,158,100,0.35)]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px] text-white/35">
                      <span>{meta.attempts}</span>
                      <span className="opacity-0 transition-all duration-500 ease-expo group-hover:opacity-100 group-hover:text-amber-core">
                        Enter arena →
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile companion (visible < lg) */}
          <div className="glass-deep mt-6 rounded-3xl p-6 lg:hidden">
            <SectionLabel amberDot>How a round works</SectionLabel>
            <ol className="mt-3 space-y-3 text-sm text-white/65">
              {[
                ['Claim', 'Write your argument in 3–6 sentences.'],
                ['Challenge', 'VivaMind isolates the weakest clause + asks one question.'],
                ['Defend', 'Revise + predict your score (1–100).'],
                ['Verdict', 'Trajectory revealed, source unsealed.'],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-core/12 text-[11px] font-bold text-amber-core">
                    {t[0]}
                  </span>
                  <span><strong className="text-white">{t}.</strong> {d}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Immersive contextual right pane */}
        <aside className="hidden self-start lg:sticky lg:top-6 lg:flex lg:flex-col lg:gap-4">
          <div className="glass-deep glow-amber rounded-3xl p-6">
            <SectionLabel amberDot>How a round works</SectionLabel>
            <ol className="mt-4 space-y-4">
              {[
                ['01', 'Claim', 'Write 3–6 sentences. Try an example to start fast.'],
                ['02', 'Challenge', 'Weakest point flagged. One Socratic question.'],
                ['03', 'Defend', 'Revise + calibrate with a 1–100 prediction.'],
                ['04', 'Verdict', 'Rigor / Evidence / Clarity trajectory + source.'],
              ].map(([n, t, d]) => (
                <li key={n} className="flex gap-3.5">
                  <span className="text-[11px] font-bold tracking-tight text-amber-core">{n}</span>
                  <div>
                    <p className="text-sm font-semibold tracking-tight text-white">{t}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-white/50">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-5 rounded-2xl border border-amber-core/20 bg-amber-core/[0.06] p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FFB077]">House rule</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/80">
                The engine never states the missing evidence. It only asks.
              </p>
            </div>
          </div>

          <div className="glass-ethereal rounded-3xl p-5">
            <SectionLabel>Live pulse</SectionLabel>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                ['2.4k', 'Defends'],
                ['+27', 'Avg Δ'],
                ['4', 'Tracks'],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] py-3">
                  <p className="text-lg font-bold tracking-tight text-white">{v}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#6B7280]">{l}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <TokenPill live tone="amber">Core backlit</TokenPill>
              <TokenPill tone="neutral">40px blur</TokenPill>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
