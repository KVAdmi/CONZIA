import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Collapsible from "../components/ui/Collapsible";
import GlassSheet from "../components/ui/GlassSheet";
import Select from "../components/ui/Select";
import Toggle from "../components/ui/Toggle";
import { UNCOMFORTABLE_TRUTHS } from "../content/truths";
import { useSubscription } from "../state/subscriptionStore";
import { useXmi } from "../state/xmiStore";
import type { Entry, EntryType, Pattern, Reading } from "../types/models";
import { formatDateLongEsMX, parseISODate, toISODateOnly } from "../utils/dates";

function titleForEntryType(t: EntryType): string {
  switch (t) {
    case "desahogo_libre":
      return "Desahogo libre";
    case "algo_me_incomodo":
      return "Algo me incomodó";
    case "queria_hacer_algo_distinto":
      return "Quería hacer algo distinto";
    case "hoy_si_lo_hice":
      return "Hoy sí lo hice";
    case "no_quise_ver_esto":
      return "No quise ver esto";
    default:
      return t;
  }
}

function entryToPatternIds(entryId: string, patterns: Pattern[]): string[] {
  return patterns.filter((p) => p.evidenceEntryIds.includes(entryId)).map((p) => p.id);
}

function computeSilenceMarkers(entries: Entry[]): Array<{ kind: "silence"; from: string; to: string; days: number }> {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1));
  const markers: Array<{ kind: "silence"; from: string; to: string; days: number }> = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = parseISODate(sorted[i - 1]!.date);
    const cur = parseISODate(sorted[i]!.date);
    const days = Math.round((cur.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
    if (days >= 4) {
      markers.push({
        kind: "silence",
        from: sorted[i - 1]!.date,
        to: sorted[i]!.date,
        days,
      });
    }
  }
  return markers;
}

function getReadingMotiveFlag(): boolean {
  try {
    return localStorage.getItem("concia_v1_motivo_lectura") === "1";
  } catch {
    return false;
  }
}

export default function LecturasPage() {
  const { state, dispatch } = useXmi();
  const sub = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const highlightReadingId = searchParams.get("readingId");
  const todayISO = toISODateOnly(new Date());
  const locked = !sub.derived.hasSystem;

  const readingOfDay = useMemo<Reading | undefined>(() => {
    const today = state.readings.find((r) => r.type === "lectura_del_dia" && r.date === todayISO);
    if (today) return today;
    const anyLectura = state.readings.find((r) => r.type === "lectura_del_dia");
    if (anyLectura) return anyLectura;
    return [...state.readings].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  }, [state.readings, todayISO]);

  const readingTitle = useMemo(() => {
    if (!readingOfDay) return "Lecturas";
    if (readingOfDay.type === "test") return "Lectura del test";
    if (readingOfDay.type === "semanal") return "Lectura semanal";
    if (readingOfDay.type === "reflejo") return "Reflejo";
    return "Lectura del día";
  }, [readingOfDay]);

  const labels = useMemo(() => {
    const isTest = readingOfDay?.type === "test";
    const isReflection = readingOfDay?.type === "reflejo";
    return {
      contencion: isTest ? "Esto sugiere" : isReflection ? "Reflejo" : "Contención",
      loQueVeo: isTest ? "Base" : isReflection ? "Lo que se nota" : "Lo que veo",
      loQueEvitas: isTest ? "Lo que evitas" : isReflection ? "Lo que está debajo" : "Lo que estás evitando",
    };
  }, [readingOfDay?.type]);

  const highlightedReading = useMemo(() => {
    if (!highlightReadingId) return undefined;
    return state.readings.find((r) => r.id === highlightReadingId);
  }, [highlightReadingId, state.readings]);

  const motive = Boolean(highlightReadingId) || getReadingMotiveFlag();

  const allPatterns = useMemo(() => [...state.patterns].sort((a, b) => a.name.localeCompare(b.name)), [state.patterns]);

  const [filterType, setFilterType] = useState<EntryType | "todas">("todas");
  const [filterPattern, setFilterPattern] = useState<string>("todas");
  const [onlyPeaks, setOnlyPeaks] = useState(false);
  const [showSilences, setShowSilences] = useState(true);
  const [openEntry, setOpenEntry] = useState<Entry | null>(null);

  const silences = useMemo(() => computeSilenceMarkers(state.entries), [state.entries]);

  const timelineEntries = useMemo(() => {
    const base = [...state.entries].sort((a, b) => (a.date < b.date ? 1 : -1));
    return base.filter((e) => {
      if (filterType !== "todas" && e.type !== filterType) return false;
      if (onlyPeaks && e.emotionalWeight < 8) return false;
      if (filterPattern !== "todas") {
        const pids = entryToPatternIds(e.id, state.patterns);
        if (!pids.includes(filterPattern)) return false;
      }
      return true;
    });
  }, [filterPattern, filterType, onlyPeaks, state.entries, state.patterns]);

  const readingsLibrary = useMemo(() => {
    return [...state.readings]
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 8);
  }, [state.readings]);

  return (
    <>
      <div className="min-h-[100svh] px-6 pb-10 pt-14 space-y-4">
        {locked ? (
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">Lecturas (modo básico)</h2>
                <p className="mt-1 text-sm text-outer-space/70">
                  En modo básico no generamos lecturas ni Caja. Aquí validamos formato y ritual.
                </p>
              </div>
              <Button variant="primary" onClick={() => navigate("/planes")}>
                Ver planes
              </Button>
            </div>
          </Card>
        ) : null}

        {!motive ? (
          <Card className="p-10">
            <h2 className="text-sm font-semibold tracking-tight">Lecturas</h2>
            <p className="mt-2 text-sm text-outer-space/70">
              Aún no hay evidencia suficiente para decirte algo con honestidad.
            </p>
            <div className="mt-6 flex items-center justify-end">
              <Button variant="primary" onClick={() => navigate("/descarga")}>
                Escribir
              </Button>
            </div>
          </Card>
        ) : (
	          <Card className="p-6">
	            <div className="flex items-start justify-between gap-4">
	              <div>
	                <h2 className="text-sm font-semibold tracking-tight">{readingTitle}</h2>
	                <p className="mt-1 text-sm text-outer-space/70">
	                  Formato fijo. Evidencia primero. Sin frases genéricas.
	                </p>
	              </div>
              {readingOfDay?.patternId ? (
                <Button disabled={locked} onClick={() => navigate(`/caja?patternId=${readingOfDay.patternId}`)}>
                  Caja
                </Button>
              ) : null}
            </div>

            {readingOfDay ? (
              <div className="mt-5 rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-5 py-5">
                <div className="text-xs text-morning-blue">{formatDateLongEsMX(readingOfDay.date)}</div>
                {readingOfDay.basedOnEntryIds?.length ? (
                  <div className="mt-2 text-xs text-outer-space/60">
                    Basado en: {readingOfDay.basedOnEntryIds.join(" · ")}
                  </div>
                ) : null}
	                <div className="mt-3 space-y-4">
	                  <div>
	                    <div className="text-xs font-medium text-outer-space/70">{labels.contencion}</div>
	                    <div className="mt-1 text-sm text-outer-space/85">{readingOfDay.content.contencion}</div>
	                  </div>
	                  <div>
	                    <div className="text-xs font-medium text-outer-space/70">{labels.loQueVeo}</div>
	                    <div className="mt-1 text-sm text-outer-space/85">{readingOfDay.content.loQueVeo}</div>
	                  </div>
	                  {readingOfDay.content.patron ? (
	                    <div>
	                      <div className="text-xs font-medium text-outer-space/70">Patrón</div>
	                      <div className="mt-1 text-sm text-outer-space/85">{readingOfDay.content.patron}</div>
	                    </div>
	                  ) : null}
	                  <div>
	                    <div className="text-xs font-medium text-outer-space/70">{labels.loQueEvitas}</div>
	                    <div className="mt-1 text-sm text-outer-space/85">{readingOfDay.content.loQueEvitas}</div>
	                  </div>
                  <div>
                    <div className="text-xs font-medium text-outer-space/70">Pregunta</div>
                    <div className="mt-1 text-sm text-outer-space/85">{readingOfDay.content.pregunta}</div>
                  </div>
                  {readingOfDay.content.accionMinima ? (
                    <div>
                      <div className="text-xs font-medium text-outer-space/70">Acción mínima</div>
                      <div className="mt-1 text-sm text-outer-space/85">{readingOfDay.content.accionMinima}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-outer-space/70">Sin lecturas aún.</div>
            )}

            {highlightedReading && highlightedReading.id !== readingOfDay?.id ? (
              <div className="mt-4 rounded-xl bg-white ring-1 ring-gainsboro/70 px-5 py-4">
                <div className="text-xs text-morning-blue">Lectura recién generada</div>
                <div className="mt-1 text-sm font-semibold tracking-tight text-outer-space">
                  {highlightedReading.content.contencion}
                </div>
                <div className="mt-2 text-sm text-outer-space/75">{highlightedReading.content.loQueVeo}</div>
              </div>
            ) : null}
          </Card>
        )}

        <Collapsible
          title="Verdades incómodas"
          description="No son motivación. Son espejo."
          defaultOpen={false}
        >
          <div className="grid gap-3">
            {UNCOMFORTABLE_TRUTHS.map((t) => {
              const feedback = state.truthFeedback[t.id];
              return (
                <div key={t.id} className="rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4">
                  <div className="text-sm text-outer-space/85">{t.text}</div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant={feedback === "me_sirve" ? "primary" : "secondary"}
                      disabled={locked}
                      onClick={() => dispatch({ type: "set_truth_feedback", truthId: t.id, feedback: "me_sirve" })}
                    >
                      Me sirve
                    </Button>
                    <Button
                      size="sm"
                      variant={feedback === "no_me_sirve" ? "primary" : "secondary"}
                      disabled={locked}
                      onClick={() => dispatch({ type: "set_truth_feedback", truthId: t.id, feedback: "no_me_sirve" })}
                    >
                      No me sirve
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Collapsible>

        <Collapsible
          title="Narrativa personal"
          description="Cronología filtrable por capa, patrón, picos y silencios."
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 gap-3">
            <div>
              <div className="text-xs font-medium text-outer-space/80">Capa</div>
              <Select className="mt-2" value={filterType} onChange={(e) => setFilterType(e.target.value as EntryType | "todas")}>
                <option value="todas">Todas</option>
                <option value="desahogo_libre">Desahogo libre</option>
                <option value="algo_me_incomodo">Algo me incomodó</option>
                <option value="queria_hacer_algo_distinto">Quería hacer algo distinto</option>
                <option value="hoy_si_lo_hice">Hoy sí lo hice</option>
                <option value="no_quise_ver_esto">No quise ver esto</option>
              </Select>
            </div>
            <div>
              <div className="text-xs font-medium text-outer-space/80">Patrón</div>
              <Select className="mt-2" value={filterPattern} onChange={(e) => setFilterPattern(e.target.value)}>
                <option value="todas">Todos</option>
                {allPatterns.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3">
            <Toggle
              checked={onlyPeaks}
              onChange={setOnlyPeaks}
              label="Picos de densidad"
              description="Solo peso ≥ 8."
            />
            <Toggle
              checked={showSilences}
              onChange={setShowSilences}
              label="Silencios"
              description="Gaps de 4+ días."
            />
          </div>

          <div className="mt-4 space-y-3">
            {showSilences && silences.length ? (
              <div className="rounded-xl bg-white ring-1 ring-gainsboro/70 px-4 py-4">
                <div className="text-xs text-morning-blue">Silencios detectados</div>
                <div className="mt-2 space-y-2">
                  {silences.slice(0, 3).map((s) => (
                    <div key={`${s.from}-${s.to}`} className="text-sm text-outer-space/75">
                      {s.days} días entre {s.from} → {s.to}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {timelineEntries.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setOpenEntry(e)}
                className="w-full rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4 text-left transition hover:bg-mint-cream"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm font-semibold tracking-tight text-outer-space">{titleForEntryType(e.type)}</div>
                  <div className="text-xs text-outer-space/60">{e.date}</div>
                </div>
                <div className="mt-2 text-sm text-outer-space/75 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                  {e.text}
                </div>
                <div className="mt-3 text-xs text-outer-space/60">peso {e.emotionalWeight}</div>
              </button>
            ))}
          </div>
        </Collapsible>

        <Collapsible
          title="Biblioteca"
          description="Lecturas recientes. No todo merece respuesta inmediata."
          defaultOpen={false}
        >
          <div className="space-y-3">
            {readingsLibrary.map((r) => (
              <div key={r.id} className="rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-medium text-outer-space">{r.type.replaceAll("_", " ")}</div>
                  <div className="text-xs text-outer-space/60">{r.date}</div>
                </div>
                <div className="mt-1 text-sm text-outer-space/75">{r.content.contencion}</div>
                {r.patternId ? (
                  <div className="mt-3">
                    <Button size="sm" disabled={locked} onClick={() => navigate(`/caja?patternId=${r.patternId}`)}>
                      Caja
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button onClick={() => navigate("/tests")}>Tests</Button>
            </div>
          </div>
        </Collapsible>
      </div>

      <GlassSheet
        open={openEntry !== null}
        title={openEntry ? titleForEntryType(openEntry.type) : "Entrada"}
        description={openEntry ? formatDateLongEsMX(openEntry.date) : undefined}
        onClose={() => setOpenEntry(null)}
      >
        {openEntry ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-mint-cream/70 px-4 py-3 ring-1 ring-gainsboro/60">
              <div className="text-xs text-morning-blue">Hecho</div>
              <div className="mt-1 text-sm text-outer-space/85">{openEntry.text}</div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-gainsboro/70">
                <div className="text-xs text-morning-blue">Contexto</div>
                <div className="mt-1 text-sm text-outer-space/85">{openEntry.context}</div>
              </div>
              <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-gainsboro/70">
                <div className="text-xs text-morning-blue">Límite</div>
                <div className="mt-1 text-sm text-outer-space/85">{openEntry.boundary}</div>
              </div>
              <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-gainsboro/70">
                <div className="text-xs text-morning-blue">Reacción</div>
                <div className="mt-1 text-sm text-outer-space/85">{openEntry.reaction}</div>
              </div>
              <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-gainsboro/70">
                <div className="text-xs text-morning-blue">Peso</div>
                <div className="mt-1 text-sm text-outer-space/85">{openEntry.emotionalWeight}</div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button onClick={() => navigate(`/caja?entryId=${openEntry.id}`)}>Caja</Button>
              <Button variant="primary" onClick={() => setOpenEntry(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : null}
      </GlassSheet>
    </>
  );
}
