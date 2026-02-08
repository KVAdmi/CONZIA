export type TestTheme =
  | "límites"
  | "autoestima"
  | "evitación"
  | "rumiación"
  | "apego"
  | "desgaste";

export type TestLength = "corto" | "largo";

export type TestQuestion = {
  id: string;
  text: string;
  reverse?: boolean;
};

export type ConziaTest = {
  id: string;
  theme: TestTheme;
  length: TestLength;
  title: string;
  description: string;
  questions: TestQuestion[];
  suggestedPatternId?: string;
};

function q(id: string, text: string, reverse?: boolean): TestQuestion {
  return reverse ? { id, text, reverse } : { id, text };
}

export const TESTS: ConziaTest[] = [
  {
    id: "t_limites_corto",
    theme: "límites",
    length: "corto",
    title: "Pulso de límites (corto)",
    description: "Detecta ceder temprano y explotar tarde.",
    suggestedPatternId: "p_001",
    questions: [
      q("q1", "Digo que sí antes de revisar si realmente puedo."),
      q("q2", "Me cuesta decir no sin justificar."),
      q("q3", "Acepto cambios de último minuto aunque me afecten."),
      q("q4", "Me doy cuenta tarde de que ya crucé mi límite."),
      q("q5", "Prefiero aguantar para no incomodar."),
      q("q6", "Termino resentido por cosas que “yo acepté”."),
      q("q7", "Pongo límites solo cuando ya estoy al límite."),
      q("q8", "Me siento culpable cuando priorizo mi tiempo.")
    ]
  },
  {
    id: "t_autoestima_corto",
    theme: "autoestima",
    length: "corto",
    title: "Autoestima sin maquillaje (corto)",
    description: "Detecta autoanulación y permiso externo.",
    suggestedPatternId: "p_005",
    questions: [
      q("q1", "Me hago pequeño para evitar conflicto."),
      q("q2", "Me cuesta pedir lo que necesito."),
      q("q3", "Me disculpo incluso cuando no hice nada malo."),
      q("q4", "Cambio mi postura para no parecer “difícil”."),
      q("q5", "Evito decir lo que quiero si puede incomodar."),
      q("q6", "Me cuesta sostener mi decisión sin aprobación."),
      q("q7", "Me siento expuesto cuando soy directo."),
      q("q8", "Digo ‘no pasa nada’ cuando sí pasa.")
    ]
  },
  {
    id: "t_evitacion_corto",
    theme: "evitación",
    length: "corto",
    title: "Evitación activa (corto)",
    description: "Detecta postergación emocional con excusas limpias.",
    suggestedPatternId: "p_003",
    questions: [
      q("q1", "Cuando algo me incomoda, lo convierto en análisis."),
      q("q2", "Evito conversaciones difíciles aunque me afecten."),
      q("q3", "Me distraigo cuando debería decidir."),
      q("q4", "Me digo ‘luego lo veo’ para no sentir."),
      q("q5", "Prefiero esperar señales en lugar de preguntar directo."),
      q("q6", "Me convenzo de que ‘no es tan importante’."),
      q("q7", "Me quedo en la cabeza para no estar en el cuerpo."),
      q("q8", "Busco claridad perfecta antes de moverme.")
    ]
  },
  {
    id: "t_rumiacion_corto",
    theme: "rumiación",
    length: "corto",
    title: "Rumiación circular (corto)",
    description: "Detecta vueltas mentales como forma de control.",
    suggestedPatternId: "p_004",
    questions: [
      q("q1", "Reviso conversaciones pasadas buscando la frase perfecta."),
      q("q2", "Me cuesta soltar un tema cuando me activa."),
      q("q3", "Pienso escenarios una y otra vez."),
      q("q4", "Necesito entender todo antes de actuar."),
      q("q5", "Me cuesta quedarme en ‘no sé’."),
      q("q6", "La rumiación me roba sueño."),
      q("q7", "Me justifico con ‘solo estoy pensando’."),
      q("q8", "Me cuesta decidir con información incompleta.")
    ]
  },
  {
    id: "t_apego_corto",
    theme: "apego",
    length: "corto",
    title: "Apego a señales (corto)",
    description: "Detecta persecución de confirmación.",
    suggestedPatternId: "p_002",
    questions: [
      q("q1", "Me altera que tarden en responderme."),
      q("q2", "Interpreto señales pequeñas como prueba de valor."),
      q("q3", "Me cuesta pedir claridad directa en vínculos."),
      q("q4", "Hago ‘algo casual’ para provocar respuesta."),
      q("q5", "Me tranquiliza más una señal que una conversación real."),
      q("q6", "Me quedo pendiente del teléfono."),
      q("q7", "Me cuesta sostener distancia sin intervenir."),
      q("q8", "Confundo ansiedad con conexión.")
    ]
  },
  {
    id: "t_desgaste_corto",
    theme: "desgaste",
    length: "corto",
    title: "Desgaste por sostener (corto)",
    description: "Detecta carga crónica por autoexigencia y utilidad.",
    suggestedPatternId: "p_001",
    questions: [
      q("q1", "Me siento responsable de sostener el ambiente."),
      q("q2", "Me cuesta descansar sin culpa."),
      q("q3", "Ser ‘útil’ define mi valor."),
      q("q4", "Me cuesta delegar aunque esté saturado."),
      q("q5", "Me desconecto para seguir funcionando."),
      q("q6", "Me siento cansado incluso cuando no hago tanto."),
      q("q7", "Me digo ‘aguanta’ como norma."),
      q("q8", "Pospongo necesidades básicas (comer, dormir, moverme).")
    ]
  },
  {
    id: "t_limites_largo",
    theme: "límites",
    length: "largo",
    title: "Inventario de límites (largo)",
    description: "Mapea límites por contexto y reacción dominante.",
    suggestedPatternId: "p_001",
    questions: [
      q("q1", "Acepto tareas que no me corresponden."),
      q("q2", "Me cuesta decir ‘no’ a familia."),
      q("q3", "Me cuesta decir ‘no’ en trabajo."),
      q("q4", "Me cuesta decir ‘no’ en pareja."),
      q("q5", "Respondo mensajes aunque ya no tenga energía."),
      q("q6", "Me justifico para que el otro no se enoje."),
      q("q7", "Me siento egoísta cuando elijo mi plan."),
      q("q8", "Me cuesta pedir respeto en el momento."),
      q("q9", "Me callo para evitar tensión."),
      q("q10", "Exploto cuando ya acumulé demasiado."),
      q("q11", "Me cuesta sostener el silencio después de poner un límite."),
      q("q12", "Me preocupo más por la reacción que por mi necesidad."),
      q("q13", "Me cuesta decir ‘esto no’ sin ofrecer algo a cambio."),
      q("q14", "Me cuesta detener una conversación que me lastima."),
      q("q15", "Pongo mi cuerpo al final (sueño, comida, descanso)."),
      q("q16", "Me cuesta pedir tiempo para pensar."),
      q("q17", "Me comprometo con fechas que no puedo cumplir."),
      q("q18", "Evito cobrar o hablar de dinero por incomodidad."),
      q("q19", "Me siento responsable de resolverlo todo."),
      q("q20", "Me cuesta distinguir ayuda de autoabandono."),
      q("q21", "Hago cosas por miedo a que me dejen de querer."),
      q("q22", "Me cuesta decir ‘no puedo con eso’ sin sentir culpa."),
      q("q23", "Mi límite llega tarde: primero cedo, luego me arrepiento."),
      q("q24", "Siento resentimiento por decisiones que yo tomé.")
    ]
  },
  {
    id: "t_evitacion_largo",
    theme: "evitación",
    length: "largo",
    title: "Mapa de evitación (largo)",
    description: "Identifica cómo postergas la verdad con hábitos ‘productivos’.",
    suggestedPatternId: "p_003",
    questions: [
      q("q1", "Procrastino lo importante y hago cosas menores."),
      q("q2", "Me distraigo justo cuando tengo que decidir."),
      q("q3", "Me cuesta pedir lo que necesito por miedo a molestar."),
      q("q4", "Evito conversaciones incómodas."),
      q("q5", "Me digo ‘no es para tanto’ para no sentir."),
      q("q6", "Uso el humor para evitar vulnerabilidad."),
      q("q7", "Me vuelvo eficiente para no volverme honesto."),
      q("q8", "Me cuesta quedarme sin respuesta."),
      q("q9", "Me cuesta aceptar que algo me duele."),
      q("q10", "Me cuesta pedir claridad directa."),
      q("q11", "Me digo ‘primero necesito entender’ para posponer."),
      q("q12", "Busco aprobación sin pedirla de frente."),
      q("q13", "Evito el conflicto aunque me cueste."),
      q("q14", "Me desconecto (pantallas/ruido) cuando me activo."),
      q("q15", "Me cuesta estar en silencio conmigo."),
      q("q16", "Me quedo en la cabeza en lugar de sentir el cuerpo."),
      q("q17", "Me cuesta sostener una incomodidad breve."),
      q("q18", "Me cuesta cortar una rumiación cuando empieza."),
      q("q19", "Me cuesta decir ‘esto sí me importa’."),
      q("q20", "Me cuesta mirar mis patrones sin justificarme."),
      q("q21", "Prefiero una excusa elegante a una verdad simple."),
      q("q22", "Evito elegir para no perder opciones.")
    ]
  }
];
