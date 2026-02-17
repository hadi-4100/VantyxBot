/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base Colors - Black Theme
        void: "#000000",
        abyss: "#0a0a0f",
        shadow: "#12121a",
        midnight: "#1a1a28",
        cancel: "#292930",

        // Blue Accent Palette
        "blue-deep": "#0a1929",
        "blue-dark": "#0d2847",
        "blue-primary": "#1e40af",
        "blue-bright": "#3b82f6",
        "blue-glow": "#60a5fa",
        "blue-electric": "#93c5fd",

        // Legacy support (mapped to new system)
        background: "#000000",
        surface: "#0a0a0f",
        primary: "#3b82f6",
        secondary: "#1e40af",
        accent: "#60a5fa",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        display: ["72px", { lineHeight: "1.1", fontWeight: "900" }],
        h1: ["48px", { lineHeight: "1.2", fontWeight: "800" }],
        h2: ["36px", { lineHeight: "1.3", fontWeight: "700" }],
        h3: ["28px", { lineHeight: "1.4", fontWeight: "700" }],
        h4: ["24px", { lineHeight: "1.4", fontWeight: "600" }],
        h5: ["20px", { lineHeight: "1.5", fontWeight: "600" }],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      boxShadow: {
        "glow-sm": "0 0 8px rgba(59, 130, 246, 0.3)",
        glow: "0 0 16px rgba(59, 130, 246, 0.4)",
        "glow-lg": "0 0 24px rgba(59, 130, 246, 0.5)",
        "glow-cyan": "0 0 24px rgba(6, 182, 212, 0.4)",
        "glow-purple": "0 0 24px rgba(139, 92, 246, 0.4)",
        "glow-green": "0 0 24px rgba(16, 185, 129, 0.4)",
        "glow-red": "0 0 24px rgba(239, 68, 68, 0.4)",
        "glow-amber": "0 0 24px rgba(245, 158, 11, 0.4)",
        "elevation-sm": "0 2px 8px rgba(0, 0, 0, 0.4)",
        elevation: "0 4px 16px rgba(0, 0, 0, 0.5)",
        "elevation-lg": "0 8px 32px rgba(0, 0, 0, 0.6)",
        "elevation-xl": "0 12px 48px rgba(0, 0, 0, 0.7)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-blue": "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
        "gradient-blue-glow":
          "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
        shimmer:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(59, 130, 246, 0.4)" },
          "50%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.6)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "slide-in-left": "slide-in-left 0.4s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        float: "float 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
