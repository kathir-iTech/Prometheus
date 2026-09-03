// src/components/SealedSource.tsx
'use client';

import { motion } from 'framer-motion';

export function SealedSource({ ungrounded }: { ungrounded?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="hud-corners relative rounded-none border border-cyan-400/40 bg-cyan-400/[0.03] p-6 text-center text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
    >
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="mx-auto mb-3 flex h-11 w-11 items-center justify-center border border-cyan-400/50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="11" width="14" height="9" rx="1" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </motion.div>
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
        {ungrounded ? '[ UNGROUNDED — SANDBOX ]' : '[ SOURCE SEALED ]'}
      </p>
      <p className="mt-2 font-mono text-[11px] text-cyan-400/50">
        {ungrounded ? "AI's own assessment — no verified source." : "Unlocks after you defend your argument."}
      </p>
    </motion.div>
  );
}
