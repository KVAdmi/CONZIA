import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta Oficial CONZIA
        "conzia-dark": "#1E2A38",    // Azul Oscuro Profundo
        "conzia-gray": "#3A4654",    // Gris Azulado
        "conzia-muted": "#7F809D",   // Lavanda Muted
        "conzia-light": "#F4F6F8",   // Gris Claro / Blanco
        "camel": "#DDB273",          // Dorado / Camel (Acento)
        
        // Mantenemos compatibilidad con nombres anteriores si es necesario
        "morning-blue": "#6B7C87",
        "outer-space": "#1C1917",
      },
      backgroundImage: {
        'conzia-gradient': 'linear-gradient(135deg, #F4F6F8 0%, #EAE6DF 100%)',
        'conzia-dark-gradient': 'linear-gradient(135deg, #1E2A38 0%, #3A4654 100%)',
      },
      boxShadow: {
        card: "0 22px 55px rgba(30, 42, 56, 0.10)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
