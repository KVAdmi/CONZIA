import { Mic, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button";
import Textarea from "../components/ui/Textarea";
import { generateReflection } from "../services/ai";
import { useConzia } from "../state/conziaStore";
import type { Entry, Reading } from "../types/models";
import { formatDateLongEsMX, toISODateOnly } from "../utils/dates";
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
    type: "desahogo_libre",
    context: "yo",
    boundary: "respeto",
    reaction: "calle",
    emotionalWeight: 6,
    text: params.text.trim(),
    tags: [],
    silenceMode: true,
  };
}

export default function DescargaPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dispatch } = useConzia();

  const todayISO = useMemo(() => toISODateOnly(new Date()), []);
  const promptParam = searchParams.get("prompt");

  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [savedEntry, setSavedEntry] = useState<Entry | null>(null);
  const [reflection, setReflection] = useState<Reading | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const [voiceBusy, setVoiceBusy] = useState(false);

  useEffect(() => {
    if (!promptParam) return;
    const decoded = (() => {
      try {
        return decodeURIComponent(promptParam);
      } catch {
        return promptParam;
      }
    })();
    if (!decoded.trim()) return;
    if (text.trim()) return;
    setText(`${decoded}\n\n`);
  }, [promptParam, text]);

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

  function save() {
    const clean = text.trim();
    if (clean.length < 3) {
      setStatus("Escribe una línea real antes de guardar.");
      return;
    }
    const entry = buildEntry({ dateISO: todayISO, text: clean });
    dispatch({ type: "add_entry", entry });
    setSavedEntry(entry);
    setReflection(null);
    setStatus("Guardado.");
  }

  async function askReflection() {
    if (!savedEntry || aiBusy) return;
    setAiBusy(true);
    setStatus("Generando reflejo…");
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
    <div className="mx-auto max-w-2xl px-4 pb-14 pt-10">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/sesion")}
          className="inline-flex items-center gap-2 rounded-xl bg-white/55 ring-1 ring-gainsboro/60 px-3 py-2 text-sm text-outer-space/80 backdrop-blur-md transition hover:bg-white/70"
        >
          <X className="h-4 w-4" aria-hidden />
          Cerrar
        </button>
        <div className="text-right">
          <div className="text-xs text-morning-blue">{formatDateLongEsMX(todayISO)}</div>
          <div className="mt-1 text-xs text-outer-space/60">{status ?? "—"}</div>
        </div>
      </div>

        <div className="mt-10">
          <div className="text-xs text-morning-blue">Descarga</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-outer-space font-serif">
          No te corrijas. No te expliques. Escribe.
        </h1>
        <p className="mt-3 text-sm text-outer-space/70">
          La estructura aparece después, si la quieres. Aquí solo sueltas.
        </p>
      </div>

      <div className="mt-6">
        <Textarea
          className="min-h-[320px]"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Qué está pasando dentro de ti. Sin orden. Sin defensa."
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button onClick={simulateVoice} disabled={voiceBusy}>
          <Mic className="h-4 w-4" aria-hidden />
          {voiceBusy ? "…" : "Voz"}
        </Button>
        <Button variant="primary" onClick={save}>
          Guardar
        </Button>
      </div>

      {savedEntry ? (
        <div className="mt-6 rounded-2xl bg-white/65 ring-1 ring-gainsboro/60 px-5 py-5 backdrop-blur-md">
          {!reflection ? (
            <>
              <div className="text-sm font-semibold tracking-tight text-outer-space">Gracias.</div>
              <div className="mt-2 text-sm text-outer-space/75 leading-relaxed">
                Esto no necesita respuesta todavía.
              </div>
              <div className="mt-5 flex flex-col gap-2">
                <Button
                  variant="quiet"
                  onClick={() => navigate(`/escribir?silencio=1&prompt=${encodeURIComponent(savedEntry.text)}`)}
                  disabled={aiBusy}
                >
                  Estructurar (opcional)
                </Button>
                <Button variant="primary" onClick={askReflection} disabled={aiBusy}>
                  <Sparkles className="h-4 w-4" aria-hidden />
                  {aiBusy ? "…" : "Pedir reflejo breve"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-xs text-morning-blue">Reflejo breve</div>
              <div className="mt-2 text-sm font-semibold tracking-tight text-outer-space">
                {reflection.content.contencion}
              </div>
              <div className="mt-4 space-y-3 text-sm text-outer-space/80 leading-relaxed">
                <div>{reflection.content.loQueVeo}</div>
                <div>{reflection.content.loQueEvitas}</div>
                <div className="text-outer-space">{reflection.content.pregunta}</div>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <Button onClick={() => navigate("/sesion")}>Cerrar</Button>
                <Button
                  variant="primary"
                  onClick={() => navigate(`/lecturas?readingId=${encodeURIComponent(reflection.id)}`)}
                >
                  Ver en Lecturas
                </Button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
