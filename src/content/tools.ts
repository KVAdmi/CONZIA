export type QuickTool = {
  id: string;
  title: string;
  subtitle: string;
  steps: string[];
};

export const QUICK_TOOLS: QuickTool[] = [
  {
    id: "t_responder_sin_justificar",
    title: "Responder sin justificarme",
    subtitle: "Dos frases. Sin defensa.",
    steps: [
      "“No voy a explicar más.”",
      "“Esto es lo que voy a hacer / esto es lo que no voy a hacer.”",
    ],
  },
  {
    id: "t_salir_que_diran",
    title: "Salir del “qué dirán”",
    subtitle: "Una pregunta brutal.",
    steps: ["“¿A quién le estoy dando el voto final de mi vida?”"],
  },
  {
    id: "t_limite_hoy",
    title: "Poner un límite hoy",
    subtitle: "Plantilla breve.",
    steps: [
      "“No puedo con eso.”",
      "“Puedo con esto otro: ____.”",
      "“Si no, lo vemos después.”",
    ],
  },
];

