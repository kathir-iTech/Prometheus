// src/app/page.tsx
'use client';

import Link from 'next/link';
import { TRACK_METADATA } from '@/lib/track-metadata';

export default function TrackSelectPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">VivaMind</h1>
      <p className="mt-2 text-gray-600">
        Pick a track. VivaMind won't fix your argument or give you the answer — it'll find the
        weakest point and make you defend it.
      </p>
      <div className="mt-10 grid gap-4">
        {TRACK_METADATA.map((track) => (
          <Link
            key={track.id}
            href={`/workspace/${track.id}`}
            className="rounded-lg border border-gray-200 p-5 transition hover:border-gray-400 hover:shadow-sm"
          >
            <h2 className="font-semibold">{track.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{track.rubricCriteria.join(' · ')}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
