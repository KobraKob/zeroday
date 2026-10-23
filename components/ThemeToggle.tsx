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
      <div aria-hidden="true" className="w-11 h-11 border border-hairline-subtle rounded-full bg-surface flex items-center justify-center text-muted opacity-40 min-h-[44px] min-w-[44px]" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="atlas-nav-control w-11 h-11 border border-hairline-subtle rounded-full bg-surface text-ink hover:bg-cream transition-all duration-200 flex items-center justify-center focus-visible:outline-cobalt min-h-[44px] min-w-[44px] cursor-pointer"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#FF6B4A]" strokeWidth={2} />
      ) : (
        <Moon className="w-4 h-4 text-ink" strokeWidth={2} />
      )}
    </button>
  );
}
