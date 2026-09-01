// src/app/progress/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { readLedger, type LedgerEntry } from '@/lib/ledger';
import { TRACK_METADATA } from '@/lib/track-metadata';

function average(scores: number[]) {
  return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}

export default function ProgressPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    setEntries(readLedger());
  }, []);

  if (entries.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-xl font-semibold">Your progress</h1>
        <p className="mt-4 text-sm text-gray-500">
          No completed exercises yet on this browser. Progress is stored locally, so it won't
          appear on a different browser or after clearing site data.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-xl font-semibold">Your progress</h1>
      <div className="mt-6 space-y-6">
        {TRACK_METADATA.map((track) => {
          const trackEntries = entries.filter((e) => e.trackId === track.id);
          if (trackEntries.length === 0) return null;
          return (
            <div key={track.id} className="rounded-md border border-gray-200 p-4">
              <h2 className="font-medium">{track.title}</h2>
              <p className="mt-1 text-sm text-gray-500">{trackEntries.length} attempt(s)</p>
              <div className="mt-3 flex items-end gap-1" style={{ height: 60 }}>
                {trackEntries.map((e, i) => {
                  const avg = average([e.revisedScore.rigor, e.revisedScore.evidence, e.revisedScore.clarity]);
                  return (
                    <div key={i} title={`${avg}/100`} className="w-4 rounded-t bg-black" style={{ height: `${Math.max(avg, 4)}%` }} />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
