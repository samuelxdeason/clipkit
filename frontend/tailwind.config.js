/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Trove: moonlit forest colors, driven by the live theme tokens.
        ink: "rgb(var(--canvas-rgb) / <alpha-value>)",
        panel: "rgb(var(--panel-rgb) / <alpha-value>)",
        panel2: "rgb(var(--raised-rgb) / <alpha-value>)",
        edge: "rgb(var(--edge-rgb) / <alpha-value>)",
        muted: "rgb(var(--muted-rgb) / <alpha-value>)",
        fg: "rgb(var(--fg-rgb) / <alpha-value>)",
        noir: "#08080A",
        accent: "rgb(var(--ac-rgb) / <alpha-value>)",
        acink: "var(--ac-ink)", // readable text on the accent
      },
      borderRadius: {
        blob: "1rem",
      },
    },
  },
  plugins: [],
};
