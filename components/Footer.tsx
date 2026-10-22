"use client";

import React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-paper/70 font-sans text-xs text-muted py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Masthead Colophon */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border border-ink text-ink flex items-center justify-center font-serif font-bold text-xs bg-surface">
                ZD
              </div>
              <span className="font-serif font-bold text-ink text-sm tracking-tight uppercase">
                GCC Atlas
              </span>
            </div>
            <p className="font-serif italic text-sm text-ink/80 max-w-md leading-relaxed">
              &ldquo;The independent, citable record of India&apos;s Global Capability Centre ecosystem. Every number traced to a primary source.&rdquo;
            </p>
            <div className="flex items-center gap-2 pt-2 text-[11px] font-mono text-muted">
              <Shield className="w-3.5 h-3.5 text-verdigris" strokeWidth={1.5} />
              <span>Neutrality Guarantee: Commercial relationships never alter scoring, counts, or verification.</span>
            </div>
          </div>

          {/* Core Indexes */}
          <div className="space-y-2">
            <div className="font-mono uppercase text-ink text-[11px] font-bold tracking-wider">
              Primary Indexes
            </div>
            <ul className="space-y-1.5 font-mono text-[11px]">
              <li>
                <Link href="/reconcile" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Reconcile Counts
                </Link>
              </li>
              <li>
                <Link href="/registry" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Verified GCC Registry
                </Link>
              </li>
              <li>
                <Link href="/radar" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Radar Signal Intelligence
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Site Selection Compare
                </Link>
              </li>
              <li>
                <Link href="/providers" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Proof-Backed Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Governance */}
          <div className="space-y-2">
            <div className="font-mono uppercase text-ink text-[11px] font-bold tracking-wider">
              Governance & Protocols
            </div>
            <ul className="space-y-1.5 font-mono text-[11px]">
              <li>
                <Link href="/methodology" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Rubric & Confidence Grades
                </Link>
              </li>
              <li>
                <Link href="/methodology#disputes" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Correction & Dispute Protocol
                </Link>
              </li>
              <li>
                <Link href="/submit" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Statutory Attestation Filing
                </Link>
              </li>
              <li>
                <Link href="/admin/review" className="text-muted hover:text-ink hover:underline decoration-1 underline-offset-2 transition">
                  Peer Review Ledger
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Hairline Colophon Rule */}
        <div className="pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-muted">
          <div>
            &copy; 2026 ZeroDay Research Archive. Data is citable under Open Attribution.
          </div>
          <div className="flex items-center gap-4">
            <span>Edition: 2026-Q1</span>
            <span>Cartographic Hash: #1F6F63</span>
            <span className="text-verdigris">Status: Audited</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
