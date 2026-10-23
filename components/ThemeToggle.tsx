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
      className="atlas-nav-control w-11 h-11 border border-hairline-subtle rounded-full bg-surface text-ink flex items-center justify-center select-none min-h-[44px] min-w-[44px]"
    >
      <Moon className="w-4 h-4 text-mint" strokeWidth={2} />
    </div>
  );
}
