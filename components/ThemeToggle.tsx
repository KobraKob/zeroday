"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("zeroday-theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("zeroday-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("zeroday-theme", "light");
    }
  };

  if (!mounted) {
    return (
      <div className="w-8 h-8 border border-hairline bg-surface flex items-center justify-center text-muted opacity-50" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light ledger mode" : "Switch to dark obsidian mode"}
      title={isDark ? "Light Ledger (Day)" : "Dark Obsidian (Night)"}
      className="w-8 h-8 border border-hairline bg-surface text-ink hover:text-verdigris hover:border-ink transition-colors duration-fast flex items-center justify-center focus-visible:outline-verdigris min-h-[32px] min-w-[32px]"
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5 text-verdigris" strokeWidth={1.5} />
      ) : (
        <Moon className="w-3.5 h-3.5 text-ink" strokeWidth={1.5} />
      )}
    </button>
  );
}
