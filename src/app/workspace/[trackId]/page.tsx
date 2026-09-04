'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { TRACK_METADATA } from '@/lib/track-metadata';
import { EXAMPLE_ARGUMENTS } from '@/lib/example-arguments';
import { SegmentDisplay } from '@/components/SegmentDisplay';
import { LoadingState } from '@/components/LoadingState';
import { SealedSource } from '@/components/SealedSource';
import { DependencyCanvas } from '@/components/DependencyCanvas';
import { ProgressRail } from '@/components/ProgressRail';
import { ScoreRing } from '@/components/ScoreRing';
import { appendLedgerEntry } from '@/lib/ledger';
import type { TrackId, ArgumentSegment, RubricScore } from '@/types/argument';

type Stage = 'claim' | 'challenge' | 'defend' | 'verdict';
const STAGE_INDEX: Record<Stage, number> = { claim: 0, challenge: 1, defend: 2, verdict: 3 };

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

  if (!track) return <p className="p-8 text-white">Unknown track.</p>;

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
      setRevisedArgument(studentArgument);
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
      if (trackId !== 'sandbox') {
        appendLedgerEntry({
          trackId: trackId as TrackId,
          timestamp: Date.now(),
          firstPassScore: firstPassScore!,
          revisedScore: data.revisedScore,
          prediction,
        });
      }
      setStage('verdict');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  }

  function remediationPointer(): string | null {
    if (!firstPassScore || !revisedScore) return null;
    const before = firstPassScore.rigor + firstPassScore.evidence + firstPassScore.clarity;
    const after = revisedScore.rigor + revisedScore.evidence + revisedScore.clarity;
    if (after > before) return null;
    const flagged = segments.find((s) => s.type !== 'normal');
    if (!flagged) return null;
    return `Still worth another look: "${flagged.text}"`;
  }

  return (
    <main className="relative z-10 min-h-screen text-white">
      <div className="mx-auto max-w-2xl px-6 py-14">
        <h1 className="text-xl font-bold tracking-tight text-white">{track.title}</h1>

        <ProgressRail activeIndex={STAGE_INDEX[stage]} />

        {error && (
          <p className="mb-4 rounded-2xl border border-red-300/25 bg-red-400/10 p-3 text-sm text-red-200 backdrop-blur-md">{error}</p>
        )}

        {/* CLAIM — collapses to a summary once challenge exists */}
        {stage === 'claim' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <textarea
              className="glass h-36 w-full rounded-2xl p-4 text-sm text-white placeholder-white/30 backdrop-blur-xl focus:border-white/25 focus:outline-none"
              value={studentArgument}
              onChange={(e) => setStudentArgument(e.target.value)}
              placeholder="Write your argument…"
            />
            <div className="flex gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setStudentArgument(EXAMPLE_ARGUMENTS[track.id])} className="glass rounded-full px-5 py-2.5 text-sm text-white/80 backdrop-blur-xl">
                Try an example
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSubmitClaim} disabled={!studentArgument.trim() || !!loading} className="rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-400 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 disabled:opacity-30">
                Submit
              </motion.button>
            </div>
            {loading && <LoadingState label={loading} />}
          </motion.div>
        ) : (
          <button className="glass mb-6 w-full rounded-2xl p-4 text-left text-sm text-white/50 backdrop-blur-md">
            <span className="mb-1 block text-[10px] uppercase tracking-wide text-white/30">Your claim</span>
            {studentArgument.length > 120 ? studentArgument.slice(0, 120) + '…' : studentArgument}
          </button>
        )}

        {/* CHALLENGE — collapses to a summary once defend exists */}
        <AnimatePresence>
          {stage === 'challenge' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
              <SegmentDisplay segments={segments} ungrounded={trackId === 'sandbox'} />
              <div className="glass rounded-2xl p-5 backdrop-blur-xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-fuchsia-200">Socratic question</p>
                <p className="mt-2 text-base text-white/90">{socraticQuestion}</p>
              </div>
              <SealedSource ungrounded={trackId === 'sandbox'} />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setStage('defend')} className="w-full rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20">
                Defend it
              </motion.button>
            </motion.div>
          )}
          {stage !== 'claim' && stage !== 'challenge' && (
            <div className="glass mb-6 rounded-2xl p-4 text-sm text-white/50 backdrop-blur-md">
              <span className="mb-1 block text-[10px] uppercase tracking-wide text-white/30">Socratic question</span>
              {socraticQuestion}
            </div>
          )}
        </AnimatePresence>

        {/* DEFEND + PREDICT MERGED — one screen, one submit */}
        <AnimatePresence>
          {stage === 'defend' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
              <textarea
                className="glass h-36 w-full rounded-2xl p-4 text-sm text-white placeholder-white/30 backdrop-blur-xl focus:border-white/25 focus:outline-none"
                value={revisedArgument}
                onChange={(e) => setRevisedArgument(e.target.value)}
              />
              <div className="glass rounded-2xl p-4 backdrop-blur-xl">
                <p className="mb-2 text-xs text-white/60">How strong is this now?</p>
                <input type="range" min={1} max={100} value={prediction} onChange={(e) => setPrediction(Number(e.target.value))} className="w-full accent-fuchsia-400" />
                <p className="mt-1 text-center text-2xl font-bold text-white">{prediction}</p>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSubmitRevision} disabled={!revisedArgument.trim() || !!loading} className="w-full rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 disabled:opacity-30">
                See my verdict
              </motion.button>
              {loading && <LoadingState label={loading} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* VERDICT */}
        {stage === 'verdict' && firstPassScore && revisedScore && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass flex justify-around rounded-2xl p-6 backdrop-blur-xl">
              <ScoreRing label="Rigor" from={firstPassScore.rigor} to={revisedScore.rigor} />
              <ScoreRing label="Evidence" from={firstPassScore.evidence} to={revisedScore.evidence} />
              <ScoreRing label="Clarity" from={firstPassScore.clarity} to={revisedScore.clarity} />
            </div>

            <div className="glass rounded-2xl p-4 text-sm backdrop-blur-xl">
              <p className="text-white/60">Predicted: <strong className="text-white">{prediction}</strong> · Actual: <strong className="text-white">{Math.round((revisedScore.rigor + revisedScore.evidence + revisedScore.clarity) / 3)}</strong></p>
            </div>

            {remediationPointer() && (
              <p className="rounded-2xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm text-amber-100 backdrop-blur-md">{remediationPointer()}</p>
            )}

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="rounded-3xl border border-amber-200/25 bg-amber-300/10 p-6 text-center shadow-[0_0_50px_rgba(252,211,77,0.2)] backdrop-blur-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-200">
                {trackId === 'sandbox' ? 'Sandbox — No Fixed Source' : 'Source Unsealed'}
              </p>
              <p className="mt-3 text-sm text-white/90">
                {trackId === 'sandbox' ? "This was the AI's own assessment." : sourceCitation}
              </p>
            </motion.div>

            <div className="flex justify-between text-sm text-white/50">
              <button onClick={() => setShowCanvas((v) => !v)} className="underline">{showCanvas ? 'Hide' : 'Show'} map</button>
              <Link href="/progress" className="underline">Progress</Link>
            </div>
            {showCanvas && <DependencyCanvas segments={segments} />}
          </motion.div>
        )}
      </div>
    </main>
  );
}
