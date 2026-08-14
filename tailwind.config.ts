import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // 👈 이 줄이 반드시 있어야 합니다!!!
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;