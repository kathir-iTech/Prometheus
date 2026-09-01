// src/app/workspace/[trackId]/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
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
      appendLedgerEntry({
        trackId: trackId as TrackId,
        timestamp: Date.now(),
        firstPassScore: data.revisedScore ? firstPassScore! : firstPassScore!,
        revisedScore: data.revisedScore,
        prediction,
      });
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
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-xl font-semibold">{track.title}</h1>
      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {stage === 'claim' && (
        <div className="mt-6 space-y-3">
          <textarea
            className="h-40 w-full rounded-md border border-gray-300 p-3 text-sm"
            value={studentArgument}
            onChange={(e) => setStudentArgument(e.target.value)}
            placeholder="Write your argument…"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setStudentArgument(EXAMPLE_ARGUMENTS[track.id])}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm"
            >
              Try an example
            </button>
            <button
              onClick={handleSubmitClaim}
              disabled={!studentArgument.trim() || !!loading}
              className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
            >
              Submit
            </button>
          </div>
          {loading && <LoadingState label={loading} />}
        </div>
      )}

      {stage === 'challenge' && (
        <div className="mt-6 space-y-4">
          <SegmentDisplay segments={segments} />
          <div className="rounded-md border border-gray-300 p-4">
            <p className="text-sm font-medium">Socratic question:</p>
            <p className="mt-1 text-sm">{socraticQuestion}</p>
            <p className="mt-3 rounded bg-gray-100 p-2 text-xs text-gray-500">
              🔒 The answer is not here. You'll see the real source after you defend your argument.
            </p>
          </div>
          <button
            onClick={() => setStage('defend')}
            className="rounded-md bg-black px-4 py-2 text-sm text-white"
          >
            Revise my argument
          </button>
        </div>
      )}

      {stage === 'defend' && (
        <div className="mt-6 space-y-3">
          <textarea
            className="h-40 w-full rounded-md border border-gray-300 p-3 text-sm"
            value={revisedArgument}
            onChange={(e) => setRevisedArgument(e.target.value)}
            placeholder="Rewrite your argument in response to the question above…"
          />
          <button
            onClick={() => setStage('predict')}
            disabled={!revisedArgument.trim()}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {stage === 'predict' && (
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Before you see your score — how strong do you think your revised argument is now?
          </label>
          <input
            type="range"
            min={1}
            max={100}
            value={prediction}
            onChange={(e) => setPrediction(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-sm text-gray-600">{prediction} / 100</p>
          <button
            onClick={handleSubmitRevision}
            disabled={!!loading}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            See my verdict
          </button>
          {loading && <LoadingState label={loading} />}
        </div>
      )}

      {stage === 'verdict' && firstPassScore && revisedScore && (
        <div className="mt-6 space-y-5">
          {(['rigor', 'evidence', 'clarity'] as const).map((dim) => (
            <div key={dim}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="capitalize">{dim}</span>
                <span>
                  {firstPassScore[dim]} → {revisedScore[dim]}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-black transition-all"
                  style={{ width: `${revisedScore[dim]}%` }}
                />
              </div>
            </div>
          ))}

          <div className="rounded-md border border-gray-200 p-4 text-sm">
            <p>Your prediction: <strong>{prediction}</strong></p>
            <p>
              Actual average:{' '}
              <strong>
                {Math.round((revisedScore.rigor + revisedScore.evidence + revisedScore.clarity) / 3)}
              </strong>
            </p>
          </div>

          {remediationPointer() && (
            <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">{remediationPointer()}</p>
          )}

          <div className="rounded-md border border-green-300 bg-green-50 p-4 text-sm">
            <p className="font-medium">Source revealed:</p>
            <p className="mt-1">{sourceCitation}</p>
          </div>

          <div className="pt-2">
            <button onClick={() => setShowCanvas((v) => !v)} className="text-sm text-gray-500 underline">
              {showCanvas ? 'Hide' : 'Show'} dependency map
            </button>
            {showCanvas && <div className="mt-3"><DependencyCanvas segments={segments} /></div>}
          </div>
          <Link href="/progress" className="block pt-2 text-sm text-gray-500 underline">
            View your progress
          </Link>
        </div>
      )}
    </main>
  );
}
