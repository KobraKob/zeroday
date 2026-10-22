"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search, Sparkles } from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";
import { useAsk } from "./AskContext";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { openAskDrawer } = useAsk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [tickerVisible, setTickerVisible] = useState(true);

  // Global keyboard shortcut to open Command Palette (Cmd+K or Ctrl+K or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If currently on /ask, let Ask page focus its own pinned input on Cmd+K
      if (pathname === "/ask" && (e.metaKey || e.ctrlKey) && e.key === "k") {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname]);

  // Primary nav: max 5 items
  const primaryNavLinks = [
    { href: "/reconcile", label: "Reconcile" },
    { href: "/registry", label: "Registry" },
    { href: "/radar", label: "Radar" },
    { href: "/compare", label: "Compare" },
    { href: "/providers", label: "Proof" },
  ];

  // Mobile menu links (includes Advisor & Methodology)
  const mobileNavLinks = [
    ...primaryNavLinks,
    { href: "/advisor", label: "Advisor" },
    { href: "/methodology", label: "Methodology" },
  ];

  return (
    <>
      {/* Ticker strip above header: scrolls away naturally with document scroll (NOT sticky) */}
      {tickerVisible && (
        <div className="hidden sm:flex h-8 items-center justify-between px-4 sm:px-6 lg:px-8 bg-surface text-ink text-xs font-mono tracking-tight border-b-2 border-ink overflow-hidden whitespace-nowrap select-none">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 bg-cobalt inline-block rounded-full flex-shrink-0 animate-pulse" />
            <span className="uppercase tracking-wider font-medium truncate">
              GCC Atlas • India&apos;s GCC Archival Record • Every number traced to a source
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTickerVisible(false)}
            className="text-muted hover:text-ink p-1 ml-2 flex-shrink-0 transition-colors focus-visible:outline-cobalt cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Single-row header (sticky top-0, 64px, 3 CSS grid zones) */}
      <header className="sticky top-0 z-50 w-full bg-surface border-b-2 border-ink font-sans shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 lg:gap-6 h-16 whitespace-nowrap min-w-0">
            {/* Zone 1: Left - Logo mark + wordmark only (One brand name: GCC Atlas) */}
            <div className="flex items-center flex-shrink-0">
              <Link
                href="/"
                className="flex items-center gap-2.5 group min-h-[44px] focus-visible:outline-cobalt"
                aria-label="GCC Atlas Home"
              >
                <div className="w-7 h-7 border-2 border-ink text-ink flex items-center justify-center font-display font-black text-xs tracking-tighter bg-surface group-hover:bg-ink group-hover:text-paper transition-colors duration-fast rounded-xs">
                  GA
                </div>
                <span className="font-display font-bold text-base tracking-tight text-ink uppercase">
                  GCC Atlas
                </span>
              </Link>
            </div>

            {/* Zone 2: Centre - Primary nav (max 5 items, single row, active = filled ink pill with cream text) */}
            <nav aria-label="Primary Navigation" className="hidden lg:flex items-center justify-center gap-1.5 min-w-0">
              {primaryNavLinks.map((item) => {
                const isActive =
                  item.href &&
                  (pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href)));
                return (
                  <Link
                    key={item.label}
                    href={item.href || "#"}
                    aria-current={isActive ? "page" : undefined}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-fast rounded-full whitespace-nowrap ${
                      isActive
                        ? "bg-ink text-cream dark:text-paper shadow-xs font-semibold"
                        : "text-muted hover:text-ink hover:bg-paper/70"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Zone 3: Right - Search icon, ThemeToggle, Outlined "Ask", Filled primary "Attest", Mobile Toggle */}
            <div className="flex items-center justify-end gap-2 sm:gap-2.5 flex-shrink-0">
              {/* Search icon button that opens Command Palette (⌘K) */}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Search Atlas (Press ⌘K or /)"
                title="Search Atlas (⌘K)"
                className="w-11 h-11 border-2 border-ink rounded-full bg-surface hover:bg-paper text-muted hover:text-ink flex items-center justify-center transition-all cursor-pointer focus-visible:outline-cobalt"
              >
                <Search className="w-4 h-4" strokeWidth={1.75} />
              </button>

              {/* Theme Toggle Button */}
              <ThemeToggle />

              {/* Ask: Secondary, outlined button, 44px high with Sparkles icon & label */}
              <button
                type="button"
                onClick={() => {
                  if (pathname === "/ask") {
                    document.getElementById("ask-main-input")?.focus();
                  } else {
                    openAskDrawer();
                  }
                }}
                className="hidden sm:inline-flex items-center justify-center gap-2 px-4 h-11 text-xs font-mono font-medium border-2 border-ink bg-transparent text-ink hover:bg-ink hover:text-cream dark:hover:text-paper transition-all duration-fast rounded-full min-h-[44px] focus-visible:outline-cobalt cursor-pointer"
                aria-label="Ask the record"
              >
                <Sparkles className="w-4 h-4 text-cobalt" />
                <span>Ask</span>
              </button>

              {/* Attest: ONE primary button (filled cobalt, 44px high) */}
              <Link
                href="/submit"
                className="inline-flex items-center justify-center px-5 h-11 text-xs font-mono font-bold uppercase tracking-wider bg-cobalt text-white border-2 border-ink hover:shadow-[2px_2px_0px_var(--color-ink)] transition-all duration-fast rounded-full min-h-[44px] focus-visible:outline-cobalt"
              >
                Attest
              </Link>

              {/* Hamburger toggle (<1024px) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-11 h-11 border-2 border-ink rounded-full flex items-center justify-center text-ink bg-surface hover:bg-paper focus-visible:outline-cobalt"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu drawer (<1024px) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t-2 border-ink bg-surface px-4 py-4 space-y-2 shadow-lg">
            <nav aria-label="Mobile Navigation" className="space-y-1">
              {mobileNavLinks.map((item) => {
                const isActive =
                  item.href &&
                  (pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href)));
                return (
                  <Link
                    key={item.label}
                    href={item.href || "#"}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`min-h-[44px] px-3.5 py-2 text-sm font-medium flex items-center rounded-full transition-colors ${
                      isActive
                        ? "bg-ink text-cream font-semibold shadow-xs"
                        : "text-muted hover:text-ink hover:bg-paper/60"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t-2 border-ink grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (pathname === "/ask") {
                    document.getElementById("ask-main-input")?.focus();
                  } else {
                    openAskDrawer();
                  }
                }}
                className="min-h-[44px] h-11 flex items-center justify-center gap-2 text-xs font-mono font-bold border-2 border-ink bg-transparent text-ink text-center rounded-full cursor-pointer hover:bg-ink hover:text-cream"
              >
                <Sparkles className="w-3.5 h-3.5 text-cobalt" />
                <span>Ask</span>
              </button>
              <Link
                href="/submit"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] h-11 flex items-center justify-center text-xs font-mono font-bold bg-cobalt text-white border-2 border-ink text-center uppercase rounded-full"
              >
                + Attest
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Global Universal Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
}
