// src/app/workspace/[trackId]/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SealedSource } from '@/components/SealedSource';
import { AnimatedScore } from '@/components/AnimatedScore';
import { TRACK_METADATA } from '@/lib/track-metadata';
import { EXAMPLE_ARGUMENTS } from '@/lib/example-arguments';
import { SegmentDisplay } from '@/components/SegmentDisplay';
import { LoadingState } from '@/components/LoadingState';
import { appendLedgerEntry } from '@/lib/ledger';
import { DependencyCanvas } from '@/components/DependencyCanvas';
import Link from 'next/link';
import type { TrackId, ArgumentSegment, RubricScore } from '@/types/argument';

type Stage = 'claim' | 'challenge' | 'defend' | 'predict' | 'verdict';

export default function WorkspacePage() {
  const { trackId } = useParams<{ trackId: TrackId }>();
  const track = TRACK_METADATA.find((t) => t.id === trackId);

  const [stage, setStage] = useState<Stage>('claim');
  const [studentArgument, setStudentArgument] = useState('');
  const [segments, setSegments] = useState<ArgumentSegment[]>([]);
  const [socraticQuestion, setSocraticQuestion] = useState('');
  const [firstPassScore, setFirstPassScore] = useState<RubricScore | null>(null);
  const [revisedArgument, setRevisedArgument] = useState('');
  const [prediction, setPrediction] = useState(50);
  const [revisedScore, setRevisedScore] = useState<RubricScore | null>(null);
  const [sourceCitation, setSourceCitation] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);

  if (!track) return <p className="p-8">Unknown track.</p>;

  async function handleSubmitClaim() {
    setError(null);
    setLoading('Analyzing your argument…');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, studentArgument }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed.');
      setSegments(data.segments);
      setSocraticQuestion(data.socraticQuestion);
      setFirstPassScore(data.firstPassScore);
      setStage('challenge');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleSubmitRevision() {
    setError(null);
    setLoading('Scoring your revision…');
    try {
      const res = await fetch('/api/verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, revisedArgument }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Scoring failed.');
      setRevisedScore(data.revisedScore);
      setSourceCitation(data.sourceCitation);
      setStage('verdict');
      if (trackId !== 'sandbox') {
        appendLedgerEntry({
          trackId: trackId as TrackId,
          timestamp: Date.now(),
          firstPassScore: data.revisedScore ? firstPassScore! : firstPassScore!,
          revisedScore: data.revisedScore,
          prediction,
        });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  }

  // Lightweight remediation pointer: uses only pass-1 segment data (no
  // second segment-analysis call exists), so this points back at the
  // original flagged segment rather than re-diagnosing the revision.
  function remediationPointer(): string | null {
    if (!firstPassScore || !revisedScore) return null;
    const before = firstPassScore.rigor + firstPassScore.evidence + firstPassScore.clarity;
    const after = revisedScore.rigor + revisedScore.evidence + revisedScore.clarity;
    if (after > before) return null;
    const flagged = segments.find((s) => s.type !== 'normal');
    if (!flagged) return null;
    return `Your first draft's issue may still need more support — re-check this part: "${flagged.text}"`;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet-700/20 blur-[120px]" />
      <div className="relative mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-2xl font-bold tracking-tight">{track.title}</h1>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>
        )}

        <AnimatePresence mode="wait">
          {stage === 'claim' && (
            <motion.div key="claim" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="mt-8 space-y-4">
              <textarea
                className="h-40 w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-white/30 backdrop-blur focus:border-violet-400/50 focus:outline-none"
                value={studentArgument}
                onChange={(e) => setStudentArgument(e.target.value)}
                placeholder="Write your argument…"
              />
              <div className="flex gap-3">
                <button onClick={() => setStudentArgument(EXAMPLE_ARGUMENTS[track.id])} className="rounded-full border border-white/20 px-5 py-2.5 text-sm text-white/80 transition hover:border-white/40 hover:text-white">
                  Try an example
                </button>
                <button onClick={handleSubmitClaim} disabled={!studentArgument.trim() || !!loading} className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 disabled:opacity-30">
                  Submit
                </button>
              </div>
              {loading && <LoadingState label={loading} />}
            </motion.div>
          )}

          {stage === 'challenge' && (
            <motion.div key="challenge" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="mt-8 space-y-4">
              <SegmentDisplay segments={segments} ungrounded={trackId === 'sandbox'} />
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">Socratic question</p>
                <p className="mt-2 text-base text-white/90">{socraticQuestion}</p>
              </div>
              <SealedSource ungrounded={trackId === 'sandbox'} />
              <button onClick={() => setStage('defend')} className="w-full rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500">
                Revise my argument
              </button>
            </motion.div>
          )}

          {stage === 'defend' && (
            <motion.div key="defend" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="mt-8 space-y-4">
              <textarea
                className="h-40 w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-white/30 focus:border-violet-400/50 focus:outline-none"
                value={revisedArgument}
                onChange={(e) => setRevisedArgument(e.target.value)}
                placeholder="Rewrite your argument in response to the question above…"
              />
              <button onClick={() => setStage('predict')} disabled={!revisedArgument.trim()} className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 disabled:opacity-30">
                Continue
              </button>
            </motion.div>
          )}

          {stage === 'predict' && (
            <motion.div key="predict" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="mt-8 space-y-5">
              <p className="text-sm text-white/70">Before you see your score — how strong do you think your revised argument is now?</p>
              <input type="range" min={1} max={100} value={prediction} onChange={(e) => setPrediction(Number(e.target.value))} className="w-full accent-violet-500" />
              <p className="text-center font-display text-4xl font-bold text-violet-300">{prediction}</p>
              <button onClick={handleSubmitRevision} disabled={!!loading} className="w-full rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 disabled:opacity-30">
                See my verdict
              </button>
              {loading && <LoadingState label={loading} />}
            </motion.div>
          )}

          {stage === 'verdict' && firstPassScore && revisedScore && (
            <motion.div key="verdict" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="mt-8 space-y-6">
              {(['rigor', 'evidence', 'clarity'] as const).map((dim, i) => (
                <motion.div key={dim} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}>
                  <div className="mb-1 flex justify-between text-sm text-white/70">
                    <span className="capitalize">{dim}</span>
                    <span className="font-semibold text-white">
                      {firstPassScore[dim]} → <AnimatedScore from={firstPassScore[dim]} to={revisedScore[dim]} />
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${revisedScore[dim]}%` }} transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-violet-500 to-violet-300" />
                  </div>
                </motion.div>
              ))}

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <p className="text-white/60">Your prediction: <strong className="text-white">{prediction}</strong></p>
                <p className="mt-1 text-white/60">Actual average: <strong className="text-white">{Math.round((revisedScore.rigor + revisedScore.evidence + revisedScore.clarity) / 3)}</strong></p>
              </div>

              {remediationPointer() && (
                <p className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-200">{remediationPointer()}</p>
              )}

              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 0.6 }} className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-b from-amber-950/40 to-black p-6">
                <motion.div initial={{ rotate: -8, opacity: 0.6 }} animate={{ rotate: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }} className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/60">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-300">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V9a4 4 0 0 1 7.4-2" />
                  </svg>
                </motion.div>
                <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                  {trackId === 'sandbox' ? 'Sandbox — No Fixed Source' : 'Source Unsealed'}
                </p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.6 }} className="mt-3 text-center text-sm text-white/90">
                  {trackId === 'sandbox' ? "This was the AI's own assessment — there's no fixed source to reveal." : sourceCitation}
                </motion.p>
              </motion.div>

              <div className="flex items-center justify-between pt-2 text-sm text-white/50">
                <button onClick={() => setShowCanvas((v) => !v)} className="underline hover:text-white/80">
                  {showCanvas ? 'Hide' : 'Show'} dependency map
                </button>
                <Link href="/progress" className="underline hover:text-white/80">View your progress</Link>
              </div>
              {showCanvas && <DependencyCanvas segments={segments} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
