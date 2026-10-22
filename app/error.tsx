"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Automatically recover from Next.js ChunkLoadError caused by server redeployments or cache invalidation
    if (
      error.name === "ChunkLoadError" ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("ChunkLoadError") ||
      error.message?.includes("failed to fetch")
    ) {
      console.warn("Detected stale chunk cache. Reloading window to fetch current build chunks...");
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full border border-hairline bg-surface p-8 text-center space-y-6 shadow-sm">
        <div className="w-12 h-12 mx-auto border border-coral text-coral flex items-center justify-center bg-coral-subtle">
          <AlertCircle className="w-6 h-6" strokeWidth={1.5} />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
            Application Error • Audit Trace {error.digest ? `[${error.digest.slice(0, 8)}]` : ""}
          </span>
          <h2 className="font-display text-xl font-bold text-ink">
            Temporary Resource Loading Error
          </h2>
          <p className="text-xs text-muted leading-relaxed font-serif">
            A dynamic resource chunk or ledger view failed to initialize. If a recent revision was published, refreshing will load the latest verified bundle.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              if (error.name === "ChunkLoadError" || error.message?.includes("chunk")) {
                window.location.reload();
              } else {
                reset();
              }
            }}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-ink text-surface font-semibold uppercase tracking-wider hover:bg-cobalt transition-colors duration-fast inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Reload Document</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 border border-hairline text-ink font-semibold uppercase tracking-wider hover:bg-paper transition-colors duration-fast inline-flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
