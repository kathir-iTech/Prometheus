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
import { PreviewPane } from '@/components/PreviewPane';
import { SectionLabel } from '@/components/SectionLabel';
import { TokenPill } from '@/components/TokenPill';
import { appendLedgerEntry } from '@/lib/ledger';
import type { TrackId, ArgumentSegment, RubricScore } from '@/types/argument';

type Stage = 'claim' | 'challenge' | 'defend' | 'verdict';
const STAGE_INDEX: Record<Stage, number> = { claim: 0, challenge: 1, defend: 2, verdict: 3 };
const STAGE_LABEL: Record<Stage, string> = {
  claim: 'Drafting claim',
  challenge: 'Facing challenge',
  defend: 'Defending + calibrating',
  verdict: 'Verdict unsealed',
};

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
    <main className="min-h-screen">
      <div className="mx-auto max-w-[1280px] px-5 py-7 lg:px-8 lg:py-10 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
        {/* Expansive workspace */}
        <div className="min-w-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/40 transition-colors duration-300 ease-expo hover:text-amber-core"
          >
            ← All tracks
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TokenPill live tone="amber">{STAGE_LABEL[stage]}</TokenPill>
            {track.ungraded ? (
              <TokenPill tone="neutral">Sandbox · ungraded</TokenPill>
            ) : (
              <TokenPill tone="neutral">{track.rubricCriteria.join(' · ')}</TokenPill>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-[28px] md:leading-tight">
            {track.title}
          </h1>

          <div className="mt-5">
            <ProgressRail activeIndex={STAGE_INDEX[stage]} />
          </div>

          {error && (
            <p className="mb-4 rounded-2xl border border-red-300/25 bg-red-400/10 p-3.5 text-sm text-red-200 backdrop-blur-[20px]">{error}</p>
          )}

          {/* CLAIM */}
          {stage === 'claim' ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3.5"
            >
              <div>
                <SectionLabel className="mb-2" amberDot>Your claim — 3 to 6 sentences</SectionLabel>
                <textarea
                  className="glass-ethereal h-40 w-full resize-y rounded-2xl p-4 text-[14px] leading-relaxed text-white placeholder-white/30 outline-none transition-all duration-500 ease-expo focus:border-amber-core/50 focus:shadow-amber-ring"
                  value={studentArgument}
                  onChange={(e) => setStudentArgument(e.target.value)}
                  placeholder="Write your argument… e.g. state your thesis, one mechanism, and one piece of evidence."
                />
              </div>
              <div className="flex flex-wrap gap-2.5">
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStudentArgument(EXAMPLE_ARGUMENTS[track.id])}
                  className="btn-ghost glass-ethereal rounded-full px-5 py-2.5 text-sm text-white/75 hover:border-white/[0.12] hover:text-white"
                >
                  Try an example
                </motion.button>
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmitClaim}
                  disabled={!studentArgument.trim() || !!loading}
                  className="btn-amber rounded-full px-7 py-2.5 text-sm font-bold tracking-tight disabled:opacity-30"
                >
                  Submit for challenge →
                </motion.button>
              </div>
              {loading && <LoadingState label={loading} />}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {track.rubricCriteria.map((c) => (
                  <TokenPill key={c} tone="neutral">{c}</TokenPill>
                ))}
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setStage('claim')}
              className="glass-ethereal group mb-5 w-full rounded-2xl p-4 text-left transition-all duration-500 ease-expo hover:border-white/[0.12]"
            >
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-[#6B7280]">
                Your claim — tap to edit
              </span>
              <span className="text-sm leading-relaxed text-white/55">
                {studentArgument.length > 140 ? studentArgument.slice(0, 140) + '…' : studentArgument}
              </span>
            </button>
          )}

          {/* CHALLENGE */}
          <AnimatePresence>
            {stage === 'challenge' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3.5 overflow-hidden"
              >
                <div>
                  <SectionLabel className="mb-2">Weakest-point scan</SectionLabel>
                  <SegmentDisplay segments={segments} ungrounded={trackId === 'sandbox'} />
                </div>
                <div className="glass-ethereal glow-amber rounded-2xl p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FFB077]">
                    Socratic question
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/90">{socraticQuestion}</p>
                </div>
                <SealedSource ungrounded={trackId === 'sandbox'} />
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStage('defend')}
                  className="btn-amber w-full rounded-full px-6 py-3 text-sm font-bold tracking-tight"
                >
                  Defend it →
                </motion.button>
              </motion.div>
            )}
            {stage !== 'claim' && stage !== 'challenge' && (
              <div className="glass-ethereal mb-5 rounded-2xl p-4">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-[#6B7280]">
                  Socratic question
                </span>
                <p className="text-sm leading-relaxed text-white/60">{socraticQuestion}</p>
              </div>
            )}
          </AnimatePresence>

          {/* DEFEND */}
          <AnimatePresence>
            {stage === 'defend' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3.5 overflow-hidden"
              >
                <div>
                  <SectionLabel className="mb-2" amberDot>Your defense — revise fully</SectionLabel>
                  <textarea
                    className="glass-ethereal h-40 w-full resize-y rounded-2xl p-4 text-[14px] leading-relaxed text-white placeholder-white/30 outline-none transition-all duration-500 ease-expo focus:border-amber-core/50 focus:shadow-amber-ring"
                    value={revisedArgument}
                    onChange={(e) => setRevisedArgument(e.target.value)}
                    placeholder="Strengthen the flagged clause with mechanism or evidence…"
                  />
                </div>
                <div className="glass-ethereal rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280]">
                      How strong is this now?
                    </p>
                    <TokenPill tone="amber">{prediction} / 100</TokenPill>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={prediction}
                    onChange={(e) => setPrediction(Number(e.target.value))}
                    className="mt-3 w-full"
                  />
                  <p className="mt-1 text-center text-3xl font-extrabold tracking-tight text-white">
                    {prediction}
                    <span className="ml-1 bg-gradient-to-r from-[#FFB077] to-[#F39C12] bg-clip-text text-lg text-transparent">pts</span>
                  </p>
                </div>
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmitRevision}
                  disabled={!revisedArgument.trim() || !!loading}
                  className="btn-amber w-full rounded-full px-6 py-3 text-sm font-bold tracking-tight disabled:opacity-30"
                >
                  See my verdict →
                </motion.button>
                {loading && <LoadingState label={loading} />}
              </motion.div>
            )}
          </AnimatePresence>

          {/* VERDICT (center column: narrative + map; scores live in PreviewPane) */}
          {stage === 'verdict' && firstPassScore && revisedScore && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {/* Compact score strip for < lg (PreviewPane hidden) */}
              <div className="glass-ethereal flex justify-around rounded-2xl p-5 lg:hidden">
                <ScoreRing label="Rigor" from={firstPassScore.rigor} to={revisedScore.rigor} />
                <ScoreRing label="Evidence" from={firstPassScore.evidence} to={revisedScore.evidence} />
                <ScoreRing label="Clarity" from={firstPassScore.clarity} to={revisedScore.clarity} />
              </div>

              <div className="glass-ethereal rounded-2xl p-4">
                <SectionLabel>Calibration check</SectionLabel>
                <p className="mt-1.5 text-sm text-white/60">
                  Predicted: <strong className="tracking-tight text-white">{prediction}</strong>
                  {' · '}
                  Actual:{' '}
                  <strong className="tracking-tight text-amber-core">
                    {Math.round((revisedScore.rigor + revisedScore.evidence + revisedScore.clarity) / 3)}
                  </strong>
                  {' · '}
                  <span className="text-white/40">
                    {Math.abs(prediction - Math.round((revisedScore.rigor + revisedScore.evidence + revisedScore.clarity) / 3)) <= 10
                      ? 'well calibrated'
                      : 'recalibrate next round'}
                  </span>
                </p>
              </div>

              {remediationPointer() && (
                <p className="rounded-2xl border border-amber-core/25 bg-amber-core/[0.08] p-4 text-sm leading-relaxed text-amber-100 backdrop-blur-[20px]">
                  {remediationPointer()}
                </p>
              )}

              {/* Mobile source card (desktop lives in PreviewPane) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-3xl border border-amber-core/25 bg-gradient-to-b from-[rgba(255,176,119,0.12)] to-[rgba(243,156,18,0.05)] p-6 text-center shadow-[0_0_50px_rgba(255,158,100,0.16)] backdrop-blur-[32px] lg:hidden"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FFB077]">
                  {trackId === 'sandbox' ? 'Sandbox — No Fixed Source' : 'Source Unsealed'}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/90">
                  {trackId === 'sandbox' ? "This was the AI's own assessment." : sourceCitation}
                </p>
              </motion.div>

              <div className="flex items-center justify-between text-[13px]">
                <button
                  onClick={() => setShowCanvas((v) => !v)}
                  className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-white/55 transition-all duration-300 ease-expo hover:border-amber-core/40 hover:text-amber-core"
                >
                  {showCanvas ? 'Hide map' : 'Show dependency map'}
                </button>
                <Link href="/progress" className="text-white/45 transition-colors duration-300 hover:text-amber-core">
                  Progress →
                </Link>
              </div>
              {showCanvas && <DependencyCanvas segments={segments} />}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => { setStage('claim'); setRevisedScore(null); }}
                  className="btn-ghost glass-ethereal rounded-full px-5 py-2 text-[13px] text-white/65 hover:text-white"
                >
                  Run it again
                </button>
                <Link
                  href="/"
                  className="rounded-full border border-white/[0.08] px-5 py-2 text-[13px] text-white/55 transition-all duration-300 ease-expo hover:border-amber-core/40 hover:text-amber-core"
                >
                  Switch track
                </Link>
              </div>
            </motion.div>
          )}
        </div>

        {/* Immersive contextual right pane */}
        <PreviewPane
          firstPassScore={firstPassScore}
          revisedScore={revisedScore}
          prediction={prediction}
          sourceCitation={sourceCitation}
          trackId={trackId}
          stageLabel={STAGE_LABEL[stage]}
        />

        {/* Mobile calibration strip when verdict hidden on desktop pane */}
        {!revisedScore && (
          <div className="mt-6 lg:hidden">
            <div className="glass-ethereal rounded-2xl p-4 text-center text-xs text-white/40">
              Your trajectory, calibration meter and sealed source appear here on desktop —{' '}
              <span className="text-amber-core">backlit at 40px blur</span>.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
