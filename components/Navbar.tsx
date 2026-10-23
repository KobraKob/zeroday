"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search, Sparkles } from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";
import { useAsk } from "./AskContext";

export function Navbar() {
  const pathname = usePathname();
  const { openAskDrawer } = useAsk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global keyboard shortcut to open Command Palette (Cmd+K or Ctrl+K or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Primary nav links
  const primaryNavLinks = [
    { href: "/reconcile", label: "Reconcile" },
    { href: "/registry", label: "Registry" },
    { href: "/radar", label: "Radar" },
    { href: "/compare", label: "Compare" },
    { href: "/providers", label: "Proof" },
    { href: "/changelog", label: "Changelog" },
  ];

  // Mobile menu links
  const mobileNavLinks = [
    ...primaryNavLinks,
    { href: "/advisor", label: "Advisor" },
    { href: "/methodology", label: "Methodology" },
  ];

  return (
    <>
      {/* Sticky Navigation Header */}
      <header className="sticky top-0 z-50 w-full bg-surface border-b-2 border-rule font-sans shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 lg:gap-6 h-16 whitespace-nowrap min-w-0">
            {/* Zone 1: Left - ZeroDay Brand Wordmark */}
            <div className="flex items-center flex-shrink-0">
              <Link
                href="/"
                className="flex items-center gap-2.5 group min-h-[44px] focus-visible:outline-cobalt"
                aria-label="ZeroDay Home"
              >
                <div className="w-8 h-8 border-2 border-ink text-ink flex items-center justify-center font-display font-black text-xs tracking-tighter bg-surface group-hover:bg-cobalt group-hover:text-paper group-hover:border-cobalt transition-colors duration-fast rounded-xs">
                  ZD
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-black text-base tracking-tight text-ink uppercase leading-none">
                    ZeroDay
                  </span>
                  <span className="font-mono text-[9px] text-muted tracking-wider uppercase leading-none mt-1">
                    Grounded Intelligence
                  </span>
                </div>
              </Link>
            </div>

            {/* Zone 2: Centre - Primary Navigation */}
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
                    className={`px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-all duration-fast rounded-full whitespace-nowrap ${
                      isActive
                        ? "bg-ink text-surface shadow-xs font-bold"
                        : "text-muted hover:text-ink hover:bg-paper/70 font-medium"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Zone 3: Right - Search, Dark Mode Pill, Ask, Attest, Mobile Toggle */}
            <div className="flex items-center justify-end gap-2 sm:gap-2.5 flex-shrink-0">
              {/* Command Search */}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Search ZeroDay (Press ⌘K or /)"
                title="Search ZeroDay (⌘K)"
                className="w-10 h-10 border-2 border-rule rounded-full bg-surface hover:bg-paper text-muted hover:text-ink flex items-center justify-center transition-all cursor-pointer focus-visible:outline-cobalt"
              >
                <Search className="w-4 h-4" strokeWidth={1.75} />
              </button>

              {/* Dark Mode Permanent Status Pill */}
              <ThemeToggle />

              {/* Ask: Grounded Q&A Drawer */}
              <button
                type="button"
                onClick={() => {
                  if (pathname === "/ask") {
                    document.getElementById("ask-main-input")?.focus();
                  } else {
                    openAskDrawer();
                  }
                }}
                className="hidden sm:inline-flex items-center justify-center gap-2 px-4 h-10 text-xs font-mono font-medium border-2 border-rule bg-transparent text-ink hover:bg-ink hover:text-surface transition-all duration-fast rounded-full focus-visible:outline-cobalt cursor-pointer"
                aria-label="Ask ZeroDay Grounded Intelligence"
              >
                <Sparkles className="w-3.5 h-3.5 text-cobalt" />
                <span>Ask</span>
              </button>

              {/* Attest Button */}
              <Link
                href="/submit"
                className="inline-flex items-center justify-center px-4 h-10 text-xs font-mono font-bold uppercase tracking-wider bg-cobalt text-white border-2 border-rule hover:shadow-[2px_2px_0px_var(--color-ink)] transition-all duration-fast rounded-full focus-visible:outline-cobalt"
              >
                Attest
              </Link>

              {/* Hamburger toggle (<1024px) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-10 h-10 border-2 border-rule rounded-full flex items-center justify-center text-ink bg-surface hover:bg-paper focus-visible:outline-cobalt"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t-2 border-rule bg-surface px-4 py-4 space-y-2 shadow-lg">
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
                    className={`min-h-[44px] px-3.5 py-2 text-xs font-mono uppercase tracking-wider flex items-center rounded-full transition-colors ${
                      isActive
                        ? "bg-ink text-surface font-bold shadow-xs"
                        : "text-muted hover:text-ink hover:bg-paper/60"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t-2 border-rule grid grid-cols-2 gap-2">
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
                className="min-h-[44px] h-10 flex items-center justify-center gap-2 text-xs font-mono font-bold border-2 border-rule bg-transparent text-ink text-center rounded-full cursor-pointer hover:bg-ink hover:text-surface"
              >
                <Sparkles className="w-3.5 h-3.5 text-cobalt" />
                <span>Ask</span>
              </button>
              <Link
                href="/submit"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] h-10 flex items-center justify-center text-xs font-mono font-bold bg-cobalt text-white border-2 border-rule text-center uppercase rounded-full"
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
