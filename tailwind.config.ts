import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0A2463",
        accent: "#3D99A2",
        "brand-primary": "#0A2463",
        "brand-accent": "#3D99A2",
        "brand-text": "#333333",
        "brand-neutral": "#F4F7F9",
        "brand-surface": "#FFFFFF",
        "background-light": "#F9FAFB",
        "background-dark": "#101922",
        "soft-gray": "#E5E7EB",
        charcoal: "#1F2937",
        "neutral-off-white": "#F9F9F9",
        "neutral-soft-gray": "#EFEFEF",
        "neutral-charcoal": "#333333",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        soft: "0 10px 25px -5px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;

