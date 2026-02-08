export type ISODateString = string;

export type EnergyLevel = "baja" | "media" | "alta";
export type ClarityLevel = "nublado" | "medio" | "alto";

export type EntryType =
  | "desahogo_libre"
  | "algo_me_incomodo"
  | "queria_hacer_algo_distinto"
  | "hoy_si_lo_hice"
  | "no_quise_ver_esto";

export type EntryContext = "familia" | "trabajo" | "pareja" | "social" | "yo";

export type EntryBoundary =
  | "tiempo"
  | "respeto"
  | "cuerpo"
  | "dinero"
  | "decision"
  | "intimidad";

export type EntryReaction =
  | "cedi"
  | "calle"
  | "explote"
  | "hui"
  | "negocie"
  | "pedi"
  | "puse_limite";

export type RepeatSignal = "no" | "creo_que_si" | "si";

export type Entry = {
  id: string;
  date: ISODateString;
  type: EntryType;
  context: EntryContext;
  boundary: EntryBoundary;
  reaction: EntryReaction;
  emotionalWeight: number; // 0–10
  text: string;
  tags: string[];
  linkedIntentionId?: string;
  repeatSignal?: RepeatSignal;
  // Marca de UX: el usuario eligió guardar sin lectura inmediata.
  // No es “contenido clínico”; solo una señal de ritual.
  silenceMode?: boolean;
  // Referencia opcional a una práctica (shadow work) sugerida por el sistema.
  practiceId?: string;
};

export type IntentionType =
  | "Poner un límite"
  | "Decir que no"
  | "No justificarme"
  | "Pedir lo que necesito"
  | "No ceder"
  | "No controlar"
  | "No perseguir"
  | "Hablar claro"
  | "Priorizarme";

export type IntentionOutcome = "lo_hice" | "no_lo_hice" | "a_medias";

export type IntentionBlock =
  | "miedo"
  | "culpa"
  | "costumbre"
  | "presion"
  | "apego"
  | "confusion";

export type Intention = {
  id: string;
  date: ISODateString;
  intentionType: IntentionType;
  outcome?: IntentionOutcome;
  block?: IntentionBlock;
  note?: string;
};

export type Trend = "up" | "down" | "flat";

export type Pattern = {
  id: string;
  name: string;
  frequency30d: number;
  contexts: EntryContext[];
  trend: Trend;
  evidenceEntryIds: string[];
};

export type ReadingType =
  | "lectura_del_dia"
  | "reflejo"
  | "evento_incomodo"
  | "intencion_no_lograda"
  | "patron_activo"
  | "semanal"
  | "test";

export type ReadingContent = {
  contencion: string;
  loQueVeo: string;
  patron?: string;
  loQueEvitas: string;
  pregunta: string;
  accionMinima?: string;
};

export type Reading = {
  id: string;
  date: ISODateString;
  entryId?: string;
  type: ReadingType;
  content: ReadingContent;
  patternId?: string;
  basedOnEntryIds?: string[];
};

export type VaultNote = {
  id: string;
  date: ISODateString;
  title?: string;
  content: string;
  sealed: true;
};

export type MirrorStory = {
  id: string;
  patternId: string;
  story: string;
  highlights: string[];
  questions: string[];
  basedOnEntryIds?: string[];
};

export type CheckIn = {
  id: string;
  date: ISODateString;
  honestyLayer?: EntryType;
  dominantTags: string[]; // máx 3
  energy: EnergyLevel;
  emotionalWeight: number; // 0–10
  clarity: ClarityLevel;
};

export type ConziaSeedData = {
  checkIns: CheckIn[];
  entries: Entry[];
  intentions: Intention[];
  patterns: Pattern[];
  readings: Reading[];
  vaultNotes: VaultNote[];
  mirrorStories: MirrorStory[];
};

export type DoorId = "sesion" | "consultorio" | "mesa" | "proceso";

export type ConziaArchetype = "guerrero" | "sabio_rey" | "amante" | "mago";

export type ConziaDrivingStyle = "Directo" | "Sobrio" | "Relacional" | "Reflexivo";

export type ConziaProfile = {
  alias: string;
  email?: string;
  tz: string;
  country: string;
  tema_base: string;
  costo_dominante: string;
  arquetipo_dominante: ConziaArchetype;
  arquetipo_secundario: ConziaArchetype;
  confianza: number;
  estilo_conduccion: ConziaDrivingStyle;
  registrationDone: true;
};

export type ConziaProcessStatus = "open" | "closed";

export type ConziaProcess = {
  id: string;
  tema_activo: string;
  day_index: number;
  status: ConziaProcessStatus;
  started_at: ISODateString; // datetime ISO
  last_closed_at?: ISODateString; // datetime ISO
};

export type ConziaSession = {
  id: string;
  process_id: string;
  date_key: ISODateString; // YYYY-MM-DD
  door: DoorId;
  closed: boolean;
  started_at: ISODateString; // datetime ISO
  closed_at?: ISODateString; // datetime ISO
  summary_min?: string;
};

export type ConziaEntrySource = "consultorio" | "mesa";

export type ConziaEntry = {
  id: string;
  process_id: string;
  session_id: string;
  source: ConziaEntrySource;
  hecho: string;
  contexto: EntryContext;
  limite: EntryBoundary;
  rol: string;
  peso: number; // 0–10
  repeticion_flag: RepeatSignal;
  created_at: ISODateString; // datetime ISO
};
