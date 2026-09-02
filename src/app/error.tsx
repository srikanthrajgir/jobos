'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is all that reaches the browser in production; log the pair so
    // the server-side message can be matched to what the user actually saw.
    console.error('Unhandled route error', error.digest, error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-bg-main px-6 py-12">
      <div className="w-full max-w-md bg-bg-card border border-border-light rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-display tracking-widest uppercase font-bold flex items-center justify-center">
            <span className="text-accent-orange">JOB</span><span className="text-text-heading">OS</span>
          </Link>
          <h1 className="text-2xl font-bold mt-6">Something went wrong</h1>
          <p className="text-text-muted mt-2">
            This page could not be loaded. The problem has been logged — please try again.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-accent-orange border-2 border-accent-orange text-white py-3 rounded-xl font-bold hover:bg-[#ea580c] hover:border-[#ea580c] transition-all shadow-md"
          >
            Try again
          </button>
          <Link
            href="/app"
            className="block w-full text-center bg-bg-card border border-border-light text-text-charcoal py-3 rounded-xl font-bold hover:bg-bg-hover transition-all"
          >
            Back to dashboard
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-center text-xs text-text-muted">
            Reference: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  );
}
