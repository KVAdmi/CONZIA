import type { EntryType } from "../types/models";

export type ShadowPractice = {
  id: string;
  title: string;
  subtitle: string;
  minutes: number;
  layer: EntryType;
  prompt: string;
};

export const SHADOW_PRACTICES: ShadowPractice[] = [
  {
    id: "sp_beneficio_oculto",
    title: "Beneficio oculto",
    subtitle: "Lo que ganas al sostener el patrón.",
    minutes: 5,
    layer: "no_quise_ver_esto",
    prompt:
      "Completa sin justificar:\n\n" +
      "1) Sostengo este patrón para evitar: _____.\n" +
      "2) El beneficio inmediato que obtengo es: _____.\n" +
      "3) El costo real que pago es: _____.\n" +
      "4) Si lo suelto, lo que temo perder es: _____.\n" +
      "5) La ganancia real (si aguanto la incomodidad) sería: _____.\n",
  },
  {
    id: "sp_disparador_real",
    title: "Disparador real",
    subtitle: "No es el evento. Es lo que tocó.",
    minutes: 7,
    layer: "algo_me_incomodo",
    prompt:
      "Hecho (1 línea): _____.\n\n" +
      "Disparador: ¿qué parte de mí se sintió en peligro? _____.\n" +
      "Reacción automática: _____.\n" +
      "Lo que quise decir (sin justificar): _____.\n" +
      "Lo que estoy evitando aceptar: _____.\n",
  },
  {
    id: "sp_primera_vez",
    title: "Primera vez",
    subtitle: "La escena donde aprendiste la regla.",
    minutes: 10,
    layer: "no_quise_ver_esto",
    prompt:
      "¿Cuándo aprendiste que decir no era peligroso?\n\n" +
      "Qué pasaba.\n" +
      "Qué hiciste para sobrevivir.\n" +
      "Qué sigues repitiendo hoy como si fuera la misma escena.\n",
  },
  {
    id: "sp_dialogo_parte",
    title: "Diálogo con la parte que cede",
    subtitle: "No la mates. Entiéndela.",
    minutes: 8,
    layer: "desahogo_libre",
    prompt:
      "Si la parte que cede hablara, diría:\n" +
      "“_____”.\n\n" +
      "Lo que cree que protege: _____.\n" +
      "Lo que no ve: _____.\n" +
      "Lo que necesita para soltar (sin heroísmo): _____.\n",
  },
  {
    id: "sp_talento_oculto",
    title: "Talento reprimido",
    subtitle: "Lo que escondiste para encajar.",
    minutes: 8,
    layer: "hoy_si_lo_hice",
    prompt:
      "Rasgo que reprimí para encajar: _____.\n" +
      "Quién lo castigó / dónde lo aprendí: _____.\n" +
      "Cómo se asoma hoy (control, ira, apatía, “buena persona”): _____.\n" +
      "Si lo uso con cuidado, se vuelve: _____.\n",
  },
  {
    id: "sp_ego_verdad",
    title: "Ego vs verdad",
    subtitle: "La imagen que estás sosteniendo.",
    minutes: 6,
    layer: "no_quise_ver_esto",
    prompt:
      "Imagen que intento sostener: _____.\n" +
      "Lo que temo que vean: _____.\n" +
      "Lo que oculto para sostener esa imagen: _____.\n" +
      "Un acto pequeño de autenticidad hoy: _____.\n",
  },
];

