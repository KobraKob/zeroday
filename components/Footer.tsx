"use client";

import React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function Footer() {
  return (
    <footer className="border-t-2 border-rule bg-paper/80 font-sans text-xs text-muted py-8 mt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Masthead Colophon */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 border-2 border-ink text-ink flex items-center justify-center font-display font-bold text-xs bg-surface rounded-xs">
                ZD
              </div>
              <span className="font-display font-bold text-ink text-sm tracking-tight uppercase">
                ZeroDay
              </span>
            </div>
            <p className="text-xs font-sans text-muted">
              Independent archival record of India&apos;s Global Capability Centres
            </p>
            <p className="font-body italic text-sm text-ink/80 max-w-md leading-relaxed">
              &ldquo;The independent, citable record of India&apos;s capability centre ecosystem. Every figure anchored to an audited filing, registered lease, or gazetted order.&rdquo;
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs font-sans text-muted">
              <Shield className="w-3.5 h-3.5 text-cobalt flex-shrink-0" strokeWidth={1.5} />
              <span>Neutrality guarantee: Commercial relationships never alter scoring, counts, or verification.</span>
            </div>
          </div>

          {/* Core Indexes */}
          <div className="space-y-2.5">
            <div className="text-ink text-xs font-semibold">
              Primary indexes
            </div>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/reconcile" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Reconcile counts
                </Link>
              </li>
              <li>
                <Link href="/registry" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  GCC registry
                </Link>
              </li>
              <li>
                <Link href="/radar" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Radar signal intelligence
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Site selection compare
                </Link>
              </li>
              <li>
                <Link href="/providers" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Proof-backed directory
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Public changelog
                </Link>
              </li>
            </ul>
          </div>

          {/* Governance & Methodology */}
          <div className="space-y-2.5">
            <div className="text-ink text-xs font-semibold">
              Governance and methodology
            </div>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/methodology" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Methodology and rubric
                </Link>
              </li>
              <li>
                <Link href="/methodology#disputes" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Correction and dispute protocol
                </Link>
              </li>
              <li>
                <Link href="/submit" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Submit provider attestation
                </Link>
              </li>
              <li>
                <Link href="/admin/review" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Review queue
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Colophon Rule with Dark Mode Indicator */}
        <div className="pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div>
            &copy; <span className="font-mono">2026</span> ZeroDay. Data is citable under Open Attribution.
          </div>
          <div className="flex items-center gap-4">
            <span>Edition: 2026</span>
            <span className="text-cobalt">Last checked: Today</span>
            <div className="flex items-center gap-2 pl-2 border-l border-hairline">
              <span className="text-xs text-muted hidden sm:inline">Theme:</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
