import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ID8Labs VHS Surface colors (blue-black for cinematic feel)
        surface: {
          primary: "hsl(240 4% 4%)",
          secondary: "hsl(240 4% 6%)",
          tertiary: "hsl(240 4% 8%)",
          elevated: "hsl(240 4% 10%)",
        },
        // VHS Orange - ID8Labs brand accent
        vhs: {
          DEFAULT: "hsl(17 85% 62%)",
          50: "hsl(17 85% 95%)",
          100: "hsl(17 85% 90%)",
          200: "hsl(17 85% 80%)",
          300: "hsl(17 85% 70%)",
          400: "hsl(17 85% 62%)",
          500: "hsl(17 94% 53%)",
          600: "hsl(17 85% 45%)",
          700: "hsl(17 85% 35%)",
          800: "hsl(17 85% 25%)",
          900: "hsl(17 85% 15%)",
          950: "hsl(17 85% 8%)",
        },
        // Panel and sidebar semantic colors
        panel: {
          bg: "hsl(240 4% 5%)",
          border: "hsl(0 0% 15%)",
          header: "hsl(240 4% 7%)",
        },
        sidebar: {
          bg: "hsl(240 4% 6%)",
          border: "hsl(0 0% 15%)",
          hover: "hsl(0 0% 12%)",
          active: "hsl(17 85% 12%)",
        },
        // Lexicon brand colors - kept for compatibility
        lexicon: {
          DEFAULT: "#0ea5e9",
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        // Graph visualization colors
        graph: {
          character: "#8b5cf6",
          location: "#10b981",
          event: "#f59e0b",
          object: "#ec4899",
          faction: "#06b6d4",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      boxShadow: {
        // VHS Orange glows
        "vhs-sm": "0 0 15px hsla(17, 85%, 62%, 0.3)",
        "vhs": "0 0 30px hsla(17, 85%, 62%, 0.4), 0 0 60px hsla(17, 85%, 62%, 0.2)",
        "vhs-lg": "0 0 50px hsla(17, 85%, 62%, 0.5), 0 0 100px hsla(17, 85%, 62%, 0.25)",
        // Legacy Lexicon blue glows
        "glow-sm": "0 0 15px rgba(56, 189, 248, 0.3)",
        glow: "0 0 30px rgba(56, 189, 248, 0.4), 0 0 60px rgba(56, 189, 248, 0.2)",
        "glow-lg": "0 0 50px rgba(56, 189, 248, 0.5), 0 0 100px rgba(56, 189, 248, 0.25)",
        // General effects
        glass: "0 8px 32px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 4px 20px rgba(0, 0, 0, 0.4)",
      },
      borderRadius: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "2rem",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "graph-node": "graph-node 0.3s ease-out",
        float: "float 6s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        "graph-node": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(56, 189, 248, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(56, 189, 248, 0.4), 0 0 60px rgba(56, 189, 248, 0.2)" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
