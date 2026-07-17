import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211c",
        canvas: "#f7f7f2",
        brand: "#1d6b4f",
        lime: "#c9f261",
      },
    },
  },
  plugins: [],
} satisfies Config;
