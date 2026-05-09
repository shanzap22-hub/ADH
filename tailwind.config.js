/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // -------------------------------------------------------
      // Font Family
      // -------------------------------------------------------
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },

      // -------------------------------------------------------
      // Colors — CSS variable based + brand palette
      // -------------------------------------------------------
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
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand color shortcuts
        brand: {
          DEFAULT: "hsl(var(--brand))",
          light:   "hsl(var(--brand-light))",
          dark:    "hsl(var(--brand-dark))",
        },
      },

      // -------------------------------------------------------
      // Border Radius — rounder = premium feel
      // -------------------------------------------------------
      borderRadius: {
        lg:  "var(--radius)",
        md:  "calc(var(--radius) - 2px)",
        sm:  "calc(var(--radius) - 4px)",
        xl:  "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },

      // -------------------------------------------------------
      // Box Shadows — premium layered shadows
      // -------------------------------------------------------
      boxShadow: {
        // Soft card shadow
        "card": "0 1px 3px hsl(0 0% 0% / 0.05), 0 4px 16px hsl(0 0% 0% / 0.04)",
        "card-hover": "0 8px 24px hsl(0 0% 0% / 0.08), 0 2px 8px hsl(0 0% 0% / 0.04)",
        // Brand glow — purple
        "glow": "0 0 0 3px hsl(262 83% 58% / 0.15)",
        "glow-lg": "0 8px 32px hsl(262 83% 58% / 0.25)",
        // Cinema/video shadow
        "cinema": "0 0 60px -12px hsl(0 0% 0% / 0.6)",
        // Inner highlight
        "inner-highlight": "inset 0 1px 0 hsl(0 0% 100% / 0.06)",
      },

      // -------------------------------------------------------
      // Keyframes & Animations
      // -------------------------------------------------------
      keyframes: {
        // Existing
        blob: {
          "0%":   { transform: "translate(0px, 0px) scale(1)" },
          "33%":  { transform: "translate(30px, -50px) scale(1.1)" },
          "66%":  { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        // Premium new animations
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)"    },
        },
        "fade-down": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to:   { opacity: "1", transform: "translateY(0)"    },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to:   { opacity: "1", transform: "translateX(0)"     },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)"    },
        },
        "shimmer": {
          from: { transform: "translateX(-200%)" },
          to:   { transform: "translateX(200%)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(262 83% 58% / 0.3)" },
          "50%":      { boxShadow: "0 0 0 8px hsl(262 83% 58% / 0)"  },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)"   },
          "50%":      { transform: "translateY(-6px)"  },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)"   },
          to:   { transform: "rotate(360deg)" },
        },
      },
      animation: {
        // Existing
        blob: "blob 7s infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // New premium animations
        "fade-in":      "fade-in 0.2s ease-out",
        "fade-up":      "fade-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "fade-down":    "fade-down 0.2s ease-out",
        "slide-left":   "slide-in-left 0.25s ease-out",
        "scale-in":     "scale-in 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "shimmer":      "shimmer 1.6s ease-in-out infinite",
        "pulse-glow":   "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float":        "float 3s ease-in-out infinite",
        "spin-slow":    "spin-slow 3s linear infinite",
      },

      // -------------------------------------------------------
      // Background Image — gradient presets
      // -------------------------------------------------------
      backgroundImage: {
        "gradient-brand":  "linear-gradient(135deg, hsl(262 83% 58%), hsl(291 64% 62%))",
        "gradient-subtle": "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
