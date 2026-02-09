import { ArrowLeft, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Textarea from "../components/ui/Textarea";
import { analyzeDesahogo } from "../services/ai";
import { useConzia } from "../state/conziaStore";
import type { ConziaArchetype, ConziaChallenge, ConziaDesahogoAnalysis } from "../types/models";
import { toISODateOnly } from "../utils/dates";
import { createId } from "../utils/id";
import { useTypewriter } from "../utils/useTypewriter";

const ARCH_LABEL: Record<ConziaArchetype, string> = {
  guerrero: "Guerrero",
  amante: "Amante",
  rey: "Sabio Rey",
  mago: "Mago",
};

function buildChallenge(params: {
  shadowArchetype: ConziaArchetype;
  emotion: ConziaDesahogoAnalysis["emotion"];
  pattern_tag: string;
  phase: 1 | 2 | 3;
}): { card_title: string; challenge_text: string } {
  const { shadowArchetype, phase } = params;
  const prefix = "La Carta del Destino";

  if (phase !== 1) {
    return { card_title: prefix, challenge_text: "Próximamente: retos de diálogo e integración (Mes 2 y 3)." };
  }

  if (shadowArchetype === "guerrero") {
    return {
      card_title: prefix,
      challenge_text:
        "Hoy observa cuántas veces quisiste decir “no” y dijiste “sí”.\n\nNo lo justifiques. Solo anótalo mentalmente.\n\nAl final del día: 1 línea de verdad: ¿qué estabas comprando con ese “sí”?",
    };
  }

  if (shadowArchetype === "amante") {
    return {
      card_title: prefix,
      challenge_text:
        "Hoy observa cuándo te endureces para no sentir.\n\nMarca 3 momentos.\n\nAl final del día: ¿qué emoción evitaste nombrar en voz alta?",
    };
  }

  if (shadowArchetype === "rey") {
    return {
      card_title: prefix,
      challenge_text:
        "Hoy observa dónde intentas ordenar a otros para no tolerar el caos.\n\nNo intervengas. Solo detecta.\n\nAl final del día: ¿qué perderías si sueltas el control un 5%?",
    };
  }

  return {
    card_title: prefix,
    challenge_text:
      "Hoy observa cuántas veces te vas a la cabeza para evitar sentir.\n\nCada vez que pase: regresa al cuerpo con una exhalación larga.\n\nAl final del día: ¿qué emoción estaba debajo del pensamiento?",
  };
}

function latestChallengeForProcess(list: ConziaChallenge[], processId: string): ConziaChallenge | null {
  const filtered = list.filter((c) => c.process_id === processId);
  filtered.sort((a, b) => (a.accepted_at < b.accepted_at ? 1 : -1));
  return filtered[0] ?? null;
}

export default function DesahogoPage() {
  const navigate = useNavigate();
  const { state, dispatch, storageKey } = useConzia();

  const process = useMemo(() => {
    const pick = state.activeProcessId ? state.processes.find((p) => p.id === state.activeProcessId) : undefined;
    return pick ?? state.processes[0] ?? null;
  }, [state.activeProcessId, state.processes]);

  const shadowArchetype = useMemo<ConziaArchetype>(() => {
    const a = state.profile?.shadow_archetype;
    return a ?? "guerrero";
  }, [state.profile?.shadow_archetype]);

  const activeChallenge = useMemo(() => {
    if (!process) return null;
    const latest = latestChallengeForProcess(state.challenges, process.id);
    if (!latest) return null;
    if (latest.status !== "active") return null;
    if (latest.evidence && latest.evidence.trim().length >= 3) return null;
    return latest;
  }, [process, state.challenges]);

  const [evidence, setEvidence] = useState("");
  const [evidenceBusy, setEvidenceBusy] = useState(false);

  const draftKey = useMemo(() => {
    if (!process) return null;
    return `${storageKey}_draft_desahogo_${process.id}`;
  }, [process, storageKey]);

  const draftLoadedRef = useRef<string | null>(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ConziaDesahogoAnalysis | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [challengeRevealed, setChallengeRevealed] = useState(false);
  const [challengeAccepted, setChallengeAccepted] = useState(false);

  useEffect(() => {
    if (!draftKey) return;
    if (draftLoadedRef.current === draftKey) return;
    draftLoadedRef.current = draftKey;

    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const parsedUnknown = JSON.parse(raw) as unknown;
      if (!parsedUnknown || typeof parsedUnknown !== "object") return;
      const parsed = parsedUnknown as Record<string, unknown>;
      const t = parsed.text;
      if (typeof t === "string") setText(t);
    } catch {
      // ignore
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey) return;
    const id = window.setInterval(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ text }));
      } catch {
        // ignore
      }
    }, 2800);
    return () => window.clearInterval(id);
  }, [draftKey, text]);

  function clearDraft() {
    if (!draftKey) return;
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
  }

  async function submitEvidence() {
    if (!activeChallenge || evidenceBusy) return;
    const clean = evidence.trim();
    if (clean.length < 3) {
      setStatus("Dame una línea real. Aunque sea incómoda.");
      return;
    }
    setEvidenceBusy(true);
    try {
      const nowISO = new Date().toISOString();
      dispatch({
        type: "update_challenge",
        challengeId: activeChallenge.id,
        patch: { evidence: clean, status: "completed", closed_at: nowISO },
      });
      setEvidence("");
      setStatus("Listo. Ya podemos entrar.");
    } finally {
      setEvidenceBusy(false);
    }
  }

  async function entregar() {
    if (!process || aiBusy) return;
    const clean = text.trim();
    if (clean.length < 12) {
      setStatus("Dame algo real. Una escena. Una línea.");
      return;
    }

    setAiBusy(true);
    setStatus("Tu analista está trazando el mapa…");
    setAnalysis(null);
    setChallengeRevealed(false);
    setChallengeAccepted(false);

    try {
      const a = await analyzeDesahogo({ text: clean });
      const nowISO = new Date().toISOString();
      dispatch({
        type: "add_entry_v1",
        entry: {
          id: createId("e"),
          process_id: process.id,
          source: "desahogo",
          text: clean,
          analysis: a,
          created_at: nowISO,
        },
      });
      clearDraft();
      setAnalysis(a);
      setStatus(null);
    } finally {
      setAiBusy(false);
    }
  }

  const typed = useTypewriter({
    text: analysis?.reflection ?? "",
    enabled: Boolean(analysis?.reflection),
    speedMs: 14,
    chunkSize: 2,
  });

  const todayKey = useMemo(() => toISODateOnly(new Date()), []);

  const draftChallenge = useMemo(() => {
    if (!analysis) return null;
    return buildChallenge({
      shadowArchetype,
      emotion: analysis.emotion,
      pattern_tag: analysis.pattern_tag,
      phase: 1,
    });
  }, [analysis, shadowArchetype]);

  function aceptarReto() {
    if (!process || !analysis || !draftChallenge) return;
    const now = new Date();
    const nowISO = now.toISOString();
    const dueISO = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    dispatch({
      type: "add_challenge",
      challenge: {
        id: createId("ch"),
        process_id: process.id,
        created_at: nowISO,
        accepted_at: nowISO,
        due_at: dueISO,
        status: "active",
        card_title: draftChallenge.card_title,
        challenge_text: draftChallenge.challenge_text,
        shadow_archetype: shadowArchetype,
        emotion: analysis.emotion,
        pattern_tag: analysis.pattern_tag,
      },
    });

    setChallengeAccepted(true);
    setStatus("Reto activado (24h).");
    window.setTimeout(() => setStatus(null), 1800);
  }

  if (!process) {
    return (
      <div className="min-h-[100svh] px-6 pb-10 pt-12 text-white">
        <div className="text-sm text-white/75">Sin proceso activo.</div>
        <div className="mt-4">
          <Button variant="primary" onClick={() => navigate("/sesion")} type="button">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  if (activeChallenge) {
    return (
      <div className="min-h-[100svh] px-6 pb-10 pt-12">
        <button
          type="button"
          onClick={() => navigate("/sesion")}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/12"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver
        </button>

        <div className="mt-6 rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 pb-6 pt-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)] text-white">
          <div className="text-[11px] tracking-[0.18em] text-white/55">BLOQUEO SUAVE</div>
          <div className="mt-3 text-2xl font-semibold tracking-tight">Antes de seguir</div>
          <div className="mt-3 text-sm text-white/70 leading-relaxed">
            Parece que tu sombra está intentando evitar el cambio. Hablemos de por qué te costó cumplir el reto de ayer
            antes de seguir.
          </div>

          <div className="mt-6 rounded-3xl bg-white/6 ring-1 ring-white/10 px-5 py-5">
            <div className="text-xs tracking-[0.18em] text-white/55">RETO ACTIVO</div>
            <div className="mt-2 text-sm font-semibold">{activeChallenge.card_title}</div>
            <div className="mt-3 text-sm text-white/75 whitespace-pre-line">{activeChallenge.challenge_text}</div>
            <div className="mt-4 text-xs text-white/65">Aceptado: {toISODateOnly(new Date(activeChallenge.accepted_at))}</div>
          </div>

          <div className="mt-6">
            <div className="text-xs tracking-[0.18em] text-white/55">EVIDENCIA / REFLEXIÓN</div>
            <Textarea
              className="mt-3 min-h-[160px] bg-white/8 text-white placeholder:text-white/35 ring-1 ring-white/10"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="¿Cómo te fue con el reto? No te justifiques. Dime la verdad."
            />
            {status ? <div className="mt-3 text-xs text-white/70">{status}</div> : null}
            <div className="mt-5 flex flex-col gap-2">
              <Button variant="primary" onClick={submitEvidence} disabled={evidenceBusy} type="button">
                {evidenceBusy ? "…" : "Entregar evidencia"}
              </Button>
              <Button onClick={() => navigate("/sesion")} type="button">
                Cerrar por hoy
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-12">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/sesion")}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/12"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver
        </button>
        <div className="text-right text-white">
          <div className="text-xs text-white/70">Desahogo</div>
          <div className="mt-1 text-xs text-white/55">{status ?? todayKey}</div>
        </div>
      </div>

      <div className="mt-8 text-white">
        <div className="text-[11px] tracking-[0.18em] text-white/55">ENTREGA</div>
        <div className="mt-3 text-2xl font-semibold tracking-tight">Entrégalo. No lo maquilles.</div>
        <div className="mt-3 text-sm text-white/65">
          Botón principal: <span className="text-white">Entregar a la sombra</span>. Aquí no se “envía”. Aquí se suelta.
        </div>
      </div>

      <div className="mt-7 relative rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 pb-6 pt-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        {aiBusy ? (
          <div className="absolute inset-0 z-20 grid place-items-center rounded-[34px] bg-black/35 backdrop-blur-sm">
            <div className="rounded-3xl bg-white/10 ring-1 ring-white/10 px-5 py-4 text-white">
              <div className="text-xs tracking-[0.18em] text-white/55">ANALIZANDO</div>
              <div className="mt-2 text-sm text-white/75">Tu analista está trazando el mapa de tu inconsciente…</div>
            </div>
          </div>
        ) : null}

        <Textarea
          className="min-h-[240px] bg-white/8 text-white placeholder:text-white/35 ring-1 ring-white/10"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe sin justificar. Si te da vergüenza, vas bien."
        />

        {status ? <div className="mt-3 text-xs text-white/70">{status}</div> : null}

        <div className="mt-5 flex items-center justify-end">
          <button
            type="button"
            onClick={entregar}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7D5C6B] px-5 py-3 text-sm font-semibold tracking-wide text-white ring-1 ring-white/15 shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition hover:bg-[#6f5160] disabled:opacity-60"
            disabled={aiBusy}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Entregar a la sombra
          </button>
        </div>

        {analysis ? (
          <div className="mt-6 rounded-3xl bg-white/6 ring-1 ring-white/10 px-5 py-5 text-white">
            <div className="text-[11px] tracking-[0.18em] text-white/55">REFLEJO</div>
            <div className="mt-3 text-sm font-semibold tracking-tight whitespace-pre-line">{typed.out}</div>
            {analysis.question ? (
              <div className="mt-4 text-sm text-white/80">
                <span className="text-white font-semibold">Pregunta:</span> {analysis.question}
              </div>
            ) : null}

            {analysis.risk_flag === "crisis" ? (
              <div className="mt-5 rounded-2xl bg-white/10 ring-1 ring-white/10 px-4 py-4">
                <div className="text-sm font-semibold">Primero: contención.</div>
                <div className="mt-2 text-sm text-white/75">
                  Si estás en riesgo o te sientes fuera de control, entra a Sala ahora.
                </div>
                <div className="mt-4">
                  <Button variant="primary" onClick={() => navigate("/crisis")} type="button">
                    IR A SALA (CRISIS)
                  </Button>
                </div>
              </div>
            ) : null}

            {draftChallenge ? (
              <div className="mt-6">
                <div className="text-[11px] tracking-[0.18em] text-white/55">RETO 24H</div>
                <div
                  className={
                    challengeRevealed
                      ? "mt-3 rounded-3xl bg-[#0b1220]/55 ring-1 ring-white/10 px-5 py-5"
                      : "mt-3 rounded-3xl bg-[#0b1220]/55 ring-1 ring-white/10 px-5 py-5 cursor-pointer hover:bg-[#0b1220]/60 transition"
                  }
                  role="button"
                  tabIndex={0}
                  onClick={() => setChallengeRevealed(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setChallengeRevealed(true);
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">{draftChallenge.card_title}</div>
                      <div className="mt-1 text-xs text-white/60">Arquetipo en sombra: {ARCH_LABEL[shadowArchetype]}</div>
                    </div>
                    <div className="text-xs text-white/55">{challengeRevealed ? "Revelado" : "Toca para revelar"}</div>
                  </div>
                  {challengeRevealed ? (
                    <div className="mt-4 text-sm text-white/80 whitespace-pre-line">{draftChallenge.challenge_text}</div>
                  ) : (
                    <div className="mt-4 text-sm text-white/70">
                      No lo leas como motivación. Léelo como diagnóstico.
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    variant="primary"
                    disabled={!challengeRevealed || challengeAccepted}
                    onClick={aceptarReto}
                    type="button"
                  >
                    {challengeAccepted ? "Reto aceptado" : "ACEPTO EL RETO"}
                  </Button>
                  <Button onClick={() => navigate("/sesion")} type="button">
                    Volver al inicio
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

