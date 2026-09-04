'use client';

import { motion } from 'framer-motion';

const STEPS = ['Claim', 'Challenge', 'Defend', 'Verdict'];

export function ProgressRail({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="mb-10 flex items-center">
      {STEPS.map((step, i) => (
        <div key={step} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <motion.div
              animate={{
                scale: i === activeIndex ? 1.3 : 1,
                backgroundColor: i <= activeIndex ? '#e879f9' : 'rgba(255,255,255,0.15)',
              }}
              transition={{ duration: 0.3 }}
              className="h-2.5 w-2.5 rounded-full"
            />
            <span className={`text-[10px] uppercase tracking-wide ${i <= activeIndex ? 'text-white/70' : 'text-white/30'}`}>
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="mx-2 h-px flex-1 bg-white/10">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: i < activeIndex ? '100%' : '0%' }}
                transition={{ duration: 0.4 }}
                className="h-full bg-fuchsia-400"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
