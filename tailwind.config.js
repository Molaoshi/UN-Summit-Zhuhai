/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // --- UN Summit: Zhuhai design tokens ---
        paper: "#F6F1E7",
        "paper-deep": "#EFE7D6",
        card: {
          DEFAULT: "#FDFAF3",
          foreground: "#1E3A3C",
        },
        ink: "#1E3A3C",
        "ink-soft": "#55635F",
        "ink-faint": "#8B8F82",
        hairline: "#E3DAC6",
        gold: "#C49A33",
        "gold-soft": "#EADFBF",
        "gold-ink": "#7A6120",
        // Bloc colors
        bloc: {
          nuclear: "#B45A3C",
          "nuclear-soft": "#F2DFD5",
          green: "#5E7E58",
          "green-soft": "#DFE8DA",
          fossil: "#8C6A3F",
          "fossil-soft": "#EBE1CE",
          plum: "#7A5C6E",
          slate: "#55707F",
          olive: "#7C7A4A",
          clay: "#96604F",
        },
        // Deal-type colors
        deal: {
          military: "#A8503C",
          infrastructure: "#8A6A45",
          energy: "#B98A2E",
          technology: "#2E6E6A",
        },
        // Status colors
        status: {
          completed: "#4F7A52",
          "completed-soft": "#DDE8D9",
          ontrack: "#2E6E6A",
          "ontrack-soft": "#D9E7E4",
          atrisk: "#B07E22",
          "atrisk-soft": "#F2E4C6",
          failed: "#A94438",
          "failed-soft": "#F0DAD4",
          pending: "#8B8F82",
          "pending-soft": "#E8E4D8",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Nunito", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        card: "0 1px 2px rgba(30,58,60,.05), 0 6px 20px -8px rgba(30,58,60,.12)",
        raised: "0 4px 12px rgba(30,58,60,.10), 0 20px 48px -16px rgba(30,58,60,.22)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        marquee: "marquee 32s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
