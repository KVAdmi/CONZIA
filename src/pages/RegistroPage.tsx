import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { useConzia } from "../state/conziaStore";
import { createId } from "../utils/id";
import type { ConziaArchetype, ConziaDrivingStyle, ConziaProfile } from "../types/models";

type StepId = "r1" | "r2" | "r3" | "resumen";

type ThemeOption = { id: string; label: string };
type CostOption = { id: string; label: string };

const THEMES: ThemeOption[] = [
  { id: "p_001", label: "Falta de límites" },
  { id: "p_002", label: "Apego a aprobación" },
  { id: "p_003", label: "Evitación activa" },
  { id: "p_004", label: "Rumiación circular" },
  { id: "p_005", label: "Autoanulación" },
  { id: "p_006", label: "Qué dirán estructural" },
];

const COSTS: CostOption[] = [
  { id: "tension", label: "Tensión y conflicto evitado" },
  { id: "culpa", label: "Culpa" },
  { id: "ansiedad", label: "Ansiedad y rumiación" },
  { id: "autoabandono", label: "Autoabandono" },
  { id: "resentimiento", label: "Resentimiento acumulado" },
  { id: "desgaste", label: "Desgaste y agotamiento" },
];

const ARCHETYPES: Array<{ id: ConziaArchetype; label: string; style: ConziaDrivingStyle }> = [
  { id: "guerrero", label: "Guerrero", style: "Directo" },
  { id: "sabio_rey", label: "Sabio / Rey", style: "Sobrio" },
  { id: "amante", label: "Amante", style: "Relacional" },
  { id: "mago", label: "Mago", style: "Reflexivo" },
];

type ArchetypeQuestion = {
  id: string;
  prompt: string;
  options: Array<{ archetype: ConziaArchetype; label: string }>;
};

const QUESTIONS: ArchetypeQuestion[] = [
  {
    id: "q1",
    prompt: "Cuando algo me incomoda, mi primer impulso es…",
    options: [
      { archetype: "guerrero", label: "Actuar y cortar." },
      { archetype: "sabio_rey", label: "Definir regla y sostenerla." },
      { archetype: "amante", label: "Cuidar el vínculo y suavizar." },
      { archetype: "mago", label: "Observar el patrón antes de moverme." },
    ],
  },
  {
    id: "q2",
    prompt: "Si siento que pierdo control, yo…",
    options: [
      { archetype: "guerrero", label: "Subo el ritmo. Resuelvo." },
      { archetype: "sabio_rey", label: "Ordeno prioridades. Pongo límites claros." },
      { archetype: "amante", label: "Busco cercanía y confirmación." },
      { archetype: "mago", label: "Me voy a la cabeza. Analizo." },
    ],
  },
  {
    id: "q3",
    prompt: "Cuando me piden algo que no quiero hacer, yo…",
    options: [
      { archetype: "guerrero", label: "Digo no directo." },
      { archetype: "sabio_rey", label: "Negocio desde una regla (sin drama)." },
      { archetype: "amante", label: "Digo que sí para no incomodar." },
      { archetype: "mago", label: "Lo dejo abierto para ganar tiempo." },
    ],
  },
  {
    id: "q4",
    prompt: "Cuando algo se pone tenso, yo…",
    options: [
      { archetype: "guerrero", label: "Enfrento." },
      { archetype: "sabio_rey", label: "Bajo el tono y conduzco." },
      { archetype: "amante", label: "Busco reparar rápido." },
      { archetype: "mago", label: "Me retiro a observar." },
    ],
  },
  {
    id: "q5",
    prompt: "Mi forma típica de evitar una verdad es…",
    options: [
      { archetype: "guerrero", label: "Convertirla en acción sin sentirla." },
      { archetype: "sabio_rey", label: "Convertirla en regla para no tocarla." },
      { archetype: "amante", label: "Convertirla en vínculo para no perder." },
      { archetype: "mago", label: "Convertirla en explicación." },
    ],
  },
  {
    id: "q6",
    prompt: "Cuando cometo un error, yo…",
    options: [
      { archetype: "guerrero", label: "Me exijo y corrijo de inmediato." },
      { archetype: "sabio_rey", label: "Lo pongo en contexto y ajusto el sistema." },
      { archetype: "amante", label: "Me preocupo por cómo quedé con el otro." },
      { archetype: "mago", label: "Busco la causa profunda." },
    ],
  },
  {
    id: "q7",
    prompt: "Cuando alguien se aleja, mi reacción es…",
    options: [
      { archetype: "guerrero", label: "Me cierro y sigo." },
      { archetype: "sabio_rey", label: "Pido claridad y decido con calma." },
      { archetype: "amante", label: "Me activo. Busco señal." },
      { archetype: "mago", label: "Leo señales. Interpreto." },
    ],
  },
  {
    id: "q8",
    prompt: "Si tengo que elegir rápido, yo…",
    options: [
      { archetype: "guerrero", label: "Decido y sostengo el golpe." },
      { archetype: "sabio_rey", label: "Elijo lo más estable y consistente." },
      { archetype: "amante", label: "Elijo lo que cuide el vínculo." },
      { archetype: "mago", label: "Busco un ángulo distinto antes de decidir." },
    ],
  },
  {
    id: "q9",
    prompt: "En una conversación difícil, yo…",
    options: [
      { archetype: "guerrero", label: "Voy al punto." },
      { archetype: "sabio_rey", label: "Marco el marco: tema, límites y cierre." },
      { archetype: "amante", label: "Busco que el otro no se sienta mal." },
      { archetype: "mago", label: "Hago preguntas para entender motivaciones." },
    ],
  },
  {
    id: "q10",
    prompt: "Cuando estoy cansado, tiendo a…",
    options: [
      { archetype: "guerrero", label: "Forzarme igual." },
      { archetype: "sabio_rey", label: "Recortar y sostener lo esencial." },
      { archetype: "amante", label: "Seguir para no fallar a nadie." },
      { archetype: "mago", label: "Desaparecer mentalmente." },
    ],
  },
  {
    id: "q11",
    prompt: "Mi trampa más limpia suele ser…",
    options: [
      { archetype: "guerrero", label: "Confundir intensidad con avance." },
      { archetype: "sabio_rey", label: "Confundir control con claridad." },
      { archetype: "amante", label: "Confundir paz con evitar." },
      { archetype: "mago", label: "Confundir análisis con verdad." },
    ],
  },
  {
    id: "q12",
    prompt: "Lo que más me cuesta sostener es…",
    options: [
      { archetype: "guerrero", label: "La vulnerabilidad sin actuar." },
      { archetype: "sabio_rey", label: "El caos sin cerrar." },
      { archetype: "amante", label: "La distancia sin perseguir." },
      { archetype: "mago", label: "La acción sin entender todo." },
    ],
  },
];

function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function detectCountry(): string {
  try {
    const lang = navigator.language ?? "";
    const parts = lang.split("-");
    const region = parts[1] ?? "";
    if (region.length === 2) return region.toUpperCase();
  } catch {
    // ignore
  }
  return "US";
}

function scoreFromAnswers(answers: Array<ConziaArchetype | null>) {
  const counts: Record<ConziaArchetype, number> = {
    guerrero: 0,
    sabio_rey: 0,
    amante: 0,
    mago: 0,
  };
  for (const a of answers) {
    if (!a) continue;
    counts[a] += 1;
  }
  return counts;
}

function pickTopTwo(score: Record<ConziaArchetype, number>) {
  const order: ConziaArchetype[] = ["guerrero", "sabio_rey", "amante", "mago"];
  const sorted = [...order].sort((a, b) => score[b] - score[a]);
  return { top1: sorted[0]!, top2: sorted[1]! };
}

export default function RegistroPage() {
  const navigate = useNavigate();
  const { dispatch } = useConzia();

  const [step, setStep] = useState<StepId>("r1");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState("");
  const [tz, setTz] = useState(() => detectTimeZone());
  const [country, setCountry] = useState(() => detectCountry());

  const [temaBase, setTemaBase] = useState<string>(THEMES[0]?.id ?? "");
  const [costoDominante, setCostoDominante] = useState<string>(COSTS[0]?.id ?? "");

  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Array<ConziaArchetype | null>>(() => QUESTIONS.map(() => null));
  const score = useMemo(() => scoreFromAnswers(answers), [answers]);
  const { top1, top2 } = useMemo(() => pickTopTwo(score), [score]);
  const confianza = useMemo(() => Math.max(0, score[top1] - score[top2]), [score, top1, top2]);
  const estilo = useMemo<ConziaDrivingStyle>(() => {
    return ARCHETYPES.find((a) => a.id === top1)?.style ?? "Sobrio";
  }, [top1]);

  const currentQuestion = QUESTIONS[qIdx];
  const canContinueR1 =
    alias.trim().length >= 2 &&
    email.trim().length >= 3 &&
    tz.trim().length >= 3 &&
    country.trim().length >= 2 &&
    password.length >= 6;

  const canContinueR2 = Boolean(temaBase) && Boolean(costoDominante);
  const allAnswered = answers.every(Boolean);

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-14">
      <div className="text-white">
        <div className="text-[26px] font-semibold tracking-tight">Registro</div>
        <div className="mt-2 text-sm text-white/65">Configuración de conducción. Sin adornos.</div>
      </div>

      {step === "r1" ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">R1 · Cuenta</div>
          <div className="mt-2 text-sm text-outer-space/70">
            Email, contraseña, alias y contexto. No se guarda la contraseña en este dispositivo.
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="text-xs font-medium text-outer-space/70">Email</div>
              <Input className="mt-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
            </div>
            <div>
              <div className="text-xs font-medium text-outer-space/70">Contraseña</div>
              <Input
                className="mt-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mínimo 6 caracteres"
                type="password"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-outer-space/70">Nombre / alias</div>
              <Input className="mt-2" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Cómo te llamo aquí" />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="text-xs font-medium text-outer-space/70">Zona horaria</div>
                <Input className="mt-2" value={tz} onChange={(e) => setTz(e.target.value)} placeholder="America/Mexico_City" />
              </div>
              <div>
                <div className="text-xs font-medium text-outer-space/70">País</div>
                <Input className="mt-2" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="MX" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => navigate("/onboarding")} type="button">
              Volver
            </Button>
            <Button variant="primary" disabled={!canContinueR1} onClick={() => setStep("r2")} type="button">
              Continuar
            </Button>
          </div>
        </Card>
      ) : null}

      {step === "r2" ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">R2 · Mapa de fricción</div>
          <div className="mt-2 text-sm text-outer-space/70">Dos decisiones. Rápido.</div>

          <div className="mt-6 space-y-5">
            <div>
              <div className="text-sm font-semibold tracking-tight text-outer-space">Hoy lo que más se me repite es…</div>
              <Select className="mt-2" value={temaBase} onChange={(e) => setTemaBase(e.target.value)}>
                {THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-outer-space">El costo típico de esto es…</div>
              <Select className="mt-2" value={costoDominante} onChange={(e) => setCostoDominante(e.target.value)}>
                {COSTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => setStep("r1")} type="button">
              Atrás
            </Button>
            <Button variant="primary" disabled={!canContinueR2} onClick={() => setStep("r3")} type="button">
              Continuar
            </Button>
          </div>
        </Card>
      ) : null}

      {step === "r3" ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">R3 · Arquetipo operativo</div>
          <div className="mt-2 text-sm text-outer-space/70">
            12 preguntas. 1 respuesta por pregunta. Sin justificar.
          </div>

          <div className="mt-6">
            <div className="text-xs text-outer-space/60">
              Pregunta {qIdx + 1} de {QUESTIONS.length}
            </div>
            <div className="mt-2 text-base font-semibold tracking-tight text-outer-space">{currentQuestion?.prompt}</div>
          </div>

          <div className="mt-5 space-y-2">
            {currentQuestion?.options.map((opt) => {
              const isActive = answers[qIdx] === opt.archetype;
              return (
                <button
                  key={opt.archetype}
                  type="button"
                  onClick={() => {
                    setAnswers((prev) => {
                      const next = [...prev];
                      next[qIdx] = opt.archetype;
                      return next;
                    });
                    const nextIdx = qIdx + 1;
                    if (nextIdx >= QUESTIONS.length) setStep("resumen");
                    else setQIdx(nextIdx);
                  }}
                  className={
                    isActive
                      ? "w-full rounded-2xl bg-mint-cream ring-1 ring-gainsboro/70 px-4 py-4 text-left"
                      : "w-full rounded-2xl bg-white ring-1 ring-gainsboro/70 px-4 py-4 text-left transition hover:bg-mint-cream/50"
                  }
                  aria-pressed={isActive}
                >
                  <div className="text-sm font-semibold tracking-tight text-outer-space">{opt.label}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              variant="quiet"
              onClick={() => {
                if (qIdx <= 0) {
                  setStep("r2");
                  return;
                }
                setQIdx((v) => Math.max(0, v - 1));
              }}
              type="button"
            >
              Atrás
            </Button>
            <Button
              variant="primary"
              disabled={!answers[qIdx]}
              onClick={() => {
                if (qIdx + 1 >= QUESTIONS.length) {
                  setStep("resumen");
                  return;
                }
                setQIdx((v) => Math.min(QUESTIONS.length - 1, v + 1));
              }}
              type="button"
            >
              Siguiente
            </Button>
          </div>
        </Card>
      ) : null}

      {step === "resumen" ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">Resultado</div>
          <div className="mt-2 text-sm text-outer-space/70">UI: no etiqueta. Solo conducción.</div>

          <div className="mt-6 rounded-2xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-5 py-4">
            <div className="text-xs text-morning-blue">Tu estilo de conducción inicial será:</div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-outer-space">{estilo}</div>
            <div className="mt-3 text-xs text-outer-space/60">Confianza: {confianza}</div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => setStep("r3")} type="button">
              Volver
            </Button>
            <Button
              variant="primary"
              disabled={!allAnswered}
              onClick={() => {
                const profile: ConziaProfile = {
                  alias: alias.trim(),
                  email: email.trim(),
                  tz: tz.trim(),
                  country: country.trim().toUpperCase(),
                  tema_base: temaBase,
                  costo_dominante: costoDominante,
                  arquetipo_dominante: top1,
                  arquetipo_secundario: top2,
                  confianza,
                  estilo_conduccion: estilo,
                  registrationDone: true,
                };

                const nowISO = new Date().toISOString();
                const processId = createId("proc");
                dispatch({ type: "set_profile", profile });
                dispatch({
                  type: "add_process",
                  process: {
                    id: processId,
                    tema_activo: temaBase,
                    day_index: 1,
                    status: "open",
                    started_at: nowISO,
                  },
                });
                dispatch({ type: "set_active_process", processId });
                navigate("/sesion", { replace: true });
              }}
              type="button"
            >
              Entrar a Sesión
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
