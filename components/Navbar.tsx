"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Search,
  Sparkles,
  Command,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { CommandPalette } from "./CommandPalette";
import GooeyNav, { NavItem } from "./GooeyNav";
import StarBorder from "./StarBorder";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
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
  }, []);

  const navLinks: NavItem[] = [
    { href: "/reconcile", label: "Reconcile" },
    { href: "/registry", label: "Registry" },
    { href: "/radar", label: "Radar" },
    { href: "/compare", label: "Compare" },
    { href: "/providers", label: "Proof" },
    { href: "/advisor", label: "Advisor" },
    { href: "/methodology", label: "Methodology" },
  ];

  const activeIndex = navLinks.findIndex(
    (item) =>
      item.href &&
      (pathname === item.href ||
        (item.href !== "/" && pathname.startsWith(item.href)))
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-[#111827] border-b border-hairline font-sans shadow-xs transition-colors duration-normal">
        {/* Archival Micro-Banner */}
        <div className="bg-[#0F172A] text-[#F8FAFC] text-[11px] py-1.5 px-4 text-center font-mono tracking-tight flex items-center justify-center gap-2 border-b border-[#1E293B]">
          <span className="w-1.5 h-1.5 bg-verdigris inline-block animate-pulse rounded-full"></span>
          <span className="uppercase tracking-wider font-medium">
            ZeroDay • India's GCC Archival Record • Every claim sourced & ground in truth
          </span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Masthead */}
            <Link
              href="/"
              className="flex items-center gap-3 group min-h-[44px] flex-shrink-0"
              title="ZeroDay Archival Record"
            >
              <div className="w-8 h-8 border border-ink dark:border-slate-500 text-ink dark:text-slate-100 flex items-center justify-center font-serif font-black text-sm tracking-tighter bg-surface group-hover:bg-ink group-hover:text-paper transition-colors duration-fast shadow-xs">
                0D
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-lg tracking-tight text-ink uppercase leading-none">
                  ZeroDay
                </span>
                <span className="text-[11px] font-mono uppercase tracking-widest text-muted -mt-0.5 hidden sm:block font-medium">
                  Independent Archival Record
                </span>
              </div>
            </Link>

            {/* Desktop Navigation with GooeyNav */}
            <div className="hidden lg:flex items-center justify-center flex-1 px-4">
              <GooeyNav
                items={navLinks}
                activeIndex={activeIndex >= 0 ? activeIndex : undefined}
                onChange={(_idx, item) => {
                  if (item.href) {
                    router.push(item.href);
                  }
                }}
                theme={isDark ? "dark" : "light"}
                size="sm"
                color={isDark ? "#14B8A6" : "#0F766E"}
                colors={["#0F766E", "#14B8A6", "#2DD4BF"]}
                particleCount={14}
                spread={46}
                animationTime={550}
                timeVariance={260}
                gooeyness={0.48}
                wobble={0.4}
                frame={true}
                hoverEffect={true}
              />
            </div>

            {/* Secondary Reference & Interactive Tools */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Quick Search Command Trigger */}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-medium border border-hairline bg-paper/40 hover:bg-paper hover:border-ink dark:hover:border-slate-500 transition-colors duration-fast text-muted min-h-[38px] rounded-xs"
                title="Universal Search (Press Cmd+K or /)"
              >
                <Search className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                <span className="hidden xl:inline">Search Record...</span>
                <kbd className="text-[10px] border border-hairline px-1.5 py-0.5 bg-surface font-mono text-muted rounded-xs shadow-2xs">
                  ⌘K
                </kbd>
              </button>

              {/* Theme Toggle (Dark / Light) */}
              <ThemeToggle />

              {/* Query AI Button with StarBorder Animation */}
              <StarBorder
                as={Link}
                href="/ask"
                color={isDark ? "#14B8A6" : "#0F766E"}
                trailColor={
                  isDark
                    ? "rgba(20, 184, 166, 0.45)"
                    : "rgba(15, 118, 110, 0.25)"
                }
                duration={3.5}
                thickness={1.5}
                radius={4}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium min-h-[38px]"
                backgroundColor={isDark ? "#111827" : "#FFFFFF"}
                textColor={isDark ? "#F8FAFC" : "#0F172A"}
                borderColor={isDark ? "#374151" : "#E2E8F0"}
              >
                <Sparkles
                  className="w-3.5 h-3.5 text-verdigris"
                  strokeWidth={1.75}
                />
                <span className="font-semibold">Ask Zero</span>
                <span className="text-[9px] px-1.5 py-0.2 border border-verdigris/40 text-verdigris uppercase font-bold tracking-tight rounded-xs">
                  Groq 120B
                </span>
              </StarBorder>

              {/* Attest Action Button */}
              <Link
                href="/submit"
                className="hidden sm:inline-flex items-center px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-ink text-surface hover:bg-verdigris hover:text-surface transition-colors duration-fast min-h-[38px] rounded-xs shadow-xs"
              >
                <span>+ Attest</span>
              </Link>

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-ink hover:bg-paper focus-visible:outline-verdigris rounded-xs"
                aria-label="Toggle Navigation Menu"
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

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-hairline bg-white dark:bg-[#111827] px-4 py-3 space-y-2 shadow-lg">
            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setCommandPaletteOpen(true);
              }}
              className="w-full py-2.5 px-3 flex items-center justify-between text-xs font-mono border border-hairline bg-paper/50 text-ink mb-2 min-h-[44px] rounded-xs"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted" />
                <span>Search ZeroDay Claims, Cities, GCCs...</span>
              </span>
              <kbd className="text-[10px] border border-hairline px-1.5 py-0.5 bg-surface font-mono text-muted rounded-xs">
                ⌘K
              </kbd>
            </button>

            {navLinks.map((item) => {
              const isActive =
                item.href &&
                (pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href)));
              return (
                <Link
                  key={item.label}
                  href={item.href || "#"}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 text-xs font-mono uppercase tracking-wider min-h-[44px] flex items-center border-l-2 transition-colors ${
                    isActive
                      ? "border-verdigris bg-paper dark:bg-slate-800 text-ink font-bold"
                      : "border-transparent text-muted hover:text-ink hover:bg-paper/40"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-3 border-t border-hairline grid grid-cols-2 gap-2">
              <Link
                href="/ask"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-mono border border-hairline bg-paper dark:bg-slate-800 text-ink text-center rounded-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-verdigris" />
                <span className="font-semibold">Ask Zero AI</span>
              </Link>
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
