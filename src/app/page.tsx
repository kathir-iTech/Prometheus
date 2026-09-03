// src/app/page.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TRACK_METADATA } from '@/lib/track-metadata';

export default function TrackSelectPage() {
  return (
    <main className="relative z-10 min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="font-mono text-4xl font-bold tracking-tight text-cyan-300"
        >
          VivaMind<span className="cursor-blink text-cyan-400">_</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 max-w-xl text-base text-white/60"
        >
          Pick a track. VivaMind won't fix your argument or give you the answer — it'll find the weakest
          point and make you defend it.
        </motion.p>
        <div className="mt-12 grid gap-3">
          {TRACK_METADATA.map((track, i) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
            >
              <Link
                href={`/workspace/${track.id}`}
                className={
                  track.ungraded
                    ? 'group block rounded-none border border-dashed border-white/20 p-6 transition hover:border-cyan-400/40'
                    : 'group block rounded-none border border-white/15 bg-white/[0.02] p-6 transition hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.12)]'
                }
              >
                <h2 className="font-mono text-lg font-semibold text-white group-hover:text-cyan-300">
                  {track.title}
                </h2>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-white/40">
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
