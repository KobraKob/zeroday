import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: "var(--cream)",
        paper: "var(--paper)",
        surface: "var(--surface)",
        card: "var(--card)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        rule: {
          DEFAULT: "var(--rule)",
          subtle: "var(--rule-subtle)",
        },
        hairline: {
          DEFAULT: "var(--hairline)",
          subtle: "var(--hairline-subtle)",
        },
        cobalt: {
          DEFAULT: "var(--cobalt)",
          hover: "var(--cobalt)",
          subtle: "var(--surface)",
        },
        marigold: {
          DEFAULT: "var(--marigold)",
          subtle: "var(--surface)",
        },
        coral: {
          DEFAULT: "var(--coral)",
          subtle: "var(--surface)",
        },
        mint: {
          DEFAULT: "var(--mint)",
          subtle: "var(--surface)",
        },
      },
      fontFamily: {
        display: [
          "Bricolage Grotesque",
          "var(--font-display)",
          "sans-serif",
        ],
        body: [
          "Instrument Sans",
          "var(--font-body)",
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          "DM Mono",
          "var(--font-mono)",
          "monospace",
        ],
      },
      borderRadius: {
        none: "0px",
        xs: "2px",
        sm: "3px",
        md: "4px",
      },
      maxWidth: {
        prose: "68ch",
      },
      boxShadow: {
        panel: "-4px 0 24px var(--shadow-panel)",
        sheet: "0 -8px 32px var(--shadow-sheet)",
      },
      transitionTimingFunction: {
        ledger: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "220ms",
      },
    },
  },
  plugins: [],
};

export default config;
