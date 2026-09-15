import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1F113D",
        paper: "#F8F4FF",
        accent: "#7C3AED",
        line: "#E9DDFF",
        stone: "#6B5A8A",
        sand: "#F3E8FF",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
      },
    },
  },
  plugins: [],
};

export default config;
