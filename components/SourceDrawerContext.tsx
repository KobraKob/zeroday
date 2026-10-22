"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Source, Claim } from "../lib/schema";

export interface FootnoteTarget {
  source?: Source | null;
  claim?: Claim | null;
  fieldLabel?: string;
  marker?: number | string;
  definitionRule?: string;
}

interface SourceDrawerContextType {
  drawerState: {
    isOpen: boolean;
    source?: Source | null;
    claim?: Claim | null;
    fieldLabel?: string;
    marker?: number | string;
    definitionRule?: string;
  };
  openDrawer: (
    source?: Source | null,
    claim?: Claim | null,
    fieldLabel?: string,
    marker?: number | string,
    definitionRule?: string
  ) => void;
  openFootnote: (target: FootnoteTarget) => void;
  closeDrawer: () => void;
}

const SourceDrawerContext = createContext<SourceDrawerContextType | undefined>(undefined);

export function SourceDrawerProvider({ children }: { children: React.ReactNode }) {
  const [drawerState, setDrawerState] = useState<{
    isOpen: boolean;
    source?: Source | null;
    claim?: Claim | null;
    fieldLabel?: string;
    marker?: number | string;
    definitionRule?: string;
  }>({
    isOpen: false,
    source: null,
    claim: null,
    fieldLabel: undefined,
    marker: undefined,
    definitionRule: undefined,
  });

  const openDrawer = useCallback(
    (
      source?: Source | null,
      claim?: Claim | null,
      fieldLabel?: string,
      marker?: number | string,
      definitionRule?: string
    ) => {
      setDrawerState({
        isOpen: true,
        source: source || null,
        claim: claim || null,
        fieldLabel,
        marker,
        definitionRule,
      });
    },
    []
  );

  const openFootnote = useCallback((target: FootnoteTarget) => {
    setDrawerState({
      isOpen: true,
      source: target.source || null,
      claim: target.claim || null,
      fieldLabel: target.fieldLabel,
      marker: target.marker,
      definitionRule: target.definitionRule,
    });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <SourceDrawerContext.Provider
      value={{ drawerState, openDrawer, openFootnote, closeDrawer }}
    >
      {children}
    </SourceDrawerContext.Provider>
  );
}

export function useSourceDrawer() {
  const context = useContext(SourceDrawerContext);
  if (!context) {
    throw new Error("useSourceDrawer must be used within a SourceDrawerProvider");
  }
  return context;
}
