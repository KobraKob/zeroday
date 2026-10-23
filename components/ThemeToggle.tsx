"use client";

import React, { useEffect } from "react";
import { Moon } from "lucide-react";

export function ThemeToggle() {
  useEffect(() => {
    // Permanent dark mode enforcement
    document.documentElement.classList.add("dark");
    localStorage.setItem("zeroday-theme", "dark");
  }, []);

  return (
    <div
      title="ZeroDay Permanent Dark Mode"
      aria-label="ZeroDay Dark Mode Active"
      className="w-10 h-10 border-2 border-ink rounded-full bg-surface text-ink flex items-center justify-center select-none"
    >
      <Moon className="w-4 h-4 text-marigold" strokeWidth={2} />
    </div>
  );
}
