"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("gcc-atlas-theme");
    if (savedTheme === "dark") {
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
      localStorage.setItem("gcc-atlas-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("gcc-atlas-theme", "light");
    }
  };

  if (!mounted) {
    return (
      <div className="w-9 h-9 border-2 border-ink rounded-full bg-surface flex items-center justify-center text-muted opacity-40 min-h-[36px] min-w-[36px]" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-9 h-9 border-2 border-ink rounded-full bg-surface text-ink hover:bg-paper hover:shadow-[2px_2px_0px_var(--color-ink)] transition-all flex items-center justify-center focus-visible:outline-cobalt min-h-[36px] min-w-[36px] cursor-pointer"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-marigold" strokeWidth={2} />
      ) : (
        <Moon className="w-4 h-4 text-ink" strokeWidth={2} />
      )}
    </button>
  );
}
