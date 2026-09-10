import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[640px] px-5 py-20 text-center">
        <div className="glass-ethereal rounded-3xl p-10">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FFB077]">
            Nowhere to defend here
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white">404</h1>
          <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-white/60">
            This page doesn&apos;t exist. Head back and pick a track to argue in.
          </p>
          <Link
            href="/"
            className="btn-amber mt-6 inline-block rounded-full px-7 py-2.5 text-sm font-bold tracking-tight"
          >
            Back to tracks →
          </Link>
        </div>
      </div>
    </main>
  );
}
