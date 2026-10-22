"use client";

import React, { useState, useEffect } from "react";
import { useAsk } from "./AskContext";
import { MessageSquarePlus } from "lucide-react";

export function HighlightToAsk() {
  const { openAskDrawer } = useAsk();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState("");

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setPosition(null);
        setSelectedText("");
        return;
      }

      const text = selection.toString().trim();
      // Only show if selection is reasonable length (between 2 and 60 chars)
      if (text.length >= 2 && text.length <= 60) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          setPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
          setSelectedText(text);
          return;
        }
      }
      setPosition(null);
      setSelectedText("");
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  if (!position || !selectedText) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -100%)",
        zIndex: 60,
      }}
      className="pointer-events-auto animate-fade-in"
    >
      <button
        type="button"
        onMouseDown={(e) => {
          // Prevent losing selection before click fires
          e.preventDefault();
        }}
        onClick={() => {
          openAskDrawer(`What does the record say about ${selectedText}?`);
          window.getSelection()?.removeAllRanges();
          setPosition(null);
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cobalt text-white border-2 border-ink rounded-full text-xs font-mono font-bold shadow-[2px_2px_0px_#15183A] hover:bg-ink hover:text-white transition-all cursor-pointer select-none"
        aria-label={`Ask about ${selectedText}`}
      >
        <MessageSquarePlus className="w-3.5 h-3.5" />
        <span>Ask about this</span>
      </button>
    </div>
  );
}
