"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search } from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import GooeyNav, { NavItem } from "./GooeyNav";
import { useAsk } from "./AskContext";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { openAskDrawer } = useAsk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [tickerVisible, setTickerVisible] = useState(true);
  const [isDark, setIsDark] = useState(false);

  // Synchronize theme state with documentElement class list
  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

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
  const primaryNavLinks: NavItem[] = [
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

  const activeIndex = primaryNavLinks.findIndex(
    (item) =>
      item.href &&
      (pathname === item.href ||
        (item.href !== "/" && pathname.startsWith(item.href)))
  );

  return (
    <>
      {/* Ticker strip above header: scrolls away naturally with document scroll (NOT sticky) */}
      {tickerVisible && (
        <div className="hidden sm:flex h-8 items-center justify-between px-4 sm:px-6 lg:px-8 bg-[#0F172A] text-[#F8FAFC] text-[11px] font-mono tracking-tight border-b border-[#1E293B] overflow-hidden whitespace-nowrap select-none">
          <div className="flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 bg-verdigris inline-block rounded-full flex-shrink-0 animate-pulse" />
            <span className="uppercase tracking-wider font-medium truncate">
              GCC Atlas • India&apos;s GCC Archival Record • Every number traced to a primary source
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTickerVisible(false)}
            className="text-slate-400 hover:text-white p-1 ml-2 flex-shrink-0 transition-colors focus-visible:outline-verdigris"
            aria-label="Dismiss banner"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Single-row header (sticky top-0, 64px, 3 CSS grid zones) */}
      <header className="sticky top-0 z-50 w-full bg-surface border-b border-hairline font-sans shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 lg:gap-6 h-16 whitespace-nowrap min-w-0">
            {/* Zone 1: Left - Logo mark + wordmark only (One brand name: GCC Atlas) */}
            <div className="flex items-center flex-shrink-0">
              <Link
                href="/"
                className="flex items-center gap-2.5 group min-h-[44px] focus-visible:outline-verdigris"
                aria-label="GCC Atlas Home"
              >
                <div className="w-7 h-7 border border-ink text-ink flex items-center justify-center font-serif font-black text-xs tracking-tighter bg-surface group-hover:bg-ink group-hover:text-surface transition-colors duration-fast">
                  GA
                </div>
                <span className="font-serif font-bold text-base tracking-tight text-ink uppercase">
                  GCC Atlas
                </span>
              </Link>
            </div>

            {/* Zone 2: Centre - Primary nav (max 5 items, animated pill, single line, no wrapping) */}
            <div className="hidden lg:flex items-center justify-center min-w-0">
              <GooeyNav
                items={primaryNavLinks}
                activeIndex={activeIndex >= 0 ? activeIndex : 0}
                onChange={(_idx, item) => {
                  if (item.href) {
                    router.push(item.href);
                  }
                }}
                theme={isDark ? "dark" : "light"}
                size="sm"
                color={isDark ? "#14B8A6" : "#0F766E"}
                colors={["#0F766E", "#14B8A6", "#2DD4BF"]}
                particleCount={12}
                spread={40}
                animationTime={450}
                timeVariance={200}
                gooeyness={0.45}
                wobble={0.35}
                frame={true}
                hoverEffect={true}
              />
            </div>

            {/* Zone 3: Right - Search icon, Outlined "Ask", Filled primary "Attest", Mobile Toggle */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
              {/* Search icon button that opens Command Palette (⌘K) */}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Search Atlas (Press ⌘K or /)"
                title="Search Atlas (⌘K)"
                className="w-9 h-9 border border-hairline bg-surface hover:bg-paper hover:border-ink text-muted hover:text-ink flex items-center justify-center transition-colors duration-fast rounded-xs focus-visible:outline-verdigris"
              >
                <Search className="w-4 h-4" strokeWidth={1.75} />
              </button>

              {/* Ask: Secondary, outlined button (Opens drawer from any page, or focuses if on /ask) */}
              <button
                type="button"
                onClick={() => {
                  if (pathname === "/ask") {
                    document.getElementById("ask-main-input")?.focus();
                  } else {
                    openAskDrawer();
                  }
                }}
                className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-mono font-medium border-2 border-ink bg-cream text-ink hover:bg-surface hover:shadow-[2px_2px_0px_#15183A] transition-all duration-fast rounded-full min-h-[36px] focus-visible:outline-cobalt"
                aria-label="Ask the record"
              >
                Ask
              </button>

              {/* Attest: ONE primary button (filled, high-contrast) */}
              <Link
                href="/submit"
                className="inline-flex items-center justify-center px-3.5 sm:px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-ink text-surface hover:bg-verdigris hover:text-surface transition-colors duration-fast rounded-xs min-h-[36px] focus-visible:outline-verdigris"
              >
                Attest
              </Link>

              {/* Hamburger toggle (<1024px) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-10 h-10 flex items-center justify-center text-ink hover:bg-paper focus-visible:outline-verdigris rounded-xs"
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
          <div className="lg:hidden border-t border-hairline bg-surface px-4 py-4 space-y-2 shadow-lg">
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
                    className={`min-h-[44px] px-3 py-2 text-sm font-medium flex items-center border-l-2 transition-colors ${
                      isActive
                        ? "border-verdigris bg-paper text-ink font-semibold"
                        : "border-transparent text-muted hover:text-ink hover:bg-paper/40"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-hairline grid grid-cols-2 gap-2">
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
                className="min-h-[44px] flex items-center justify-center text-xs font-mono font-bold border-2 border-ink bg-cream text-ink text-center rounded-full"
              >
                Ask
              </button>
              <Link
                href="/submit"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center justify-center text-xs font-mono font-bold bg-ink text-surface text-center uppercase rounded-xs"
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
