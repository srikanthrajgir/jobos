'use client';

import { useEffect } from 'react';
import './globals.css';

// Only renders when the root layout itself throws — `error.tsx` handles every
// route below it. Must supply its own <html>/<body>: the layout never mounted.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled root error', error.digest, error);
  }, [error]);

  return (
    <html lang="en" className="dark h-full antialiased" data-theme="dark">
      <body className="min-h-full flex flex-col font-sans">
        <div className="min-h-screen flex flex-col justify-center items-center bg-bg-main px-6 py-12">
          <div className="w-full max-w-md bg-bg-card border border-border-light rounded-2xl shadow-xl p-8 text-center">
            <div className="text-4xl font-display tracking-widest uppercase font-bold flex items-center justify-center">
              <span className="text-accent-orange">JOB</span><span className="text-text-heading">OS</span>
            </div>
            <h1 className="text-2xl font-bold mt-6">JobOS is temporarily unavailable</h1>
            <p className="text-text-muted mt-2">
              We hit an unexpected problem loading the app. Please try again in a moment.
            </p>
            <button
              onClick={reset}
              className="w-full mt-8 bg-accent-orange border-2 border-accent-orange text-white py-3 rounded-xl font-bold hover:bg-[#ea580c] hover:border-[#ea580c] transition-all shadow-md"
            >
              Try again
            </button>
            {error.digest && (
              <p className="mt-8 text-xs text-text-muted">
                Reference: <span className="font-mono">{error.digest}</span>
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
