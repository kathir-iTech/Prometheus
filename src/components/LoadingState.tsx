// src/components/LoadingState.tsx
'use client';

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="glass flex items-center gap-3 rounded-full px-5 py-3 text-sm text-white/70 backdrop-blur-xl">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-fuchsia-300" />
      {label}
    </div>
  );
}
