'use client';

import { useId } from 'react';
import { motion } from 'framer-motion';
import { AnimatedScore } from './AnimatedScore';

export function ScoreRing({ label, from, to }: { label: string; from: number; to: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(to, 2) / 100) * circumference;
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(48px_at_50%_30%,rgba(255,158,100,0.22),transparent_70%)]" />
        <svg className="relative h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <motion.circle
            cx="40" cy="40" r={radius} fill="none"
            stroke={`url(#amber-${gid})`} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ filter: 'drop-shadow(0 0 6px rgba(255,158,100,0.55))' }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />
          <defs>
            <linearGradient id={`amber-${gid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFB077" />
              <stop offset="50%" stopColor="#FF9E64" />
              <stop offset="100%" stopColor="#F39C12" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-base font-bold tracking-tight text-white">
          <AnimatedScore from={from} to={to} />
        </div>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280]">{label}</span>
    </div>
  );
}
