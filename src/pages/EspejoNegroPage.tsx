import { Mic, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Textarea from "../components/ui/Textarea";
import { generateReflection } from "../services/ai";
import { useXmi } from "../state/xmiStore";
import type { Entry, Reading } from "../types/models";
import { toISODateOnly } from "../utils/dates";
import { createId } from "../utils/id";

const VOICE_SAMPLES: string[] = [
  "No quiero hablar con nadie, pero no quiero estar solo. Me enojo por cosas pequeñas y luego me da culpa.",
  "Hoy dije que sí sin pensarlo. No era lo que quería. Me estoy cansando de mí.",
  "Estoy bien… pero no estoy bien. Y me da vergüenza decirlo así.",
  "Quise poner un límite y se me cerró el cuerpo. Lo dejé pasar. Otra vez.",
];

function buildEntry(params: { dateISO: string; text: string }): Entry {
  return {
    id: createId("e"),
    date: params.dateISO,
    type: "algo_me_incomodo",
    context: "yo",
    boundary: "respeto",
    reaction: "calle",
    emotionalWeight: 6,
    text: params.text.trim(),
    tags: [],
    silenceMode: false,
  };
}

export default function EspejoNegroPage() {
  const navigate = useNavigate();
  const { dispatch } = useXmi();
  const todayISO = useMemo(() => toISODateOnly(new Date()), []);

  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [savedEntry, setSavedEntry] = useState<Entry | null>(null);
  const [reflection, setReflection] = useState<Reading | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);

  useEffect(() => {
    if (!status) return;
    const t = window.setTimeout(() => setStatus(null), 2400);
    return () => window.clearTimeout(t);
  }, [status]);

  function simulateVoice() {
    if (voiceBusy) return;
    setVoiceBusy(true);
    const sample = VOICE_SAMPLES[Math.floor(Math.random() * VOICE_SAMPLES.length)]!;
    window.setTimeout(() => {
      setText((prev) => (prev.trim() ? prev : sample));
      setVoiceBusy(false);
      setStatus("Transcripción simulada lista.");
    }, 650);
  }

  function save(params?: { silence?: boolean }) {
    const clean = text.trim();
    if (clean.length < 3) {
      setStatus("Di una línea real antes de guardar.");
      return;
    }
    const entry = buildEntry({ dateISO: todayISO, text: clean });
    if (params?.silence) entry.silenceMode = true;
    dispatch({ type: "add_entry", entry });
    setSavedEntry(entry);
    setReflection(null);
    setStatus("Guardado.");
  }

  async function askReflection() {
    if (!savedEntry || aiBusy) return;
    setAiBusy(true);
    setStatus("Generando espejo…");
    try {
      const reading = await generateReflection({ entry: savedEntry, todayISO });
      dispatch({ type: "add_reading", reading });
      setReflection(reading);
      setStatus(null);
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-12">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/sesion")}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/12"
        >
          <X className="h-4 w-4" aria-hidden />
          Cerrar
        </button>
        <div className="text-right">
          <div className="text-xs text-white/70">Espejo Negro</div>
          <div className="mt-1 text-xs text-white/55">{status ?? "—"}</div>
        </div>
      </div>

      <div className="mt-10 text-white">
        <div className="text-[11px] tracking-[0.18em] text-white/55">PROMPT</div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Háblame de la última vez que cediste.</h1>
        <p className="mt-3 text-sm text-white/65">
          No lo ordenes. No lo expliques. Si no quieres lectura, guárdalo en silencio.
        </p>
      </div>

      <div className="mt-7 rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 pb-6 pt-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={simulateVoice}
            disabled={voiceBusy}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/12 disabled:opacity-60"
          >
            <Mic className="h-4 w-4" aria-hidden />
            {voiceBusy ? "…" : "Grabar (mock)"}
          </button>
          <button
            type="button"
            onClick={() => save({ silence: true })}
            className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/12"
          >
            Guardar en silencio
          </button>
        </div>

        <div className="mt-4">
          <Textarea
            className="min-h-[220px] bg-white/8 text-white placeholder:text-white/40 ring-1 ring-white/10"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Transcripción (o texto)."
          />
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => save()}
            className="rounded-2xl bg-[#7D5C6B] px-5 py-3 text-sm font-semibold tracking-wide text-white ring-1 ring-white/15 shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition hover:bg-[#6f5160] active:scale-[0.99]"
          >
            Guardar
          </button>
        </div>

        {savedEntry ? (
          <div className="mt-6 rounded-3xl bg-white/6 ring-1 ring-white/10 px-5 py-5">
            {!reflection ? (
              <>
                <div className="text-sm font-semibold text-white">Gracias.</div>
                <div className="mt-2 text-sm text-white/70">Esto no necesita respuesta todavía.</div>
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/escribir?silencio=1&prompt=${encodeURIComponent(savedEntry.text)}`)}
                    className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/12"
                    disabled={aiBusy}
                  >
                    Estructurar (opcional)
                  </button>
                  <button
                    type="button"
                    onClick={askReflection}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7D5C6B] px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-[#6f5160] disabled:opacity-60"
                    disabled={aiBusy}
                  >
                    <Sparkles className="h-4 w-4" aria-hidden />
                    {aiBusy ? "…" : "Pedir espejo breve"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-[11px] tracking-[0.18em] text-white/55">ESPEJO</div>
                <div className="mt-3 text-sm font-semibold tracking-tight text-white">
                  {reflection.content.contencion}
                </div>
                <div className="mt-4 space-y-3 text-sm text-white/75 leading-relaxed">
                  <div>{reflection.content.loQueVeo}</div>
                  <div>{reflection.content.loQueEvitas}</div>
                  <div className="text-white">{reflection.content.pregunta}</div>
                </div>
                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/sesion")}
                    className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/12"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/lecturas?readingId=${encodeURIComponent(reflection.id)}`)}
                    className="rounded-2xl bg-[#7D5C6B] px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-[#6f5160]"
                  >
                    Ver en Lecturas
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
