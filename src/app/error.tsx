"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-col px-4 py-16">
      <h1 className="font-display text-5xl tracking-tight">Something went wrong on this screen</h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
        Tether did not finish loading this view. Anything already saved is still in the database. Try again.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-12 items-center rounded-full bg-navy px-5 font-semibold text-ivory"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-full bg-mint px-5 font-semibold text-navy"
        >
          Back to the start
        </Link>
      </div>
    </main>
  );
}
