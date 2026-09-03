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
    <main className="relative z-10 min-h-screen bg-black text-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-mono text-xl font-bold tracking-tight text-cyan-300">{track.title}</h1>

        {error && (
          <p className="mt-4 rounded-none border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>
        )}

        <AnimatePresence mode="wait">
          {stage === 'claim' && (
            <motion.div key="claim" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="mt-8 space-y-4">
              <textarea
                className="h-40 w-full rounded-none border border-white/15 bg-white/[0.02] p-4 text-sm text-white placeholder-white/30 focus:border-cyan-400/50 focus:outline-none"
                value={studentArgument}
                onChange={(e) => setStudentArgument(e.target.value)}
                placeholder="Write your argument…"
              />
              <div className="flex gap-3">
                <button onClick={() => setStudentArgument(EXAMPLE_ARGUMENTS[track.id])} className="rounded-none border border-cyan-400/40 bg-cyan-400/[0.05] px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-cyan-300 transition hover:bg-cyan-400/10">
                  Try an example
                </button>
                <button onClick={handleSubmitClaim} disabled={!studentArgument.trim() || !!loading} className="rounded-none bg-cyan-400 px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-black transition hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-30">
                  Submit
                </button>
              </div>
              {loading && <LoadingState label={loading} />}
            </motion.div>
          )}

          {stage === 'challenge' && (
            <motion.div key="challenge" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="mt-8 space-y-4">
              <SegmentDisplay segments={segments} ungrounded={trackId === 'sandbox'} />
              <div className="rounded-none border border-white/15 bg-white/[0.02] p-5">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-cyan-400">&gt; Socratic question</p>
                <p className="mt-2 text-base text-white/90">{socraticQuestion}</p>
              </div>
              <SealedSource ungrounded={trackId === 'sandbox'} />
              <button onClick={() => setStage('defend')} className="w-full rounded-none bg-cyan-400 px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-black transition hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                Revise my argument
              </button>
            </motion.div>
          )}

          {stage === 'defend' && (
            <motion.div key="defend" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="mt-8 space-y-4">
              <textarea
                className="h-40 w-full rounded-none border border-white/15 bg-white/[0.02] p-4 text-sm text-white placeholder-white/30 focus:border-cyan-400/50 focus:outline-none"
                value={revisedArgument}
                onChange={(e) => setRevisedArgument(e.target.value)}
                placeholder="Rewrite your argument in response to the question above…"
              />
              <button onClick={() => setStage('predict')} disabled={!revisedArgument.trim()} className="rounded-none bg-cyan-400 px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-black transition hover:bg-cyan-300 disabled:opacity-30">
                Continue
              </button>
            </motion.div>
          )}

          {stage === 'predict' && (
            <motion.div key="predict" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="mt-8 space-y-5">
              <p className="font-mono text-xs uppercase tracking-wider text-white/50">Before you see your score — how strong is your revised argument?</p>
              <input type="range" min={1} max={100} value={prediction} onChange={(e) => setPrediction(Number(e.target.value))} className="w-full accent-cyan-400" />
              <p className="text-center font-mono text-4xl font-bold text-cyan-300">{prediction}</p>
              <button onClick={handleSubmitRevision} disabled={!!loading} className="w-full rounded-none bg-cyan-400 px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-black transition hover:bg-cyan-300 disabled:opacity-30">
                See my verdict
              </button>
              {loading && <LoadingState label={loading} />}
            </motion.div>
          )}

          {stage === 'verdict' && firstPassScore && revisedScore && (
            <motion.div key="verdict" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="mt-8 space-y-6">
              {(['rigor', 'evidence', 'clarity'] as const).map((dim, i) => (
                <motion.div key={dim} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}>
                  <div className="mb-1 flex justify-between font-mono text-xs uppercase tracking-wider text-white/50">
                    <span>{dim}</span>
                    <span className="font-semibold text-cyan-300">
                      {firstPassScore[dim]} → <AnimatedScore from={firstPassScore[dim]} to={revisedScore[dim]} />
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden bg-white/10">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${revisedScore[dim]}%` }} transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }} className="h-full bg-cyan-400" />
                  </div>
                </motion.div>
              ))}

              <div className="rounded-none border border-white/15 bg-white/[0.02] p-4 font-mono text-xs">
                <p className="text-white/50">PREDICTED: <span className="text-white">{prediction}</span></p>
                <p className="mt-1 text-white/50">ACTUAL: <span className="text-white">{Math.round((revisedScore.rigor + revisedScore.evidence + revisedScore.clarity) / 3)}</span></p>
              </div>

              {remediationPointer() && (
                <p className="rounded-none border border-amber-500/40 bg-amber-950/20 p-4 text-sm text-amber-200">{remediationPointer()}</p>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.3, 1, 0.5, 1] }}
                transition={{ delay: 0.6, duration: 0.9, times: [0, 0.2, 0.35, 0.5, 0.65, 1] }}
                className="hud-corners relative rounded-none border border-fuchsia-400/50 bg-fuchsia-400/[0.04] p-6 shadow-[0_0_30px_rgba(232,121,249,0.35)]"
              >
                <p className="text-center font-mono text-xs font-bold uppercase tracking-[0.25em] text-fuchsia-300">
                  {trackId === 'sandbox' ? '[ SANDBOX — NO FIXED SOURCE ]' : '[ SOURCE UNSEALED ]'}
                </p>
                <p className="mt-3 text-center text-sm text-white/90">
                  {trackId === 'sandbox' ? "This was the AI's own assessment — there's no fixed source to reveal." : sourceCitation}
                </p>
              </motion.div>

              <div className="flex items-center justify-between pt-2 font-mono text-xs uppercase tracking-wider text-white/40">
                <button onClick={() => setShowCanvas((v) => !v)} className="underline hover:text-cyan-300">
                  {showCanvas ? 'Hide' : 'Show'} dependency map
                </button>
                <Link href="/progress" className="underline hover:text-cyan-300">View progress</Link>
              </div>
              {showCanvas && <DependencyCanvas segments={segments} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
