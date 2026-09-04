import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "amber-core": {
          DEFAULT: "#FF9E64",
          soft: "#FFB077",
          deep: "#F39C12",
        },
        "dark-canvas": "#0B0C0E",
        muted: "#6B7280",
      },
      transitionTimingFunction: {
        expo: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      boxShadow: {
        glass:
          "0 8px 32px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.06) inset, 0 -12px 32px rgba(255,158,100,0.04)",
        "glass-deep":
          "0 24px 64px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.08) inset, 0 0 80px rgba(255,158,100,0.06)",
        "amber-ring":
          "0 0 0 1px rgba(255,158,100,0.6), 0 0 24px rgba(255,158,100,0.25)",
        "amber-soft": "0 0 40px rgba(255,158,100,0.18)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "Geist Sans", "SF Pro Display", "sans-serif"],
      },
      backdropBlur: {
        xs: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
