import type { Config } from "tailwindcss";

// Wires each custom color to Tailwind's opacity-modifier system. The CSS
// variable must hold a raw "R G B" triplet (see variables.css) — this
// function combines it with Tailwind's <alpha-value> placeholder so
// classes like bg-navy-950/60 or text-white/75 actually work. A previous
// version of this file used a bare `var(--x)` reference per color, which
// silently broke every opacity-modified usage of these colors sitewide
// (Tailwind can't extract an alpha channel from an already-composed
// value) — this is the fix for that.
function withOpacity(variable: string) {
  return `rgb(var(${variable}) / <alpha-value>)`;
}

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: withOpacity("--color-navy-950"),
          900: withOpacity("--color-navy-900"),
          800: withOpacity("--color-navy-800"),
          700: withOpacity("--color-navy-700"),
        },
        sky: {
          700: withOpacity("--color-sky-700"),
          600: withOpacity("--color-sky-600"),
          500: withOpacity("--color-sky-500"),
          400: withOpacity("--color-sky-400"),
          300: withOpacity("--color-sky-300"),
          200: withOpacity("--color-sky-200"),
          100: withOpacity("--color-sky-100"),
          50: withOpacity("--color-sky-50"),
        },
        gold: {
          600: withOpacity("--color-gold-600"),
          500: withOpacity("--color-gold-500"),
          200: withOpacity("--color-gold-200"),
        },
        blue: {
          700: withOpacity("--color-blue-700"),
          600: withOpacity("--color-blue-600"),
          500: withOpacity("--color-blue-500"),
          400: withOpacity("--color-blue-400"),
        },
        slate: {
          900: withOpacity("--color-slate-900"),
          800: withOpacity("--color-slate-800"),
          700: withOpacity("--color-slate-700"),
          600: withOpacity("--color-slate-600"),
          500: withOpacity("--color-slate-500"),
          400: withOpacity("--color-slate-400"),
          300: withOpacity("--color-slate-300"),
          200: withOpacity("--color-slate-200"),
          100: withOpacity("--color-slate-100"),
          50: withOpacity("--color-slate-50"),
        },
        // Brand-consistent success/danger — replaces Tailwind's stock
        // saturated green/red (which clash with the navy/champagne-gold
        // palette) for every existing bg-green-*/text-red-* usage
        // sitewide, without needing to touch each component.
        green: {
          700: withOpacity("--color-green-700"),
          600: withOpacity("--color-green-600"),
          500: withOpacity("--color-green-500"),
          400: withOpacity("--color-green-400"),
          100: withOpacity("--color-green-100"),
          50: withOpacity("--color-green-50"),
        },
        red: {
          700: withOpacity("--color-red-700"),
          600: withOpacity("--color-red-600"),
          500: withOpacity("--color-red-500"),
          400: withOpacity("--color-red-400"),
          300: withOpacity("--color-red-300"),
          200: withOpacity("--color-red-200"),
          100: withOpacity("--color-red-100"),
          50: withOpacity("--color-red-50"),
        },
        // Repointed so `text-white` / `bg-white` / `border-white` resolve to
        // an off-white, never pure #fff — alpha modifiers (bg-white/95,
        // text-white/90) now work correctly via the withOpacity() pattern.
        white: withOpacity("--color-white"),
        glass: {
          border: "var(--color-glass-border)",
          surface: "var(--color-glass-surface)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        editorial: ["var(--font-editorial)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-data)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        lifted: "var(--shadow-lifted)",
        crisp: "var(--shadow-crisp)",
        glow: "var(--shadow-glow)",
      },
      borderRadius: {
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      maxWidth: {
        container: "1280px",
      },
      letterSpacing: {
        widest2: "0.2em",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        900: "900ms",
        1200: "1200ms",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "blur-in": {
          "0%": { opacity: "0", filter: "blur(12px)" },
          "100%": { opacity: "1", filter: "blur(0)" },
        },
        "zoom-slow": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.08)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up-editorial": "fade-up 1.1s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in-editorial": "fade-in 1.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "blur-in-editorial": "blur-in 1.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "zoom-slow": "zoom-slow 14s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer: "shimmer 2.2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;