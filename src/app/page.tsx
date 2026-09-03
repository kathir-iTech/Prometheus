// src/app/page.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TRACK_METADATA } from '@/lib/track-metadata';

export default function TrackSelectPage() {
  return (
    <main className="relative z-10 min-h-screen text-white">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-sky-300 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent"
        >
          VivaMind
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 max-w-xl text-lg text-white/60"
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
                    ? 'glass group block rounded-2xl border-dashed p-6 backdrop-blur-xl transition hover:bg-white/[0.09]'
                    : 'glass group block rounded-2xl p-6 backdrop-blur-xl transition hover:bg-white/[0.09]'
                }
              >
                <h2 className="text-xl font-semibold text-white">{track.title}</h2>
                <p className="mt-1 text-sm text-white/50">{track.rubricCriteria.join(' · ')}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
