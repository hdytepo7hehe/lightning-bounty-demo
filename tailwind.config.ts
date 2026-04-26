import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        fg: "var(--color-fg)",
        accent: "var(--color-accent)",
      },
    },
  },
  plugins: [],
};

export default config;
