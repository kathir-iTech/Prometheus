/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic color tokens (design system)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        cardforeground: "hsl(var(--card-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",

        // Zinc palette (full range for design system)
        zinc: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },

        // Semantic surface colors
        surface: "zinc-900",
        "surface-elevated": "zinc-800",
        "surface-dim": "zinc-900/50",

        // Semantic text colors
        "text-primary": "zinc-400",
        "text-secondary": "zinc-500",
        "text-muted": "zinc-400/60",
        "text-on-surface": "zinc-100",

        // Highlight colors - tuned for light mode (white background)
        red: {
          DEFAULT: "rgba(239, 68, 68, 0.12)",
          foreground: "#dc2626",
        },
        yellow: {
          DEFAULT: "rgba(234, 179, 8, 0.18)",
          foreground: "#ca8a04",
        },
        orange: {
          DEFAULT: "rgba(249, 115, 22, 0.14)",
          foreground: "#ea580c",
        },
        green: {
          DEFAULT: "rgba(34, 197, 94, 0.12)",
          foreground: "#16a34a",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
}

