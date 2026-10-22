/**
 * GCC Atlas Design Tokens
 * Concept: "The Atlas as a printed reference" — institutional ledger meets architectural cartography.
 * All values are anchored to CSS custom properties defined in globals.css.
 */

export const tokens = {
  colors: {
    cream: "var(--cream)",
    paper: "var(--color-paper)",
    surface: "var(--color-surface)",
    ink: "var(--color-ink)",
    muted: "var(--color-muted)",
    hairline: "var(--color-hairline)",
    hairlineSubtle: "var(--color-hairline-subtle)",
    rule: "var(--rule)",
    ruleSubtle: "var(--rule-subtle)",
    cobalt: "var(--color-cobalt)",
    marigold: "var(--color-marigold)",
    coral: "var(--color-coral)",
    mint: "var(--color-mint)",
  },
  typography: {
    display: "var(--font-display)",
    body: "var(--font-body)",
    mono: "var(--font-mono)",
    scale: {
      xs: "0.75rem",     // 12px
      sm: "0.875rem",    // 14px
      base: "1rem",      // 16px
      lg: "1.125rem",    // 18px
      xl: "1.375rem",    // 22px
      "2xl": "1.75rem",   // 28px
      "3xl": "2.1875rem", // 35px
      "4xl": "2.75rem",   // 44px
      "5xl": "3.5rem",    // 56px
    },
    lineHeights: {
      tight: 1.15,
      snug: 1.3,
      body: 1.5,
      relaxed: 1.65,
    },
    maxMeasure: "68ch",
  },
  spacing: {
    1: "0.25rem",  // 4px
    2: "0.5rem",   // 8px
    3: "0.75rem",  // 12px
    4: "1rem",     // 16px
    5: "1.25rem",  // 20px
    6: "1.5rem",   // 24px
    8: "2rem",     // 32px
    10: "2.5rem",  // 40px
    12: "3rem",    // 48px
    16: "4rem",    // 64px
    20: "5rem",    // 80px
  },
  radii: {
    none: "0px",
    xs: "2px",
    sm: "3px",
    md: "4px",
  },
  motion: {
    durationFast: "150ms",
    durationBase: "200ms",
    durationSlow: "220ms",
    easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  elevation: {
    none: "none",
    marginPanel: "-6px 0 28px rgba(15, 23, 42, 0.08)",
    bottomSheet: "0 -8px 32px rgba(15, 23, 42, 0.12)",
  },
} as const;

export type DesignTokens = typeof tokens;
