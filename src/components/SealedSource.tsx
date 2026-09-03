// src/components/SealedSource.tsx
'use client';

import { motion } from 'framer-motion';

export function SealedSource({ ungrounded }: { ungrounded?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-950/40 to-black p-6 text-center"
    >
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-violet-400/50"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-300">
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </motion.div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
        {ungrounded ? 'Ungrounded — Sandbox' : 'Source Sealed'}
      </p>
      <p className="mt-1 text-xs text-white/40">
        {ungrounded ? "This is the AI's own assessment." : "You'll see the real source after you defend your argument."}
      </p>
    </motion.div>
  );
}
