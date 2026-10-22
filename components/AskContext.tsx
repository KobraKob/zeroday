"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AskContextType {
  isDrawerOpen: boolean;
  prefilledQuery: string;
  openAskDrawer: (query?: string) => void;
  closeAskDrawer: () => void;
  recentQuestions: string[];
  addRecentQuestion: (query: string) => void;
  clearRecentQuestions: () => void;
}

const AskContext = createContext<AskContextType | undefined>(undefined);

export function AskProvider({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [prefilledQuery, setPrefilledQuery] = useState("");
  const [recentQuestions, setRecentQuestions] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("gcc-atlas-recent-queries");
      if (stored) {
        setRecentQuestions(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  const openAskDrawer = (query = "") => {
    setPrefilledQuery(query);
    setIsDrawerOpen(true);
  };

  const closeAskDrawer = () => {
    setIsDrawerOpen(false);
  };

  const addRecentQuestion = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentQuestions((prev) => {
      const updated = [trimmed, ...prev.filter((q) => q !== trimmed)].slice(0, 8);
      try {
        localStorage.setItem("gcc-atlas-recent-queries", JSON.stringify(updated));
      } catch {
        // Ignore localStorage write errors
      }
      return updated;
    });
  };

  const clearRecentQuestions = () => {
    setRecentQuestions([]);
    try {
      localStorage.removeItem("gcc-atlas-recent-queries");
    } catch {
      // Ignore
    }
  };

  return (
    <AskContext.Provider
      value={{
        isDrawerOpen,
        prefilledQuery,
        openAskDrawer,
        closeAskDrawer,
        recentQuestions,
        addRecentQuestion,
        clearRecentQuestions,
      }}
    >
      {children}
    </AskContext.Provider>
  );
}

export function useAsk() {
  const ctx = useContext(AskContext);
  if (!ctx) {
    throw new Error("useAsk must be used within an AskProvider");
  }
  return ctx;
}
