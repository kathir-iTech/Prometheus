'use client';

import { motion } from 'framer-motion';

const STEPS = ['Claim', 'Challenge', 'Defend', 'Verdict'];

export function ProgressRail({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="mb-8 flex items-center">
      {STEPS.map((step, i) => (
        <div key={step} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <motion.div
              animate={{
                scale: i === activeIndex ? 1.35 : 1,
                backgroundColor: i <= activeIndex ? '#FF9E64' : 'rgba(255,255,255,0.12)',
                boxShadow:
                  i === activeIndex
                    ? '0 0 0 1px rgba(255,158,100,0.6), 0 0 18px rgba(255,158,100,0.55)'
                    : i < activeIndex
                      ? '0 0 10px rgba(255,158,100,0.35)'
                      : '0 0 0 rgba(0,0,0,0)',
              }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="h-2.5 w-2.5 rounded-full"
            />
            <span
              className={`text-[10px] font-semibold uppercase tracking-widest ${
                i === activeIndex
                  ? 'text-amber-core'
                  : i < activeIndex
                    ? 'text-white/70'
                    : 'text-white/30'
              }`}
            >
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="mx-2 h-px flex-1 bg-white/[0.08]">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: i < activeIndex ? '100%' : '0%' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-gradient-to-r from-[#FFB077] to-[#F39C12] shadow-[0_0_10px_rgba(255,158,100,0.5)]"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
