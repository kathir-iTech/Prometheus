"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

type RingProps = {
  title: string;
  value: number;
  max?: number;
  className?: string;
};

export function Ring({ title, value, max = 100, className }: RingProps) {
  const percentage = (value / max) * 100;
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(count, percentage, {
      duration: 0.8,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [percentage, count]);

  return (
    <div className={`group ${className || ""}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium tracking-tight text-zinc-700">{title}</span>
        <span className="font-mono text-xs text-zinc-500">{value}/{max}</span>
      </div>
      <div className="w-32 h-32 sm:w-36 sm:h-36 relative">
        <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
          <circle
            className="stroke-zinc-200"
            cx="16"
            cy="16"
            r={radius}
            fill="none"
            strokeWidth="3"
          />
          <circle
            className="stroke-primary"
            cx="16"
            cy="16"
            r={radius}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-3xl font-semibold tracking-tight text-zinc-900"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {rounded}
          </motion.span>
        </div>
      </div>
    </div>
  );
}
