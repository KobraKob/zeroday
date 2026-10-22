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
        cream: "#FFF6E5",
        ink: "var(--color-ink)",
        cobalt: {
          DEFAULT: "#2536E8",
          hover: "#1D2BB8",
          subtle: "#ECEEFE",
        },
        marigold: {
          DEFAULT: "#FFC21A",
          subtle: "#FFF8E6",
        },
        coral: {
          DEFAULT: "#FF6B4A",
          subtle: "#FFF0EC",
        },
        mint: {
          DEFAULT: "#5FE0B0",
          subtle: "#EEFCF6",
        },
        paper: "var(--color-paper)",
        surface: "var(--color-surface)",
        muted: "var(--color-muted)",
        hairline: {
          DEFAULT: "var(--color-hairline)",
          subtle: "var(--color-hairline-subtle)",
        },
        verdigris: {
          DEFAULT: "var(--color-verdigris)",
          hover: "var(--color-verdigris-hover)",
          subtle: "var(--color-verdigris-subtle)",
        },
        vermilion: {
          DEFAULT: "var(--color-vermilion)",
          subtle: "var(--color-vermilion-subtle)",
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
