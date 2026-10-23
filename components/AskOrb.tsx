"use client";

import { usePathname } from "next/navigation";
import { useAsk } from "./AskContext";
import Orb from "./Orb";

const ASK_ORB_COLORS = ["#3b82f6", "#3b82f6", "#4146dd"];

export function AskOrb() {
  const pathname = usePathname();
  const { isDrawerOpen, openAskDrawer } = useAsk();

  if (isDrawerOpen) return null;

  const handleAsk = () => {
    if (pathname === "/ask") {
      document.getElementById("ask-main-input")?.focus();
      return;
    }
    openAskDrawer();
  };

  return (
    <div className="ask-orb-launcher">
      <button
        type="button"
        className="ask-orb-trigger"
        onClick={handleAsk}
        aria-label="Ask ZeroDay Grounded Intelligence"
        aria-haspopup="dialog"
        title="Ask ZeroDay"
      >
        <span className="ask-orb-surface" aria-hidden="true">
          <Orb
            colors={ASK_ORB_COLORS}
            hoverIntensity={1}
            trail={1}
            rotateOnHover
            followCursor
          />
        </span>
        <span className="ask-orb-core-mark" aria-hidden="true">ZD</span>
      </button>
      <span className="ask-orb-tooltip" aria-hidden="true">
        <strong>ASK ZERODAY</strong>
        <small>Grounded intelligence</small>
      </span>
    </div>
  );
}
