// src/app/page.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TRACK_METADATA } from '@/lib/track-metadata';

export default function TrackSelectPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-violet-700/20 blur-[130px]" />
      <div className="relative mx-auto max-w-3xl px-6 py-20">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-display text-5xl font-bold tracking-tight"
        >
          VivaMind
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-3 text-lg text-white/60"
        >
          Pick a track. VivaMind won't fix your argument or give you the answer — it'll find the weakest
          point and make you defend it.
        </motion.p>
        <div className="mt-12 grid gap-4">
          {TRACK_METADATA.map((track, i) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
            >
              <Link
                href={`/workspace/${track.id}`}
                className={
                  track.ungraded
                    ? 'group block rounded-2xl border border-dashed border-white/20 p-6 transition hover:border-white/40'
                    : 'group block rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-violet-400/50 hover:bg-white/[0.06]'
                }
              >
                <h2 className="font-display text-xl font-semibold">{track.title}</h2>
                <p className={track.ungraded ? 'mt-1 text-sm text-white/40' : 'mt-1 text-sm text-white/50'}>
                  {track.rubricCriteria.join(' · ')}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
