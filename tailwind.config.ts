import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blush: {
          50: "#fff5f9",
          100: "#ffe9f2",
          200: "#ffd3e5",
          300: "#ffb3d1",
          400: "#ff8bb8",
          500: "#f76ba3",
          600: "#e84c8a",
          700: "#c73a70",
        },
        cream: "#fffafc",
        plum: {
          800: "#2a1a24",
          900: "#20121a",
          950: "#180d14",
        },
      },
      fontFamily: {
        sans: ["var(--font-noto-thai)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(247, 107, 163, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
