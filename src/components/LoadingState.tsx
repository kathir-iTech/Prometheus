// src/components/LoadingState.tsx
'use client';

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
      {label}
    </div>
  );
}
