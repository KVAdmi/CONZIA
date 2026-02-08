import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Visor theme — confianza, armonía, premium sobrio (inspirado en referencia)
        // Light: misty cream base + fog blues, plum accent, warm ink.
        alabaster: "#EAE6DF", // app background (Misty Cream)
        "mint-cream": "#F4F0EA", // rest surface
        camel: "#7D5C6B", // accent (Muted Plum)
        white: "#FFFFFF", // cards
        gainsboro: "#D8D2C8", // borders/dividers (warm)
        "morning-blue": "#6B7C87", // secondary text
        "outer-space": "#1C1917", // primary ink (warm)

        // Extras (opcional en UI nueva / charts)
        chestnut: "#542919",
        "clay-taupe": "#A39483",
        "fog-blue": "#A8B5C1",
        "muted-plum": "#7D5C6B",
      },
      boxShadow: {
        card: "0 22px 55px rgba(28, 25, 23, 0.10)",
      },
      borderRadius: {
        xl: "0.9rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
