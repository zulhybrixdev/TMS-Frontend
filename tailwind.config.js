/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter Variable'", "Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["'Space Grotesk'", "'Inter Variable'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        plane: "var(--plane)",
        border: "var(--border)",
        ink: "var(--ink)",
        "ink-secondary": "var(--ink-secondary)",
        "ink-muted": "var(--ink-muted)",
        brand: {
          DEFAULT: "var(--brand)",
          hover: "var(--brand-hover)",
          soft: "var(--brand-soft)",
        },
        status: {
          good: "var(--status-good)",
          "good-soft": "var(--status-good-soft)",
          warning: "var(--status-warning)",
          "warning-soft": "var(--status-warning-soft)",
          serious: "var(--status-serious)",
          "serious-soft": "var(--status-serious-soft)",
          critical: "var(--status-critical)",
          "critical-soft": "var(--status-critical-soft)",
        },
        series: {
          1: "var(--series-1)",
          2: "var(--series-2)",
          3: "var(--series-3)",
          4: "var(--series-4)",
          5: "var(--series-5)",
        },
        chrome: {
          DEFAULT: "var(--chrome-bg)",
          raised: "var(--chrome-bg-raised)",
          border: "var(--chrome-border)",
          ink: "var(--chrome-ink)",
          muted: "var(--chrome-ink-muted)",
          active: "var(--chrome-active)",
          accent: "var(--chrome-accent)",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,11,11,0.04), 0 1px 1px rgba(11,11,11,0.03)",
        popover: "0 12px 32px rgba(11,11,11,0.14), 0 2px 8px rgba(11,11,11,0.06)",
      },
      borderRadius: {
        card: "12px",
      },
      keyframes: {
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "slide-up": { from: { opacity: 0, transform: "translateY(6px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out",
        "slide-up": "slide-up 220ms cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [],
};
