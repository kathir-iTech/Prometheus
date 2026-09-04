// src/components/LoadingState.tsx
'use client';

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="glass-ethereal flex items-center gap-3 rounded-full px-5 py-3 text-sm text-white/70">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#FF9E64] shadow-[0_0_10px_rgba(255,158,100,0.4)]" />
      {label}
    </div>
  );
}
