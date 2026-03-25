"use client";

import { useEffect } from "react";

export default function DesignerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Designer error:", error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="bg-[#1a1a2e] rounded-xl border border-red-500/20 p-8 max-w-md text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-white font-semibold text-lg mb-2">Designer Error</h2>
        <p className="text-white/50 text-sm mb-1">{error.message || "The designer encountered an error."}</p>
        {error.digest && <p className="text-white/30 text-xs mb-4 font-mono">Digest: {error.digest}</p>}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-lg bg-[#ed5566] text-white text-sm font-medium hover:bg-[#d4444f] transition-colors"
          >
            Try Again
          </button>
          <a
            href="/dashboard/designer"
            className="px-6 py-2.5 rounded-lg bg-white/10 text-white/70 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Reload Page
          </a>
        </div>
      </div>
    </div>
  );
}
