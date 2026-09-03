// src/components/SealedSource.tsx
'use client';

import { motion } from 'framer-motion';

export function SealedSource({ ungrounded }: { ungrounded?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-6 text-center backdrop-blur-xl"
    >
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-200">
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </motion.div>
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
        {ungrounded ? 'Ungrounded — Sandbox' : 'Source Sealed'}
      </p>
      <p className="mt-1 text-xs text-white/40">
        {ungrounded ? "AI's own assessment — no verified source." : "Unlocks after you defend your argument."}
      </p>
    </motion.div>
  );
}
