'use client';

import Link from 'next/link';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[640px] px-5 py-20 text-center">
        <div className="glass-ethereal rounded-3xl p-10">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FFB077]">
            Something broke mid-round
          </p>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
            That wasn&apos;t your argument&apos;s fault.
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-white/60">
            Something went wrong on our side. Try again, or head back to the tracks.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => reset()}
              className="btn-amber rounded-full px-7 py-2.5 text-sm font-bold tracking-tight"
            >
              Try again
            </button>
            <Link
              href="/"
              className="glass-ethereal rounded-full px-7 py-2.5 text-sm text-white/75 transition-colors duration-300 hover:text-white"
            >
              Back to tracks
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
