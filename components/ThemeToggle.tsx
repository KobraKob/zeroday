"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let nextDark = document.documentElement.classList.contains("dark");
    try {
      const savedTheme = window.localStorage.getItem("zeroday-theme");
      if (savedTheme === "light") nextDark = false;
      if (savedTheme === "dark") nextDark = true;
    } catch {
      // Keep the server-rendered default if browser storage is unavailable.
    }
    document.documentElement.classList.toggle("dark", nextDark);
    setIsDark(nextDark);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    document.documentElement.classList.toggle("dark", nextDark);
    setIsDark(nextDark);
    try {
      window.localStorage.setItem("zeroday-theme", nextDark ? "dark" : "light");
    } catch {
      // Theme still changes for this session when storage is unavailable.
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="atlas-theme-toggle inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-hairline-subtle bg-surface px-3 text-ink transition-all duration-200 hover:border-cobalt hover:shadow-sm focus-visible:outline-cobalt"
      suppressHydrationWarning
    >
      <span className="atlas-theme-toggle-icon flex h-5 w-5 items-center justify-center" aria-hidden="true">
        {isDark ? <Sun className="h-[17px] w-[17px] text-marigold" strokeWidth={2} /> : <Moon className="h-[17px] w-[17px] text-cobalt" strokeWidth={2} />}
      </span>
      <span className="hidden font-mono text-[10px] font-bold uppercase tracking-[0.1em] sm:inline">
        {mounted ? (isDark ? "Dark" : "Light") : "Theme"}
      </span>
    </button>
  );
}
