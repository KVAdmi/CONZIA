import { Lock, Mic, Sparkles, Tags } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Collapsible from "../components/ui/Collapsible";
import { FieldHint, FieldLabel } from "../components/ui/Field";
import Input from "../components/ui/Input";
import GlassSheet from "../components/ui/GlassSheet";
import Range from "../components/ui/Range";
import Select from "../components/ui/Select";
import Sheet from "../components/ui/Sheet";
import Textarea from "../components/ui/Textarea";
import Toggle from "../components/ui/Toggle";
import { generateReading } from "../services/ai";
import { useSubscription } from "../state/subscriptionStore";
import { useXmi } from "../state/xmiStore";
import type {
  Entry,
  EntryBoundary,
  EntryContext,
  EntryReaction,
  EntryType,
  RepeatSignal,
  VaultNote,
} from "../types/models";
import { formatDateLongEsMX, toISODateOnly } from "../utils/dates";
import { createId } from "../utils/id";

const LAYERS: Array<{ type: EntryType; label: string; hint: string; placeholder: string }> = [
  {
    type: "desahogo_libre",
    label: "Desahogo libre",
    hint: "Lo que salga. Sin explicar.",
    placeholder: "Qué traes encima hoy. Una línea honesta basta.",
  },
  {
    type: "algo_me_incomodo",
    label: "Algo me incomodó",
    hint: "Evidencia + reacción. Sin maquillar.",
    placeholder: "Qué pasó. Qué se dijo. Qué hiciste. Sin justificar.",
  },
  {
    type: "queria_hacer_algo_distinto",
    label: "Quería hacer algo distinto",
    hint: "Intención vs realidad (sin drama).",
    placeholder: "Qué querías hacer distinto. Qué hiciste. Qué lo bloqueó (si aplica).",
  },
  {
    type: "hoy_si_lo_hice",
    label: "Hoy sí lo hice",
    hint: "Hecho. Sin aplauso.",
    placeholder: "Qué hiciste distinto. Qué costó. Qué cambió en ti.",
  },
  {
    type: "no_quise_ver_esto",
    label: "No quise ver esto",
    hint: "Una línea sin justificar.",
    placeholder: "Lo que evitaste nombrar. Sin “porque”.",
  },
];

const CONTEXTS: EntryContext[] = ["familia", "trabajo", "pareja", "social", "yo"];
const BOUNDARIES: EntryBoundary[] = ["tiempo", "respeto", "cuerpo", "dinero", "decision", "intimidad"];
const REACTIONS: EntryReaction[] = ["cedi", "calle", "explote", "hui", "negocie", "pedi", "puse_limite"];

const VOICE_SAMPLES: string[] = [
  "Me pidieron algo “rápido” y dije que sí automático. No era urgente. Me pesó todo el día.",
  "Me callé para no hacer olas, pero me quedé rumiando. No fue paz. Fue evitación.",
  "Quise pedir lo que necesito y me dio vergüenza. Lo convertí en chiste. Luego me odié por eso.",
  "Hoy pude decir no. Fue incómodo. No pasó nada grave. Yo sí lo sentí grave.",
];

function humanizeReaction(r: EntryReaction): string {
  switch (r) {
    case "cedi":
      return "Cedí";
    case "calle":
      return "Callé";
    case "explote":
      return "Exploté";
    case "hui":
      return "Huí";
    case "negocie":
      return "Negocié";
    case "pedi":
      return "Pedí";
    case "puse_limite":
      return "Puse límite";
    default:
      return r;
  }
}

function humanizeRepeatSignal(v: RepeatSignal): string {
  if (v === "no") return "No";
  if (v === "creo_que_si") return "Creo que sí";
  return "Sí";
}

function buildEntryText(params: {
  primaryText: string;
  structureEnabled: boolean;
  factText: string;
  storyText: string;
}): string {
  const blocks: string[] = [];
  const base = params.primaryText.trim();
  if (base) blocks.push(base);

  if (params.structureEnabled) {
    const fact = params.factText.trim();
    const story = params.storyText.trim();
    if (fact) blocks.push(`Hecho:\n${fact}`);
    if (story) blocks.push(`Historia:\n${story}`);
  }

  return blocks.join("\n\n").trim();
}

export default function EscribirPage() {
  const { state, dispatch } = useXmi();
  const sub = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const todayISO = toISODateOnly(new Date());

  const silencioParam = searchParams.get("silencio") === "1";
  const layerParam = searchParams.get("layer");
  const promptParam = searchParams.get("prompt");
  const practiceParam = searchParams.get("practiceId");

  const defaultLayer = useMemo<EntryType>(() => {
    const fromParam =
      layerParam && LAYERS.some((l) => l.type === layerParam) ? (layerParam as EntryType) : undefined;
    const fromCheckIn = state.checkIns.find((c) => c.date === todayISO)?.honestyLayer;
    return fromParam ?? fromCheckIn ?? "algo_me_incomodo";
  }, [layerParam, state.checkIns, todayISO]);

  const [layer, setLayer] = useState<EntryType>(defaultLayer);
  const [primaryText, setPrimaryText] = useState("");

  const [structureEnabled, setStructureEnabled] = useState(false);
  const [factText, setFactText] = useState("");
  const [storyText, setStoryText] = useState("");

  const [context, setContext] = useState<EntryContext>("yo");
  const [boundary, setBoundary] = useState<EntryBoundary>("respeto");
  const [reaction, setReaction] = useState<EntryReaction>("calle");
  const [repeatSignal, setRepeatSignal] = useState<RepeatSignal>("no");
  const [emotionalWeight, setEmotionalWeight] = useState(6);

  const [tags, setTags] = useState<string[]>([]);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [showAllTagOptions, setShowAllTagOptions] = useState(false);

  const [silenceMode, setSilenceMode] = useState<boolean>(silencioParam);
  const [status, setStatus] = useState<string | null>(null);

  const [voiceBusy, setVoiceBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  const [vaultOpen, setVaultOpen] = useState(false);
  const [vaultTitle, setVaultTitle] = useState("");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [layerPickerOpen, setLayerPickerOpen] = useState(false);

  const recentEntriesOpenDefault = false;

  useEffect(() => {
    if (silencioParam) setSilenceMode(true);
  }, [silencioParam]);

  useEffect(() => {
    if (!layerParam) return;
    const match = LAYERS.find((l) => l.type === layerParam);
    if (!match) return;
    setLayer(match.type);
  }, [layerParam]);

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
    if (primaryText.trim()) return;
    setPrimaryText(`${decoded}\n\n`);
  }, [primaryText, promptParam]);

  useEffect(() => {
    if (!status) return;
    const t = window.setTimeout(() => setStatus(null), 2200);
    return () => window.clearTimeout(t);
  }, [status]);

  useEffect(() => {
    setShowAllTagOptions(false);
  }, [tagSearch]);

  const tagOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of state.entries) {
      for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t);
  }, [state.entries]);

  const filteredTags = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    if (!q) return tagOptions.slice(0, 30);
    return tagOptions.filter((t) => t.toLowerCase().includes(q)).slice(0, 60);
  }, [tagOptions, tagSearch]);

  function toggleTag(tag: string) {
    const clean = tag.trim().toLowerCase();
    if (!clean) return;
    setTags((prev) => {
      if (prev.includes(clean)) return prev.filter((t) => t !== clean);
      if (prev.length >= 3) return prev;
      return [...prev, clean];
    });
  }

  function simulateVoice() {
    if (voiceBusy) return;
    setVoiceBusy(true);
    const sample = VOICE_SAMPLES[Math.floor(Math.random() * VOICE_SAMPLES.length)]!;
    window.setTimeout(() => {
      setPrimaryText((prev) => (prev.trim() ? prev : sample));
      setVoiceBusy(false);
      setStatus("Transcripción simulada lista.");
    }, 700);
  }

  function buildEntry(): Entry {
    const baseTags = new Set<string>(tags.map((t) => t.toLowerCase()));
    if (layer === "no_quise_ver_esto") baseTags.add("punto ciego");
    if (layer === "algo_me_incomodo") baseTags.add("evidencia");

    const text = buildEntryText({ primaryText, structureEnabled, factText, storyText });

    return {
      id: createId("e"),
      date: todayISO,
      type: layer,
      context,
      boundary,
      reaction,
      emotionalWeight,
      text,
      tags: [...baseTags].slice(0, 10),
      repeatSignal,
      silenceMode,
      practiceId: practiceParam?.trim() ? practiceParam.trim() : undefined,
    };
  }

  async function saveEntry(params: { askReading: boolean }) {
    const text = buildEntryText({ primaryText, structureEnabled, factText, storyText });
    if (text.length < 3) {
      setStatus("Escribe algo concreto antes de guardar.");
      return;
    }

    const entry = buildEntry();
    dispatch({ type: "add_entry", entry });

    if (params.askReading) {
      if (!sub.derived.hasSystem) {
        setPaywallOpen(true);
        return;
      }
      if (silenceMode) {
        setStatus("Guardado en silencio.");
        clearDraft();
        return;
      }

      setAiBusy(true);
      setStatus("Generando lectura…");
      try {
        const reading = await generateReading({
          entry,
          patterns: state.patterns,
          entries: [entry, ...state.entries],
          todayISO,
        });
        dispatch({ type: "add_reading", reading });
        clearDraft();
        navigate(`/lecturas?readingId=${encodeURIComponent(reading.id)}`);
      } finally {
        setAiBusy(false);
      }
      return;
    }

    setStatus(silenceMode ? "Guardado en silencio." : "Guardado.");
    clearDraft();
  }

  function clearDraft() {
    setPrimaryText("");
    setFactText("");
    setStoryText("");
    setTags([]);
    setTagSearch("");
  }

  function sealToVault() {
    const text = buildEntryText({ primaryText, structureEnabled, factText, storyText });
    if (text.length < 3) {
      setStatus("Escribe algo concreto antes de sellar.");
      return;
    }
    const vaultNote: VaultNote = {
      id: createId("v"),
      date: todayISO,
      title: vaultTitle.trim() ? vaultTitle.trim() : undefined,
      content: text,
      sealed: true,
    };
    dispatch({ type: "add_vault_note", vaultNote });
    setVaultOpen(false);
    setVaultTitle("");
    clearDraft();
    setStatus("Sellado en Bóveda.");
    navigate("/boveda");
  }

  const recentEntries = useMemo(() => {
    return [...state.entries]
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 8);
  }, [state.entries]);

  const layerMeta = useMemo(() => LAYERS.find((l) => l.type === layer), [layer]);

  return (
    <>
      <div className="mx-auto max-w-2xl space-y-4">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Escribir</h2>
              <p className="mt-1 text-sm text-outer-space/70">
                {formatDateLongEsMX(todayISO)} · Primero humano. Luego estructura.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-morning-blue">Estado</div>
              <div className="mt-1 text-xs text-outer-space/60">{status ?? "—"}</div>
            </div>
          </div>

          <div className="mt-5">
            <FieldLabel>Qué pasó / qué traes encima</FieldLabel>
            <Textarea
              className="mt-2 min-h-[220px]"
              value={primaryText}
              onChange={(e) => setPrimaryText(e.target.value)}
              placeholder={layerMeta?.placeholder}
              disabled={aiBusy}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setLayerPickerOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white/70 ring-1 ring-gainsboro/60 px-3 py-2 text-sm text-outer-space/80 backdrop-blur-md transition hover:bg-white/85"
                aria-label="Cambiar capa"
              >
                <span className="text-outer-space/60">Capa:</span> {layerMeta?.label ?? "—"}
              </button>
              <Button onClick={simulateVoice} disabled={voiceBusy || aiBusy} className="shrink-0">
                <Mic className="h-4 w-4" aria-hidden />
                {voiceBusy ? "…" : "Voz"}
              </Button>
            </div>
            <div className="mt-2 text-xs text-outer-space/60">{layerMeta?.hint}</div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3">
            <Toggle
              checked={structureEnabled}
              onChange={setStructureEnabled}
              label="Estructurar"
              description="Abre campos. Cierra ruido."
            />
            <Toggle
              checked={silenceMode}
              onChange={setSilenceMode}
              label="Modo silencio"
              description="Guarda sin lectura inmediata."
            />
          </div>

          {structureEnabled ? (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <FieldLabel>Hecho (observable)</FieldLabel>
                  <Textarea
                    className="mt-2 min-h-[120px]"
                    value={factText}
                    onChange={(e) => setFactText(e.target.value)}
                    placeholder="Qué pasó. Sin interpretación."
                    disabled={aiBusy}
                  />
                </div>
                <div>
                  <FieldLabel>Historia (interpretación)</FieldLabel>
                  <Textarea
                    className="mt-2 min-h-[120px]"
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    placeholder="Qué te dijiste. Qué asumiste."
                    disabled={aiBusy}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <FieldLabel>Contexto</FieldLabel>
                  <Select className="mt-2" value={context} onChange={(e) => setContext(e.target.value as EntryContext)}>
                    {CONTEXTS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <FieldLabel>Límite</FieldLabel>
                  <Select className="mt-2" value={boundary} onChange={(e) => setBoundary(e.target.value as EntryBoundary)}>
                    {BOUNDARIES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <FieldLabel>Reacción</FieldLabel>
                  <Select className="mt-2" value={reaction} onChange={(e) => setReaction(e.target.value as EntryReaction)}>
                    {REACTIONS.map((r) => (
                      <option key={r} value={r}>
                        {humanizeReaction(r)}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <FieldLabel>Peso emocional</FieldLabel>
                  <div className="mt-2 flex items-center gap-3">
                    <Range value={emotionalWeight} onChange={setEmotionalWeight} ariaLabel="Peso emocional" />
                    <div className="w-10 text-right text-sm font-medium text-outer-space">{emotionalWeight}</div>
                  </div>
                </div>
                <div>
                  <FieldLabel>¿Se repite?</FieldLabel>
                  <Select className="mt-2" value={repeatSignal} onChange={(e) => setRepeatSignal(e.target.value as RepeatSignal)}>
                    <option value="no">{humanizeRepeatSignal("no")}</option>
                    <option value="creo_que_si">{humanizeRepeatSignal("creo_que_si")}</option>
                    <option value="si">{humanizeRepeatSignal("si")}</option>
                  </Select>
                </div>
              </div>

              <div className="rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-outer-space">Tags (opcional)</div>
                    <div className="mt-1 text-sm text-outer-space/70">
                      Máximo 3. El resto es ruido.
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setTagsOpen(true)} disabled={aiBusy}>
                    <Tags className="h-4 w-4" aria-hidden />
                    Elegir
                  </Button>
                </div>
                <div className="mt-3 text-sm text-outer-space/75">
                  {tags.length ? tags.join(" · ") : "—"}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <Button variant="primary" disabled={aiBusy} onClick={() => saveEntry({ askReading: false })}>
                Guardar
              </Button>
              <Button
                disabled={aiBusy || silenceMode}
                onClick={() => saveEntry({ askReading: true })}
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                {aiBusy ? "Generando…" : "Guardar y pedir lectura"}
              </Button>
            </div>
            <Button variant="quiet" disabled={aiBusy} onClick={() => setVaultOpen(true)}>
              <Lock className="h-4 w-4" aria-hidden />
              Sellar en Bóveda
            </Button>
          </div>

          {silenceMode ? (
            <div className="mt-3 text-xs text-outer-space/60">
              Modo silencio activo: no se genera lectura inmediata.
            </div>
          ) : null}
        </Card>

        <Collapsible
          title="Últimos registros"
          description="No para recordar. Para ver repetición."
          defaultOpen={recentEntriesOpenDefault}
        >
          <div className="space-y-3">
            {recentEntries.map((e) => (
              <div key={e.id} className="rounded-xl bg-mint-cream/70 px-4 py-4 ring-1 ring-gainsboro/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold tracking-tight text-outer-space">{e.type.replaceAll("_", " ")}</div>
                  <div className="text-xs text-outer-space/60">{e.date}</div>
                </div>
                <div className="mt-2 text-sm text-outer-space/75 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                  {e.text}
                </div>
              </div>
            ))}
            <div className="flex justify-end">
              <Button onClick={() => navigate("/lecturas")}>Ir a Lecturas</Button>
            </div>
          </div>
        </Collapsible>
      </div>

      <Sheet
        open={layerPickerOpen}
        title="Capa"
        description="No es etiqueta. Es punto de entrada."
        onClose={() => setLayerPickerOpen(false)}
      >
        <div className="space-y-2">
          {LAYERS.map((l) => {
            const active = l.type === layer;
            return (
              <button
                key={l.type}
                type="button"
                onClick={() => {
                  setLayer(l.type);
                  setLayerPickerOpen(false);
                }}
                className={
                  active
                    ? "w-full rounded-2xl bg-mint-cream ring-1 ring-gainsboro/70 px-4 py-4 text-left"
                    : "w-full rounded-2xl bg-white ring-1 ring-gainsboro/70 px-4 py-4 text-left transition hover:bg-mint-cream/50"
                }
                aria-pressed={active}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold tracking-tight text-outer-space">{l.label}</div>
                    <div className="mt-1 text-sm text-outer-space/70">{l.hint}</div>
                  </div>
                  {active ? <div className="text-xs text-outer-space/60">Seleccionado</div> : null}
                </div>
              </button>
            );
          })}
        </div>
      </Sheet>

      <Sheet
        open={tagsOpen}
        title="Tags (máx 3)"
        description="Selecciona lo que domina. No todo."
        onClose={() => setTagsOpen(false)}
      >
        {(() => {
          const hasQuery = Boolean(tagSearch.trim());
          const maxCollapsed = hasQuery ? 12 : 6;
          const visible = showAllTagOptions ? filteredTags : filteredTags.slice(0, maxCollapsed);
          const canShowMore = filteredTags.length > visible.length;

          return (
        <div className="space-y-4">
          <div>
            <FieldLabel>Búsqueda</FieldLabel>
            <Input
              className="mt-2"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Escribe para filtrar"
              disabled={aiBusy}
            />
            <FieldHint className="mt-2">
              Puedes escribir una palabra nueva y presionar Enter para agregarla.
            </FieldHint>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {visible.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={
                  tags.includes(t.toLowerCase())
                    ? "rounded-lg bg-outer-space px-3 py-2 text-xs text-white"
                    : "rounded-lg bg-mint-cream px-3 py-2 text-xs text-outer-space/80 ring-1 ring-gainsboro/70 hover:bg-white"
                }
              >
                {t}
              </button>
            ))}
          </div>

          {canShowMore ? (
            <div className="flex justify-end">
              <Button variant="quiet" size="sm" onClick={() => setShowAllTagOptions(true)} disabled={aiBusy}>
                Ver más
              </Button>
            </div>
          ) : null}

          {showAllTagOptions && filteredTags.length > (hasQuery ? 12 : 6) ? (
            <div className="flex justify-end">
              <Button variant="quiet" size="sm" onClick={() => setShowAllTagOptions(false)} disabled={aiBusy}>
                Ver menos
              </Button>
            </div>
          ) : null}

          <div className="rounded-xl bg-white ring-1 ring-gainsboro/70 px-4 py-4">
            <div className="text-xs text-morning-blue">Seleccionados</div>
            <div className="mt-2 text-sm text-outer-space/80">{tags.length ? tags.join(" · ") : "—"}</div>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setTagsOpen(false)}>Cerrar</Button>
          </div>
        </div>
          );
        })()}
      </Sheet>

      <GlassSheet
        open={vaultOpen}
        title="Bóveda"
        description="Lo que sellas aquí no entra a métricas, patrones ni lecturas."
        onClose={() => setVaultOpen(false)}
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-mint-cream/70 px-4 py-3 ring-1 ring-gainsboro/60 text-sm text-outer-space/80">
            Texto fijo: “Lo que escribes aquí no existe para el sistema.”
          </div>
          <div>
            <FieldLabel>Título (opcional)</FieldLabel>
            <Input
              className="mt-2"
              value={vaultTitle}
              onChange={(e) => setVaultTitle(e.target.value)}
              placeholder="Un nombre breve"
              disabled={aiBusy}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button onClick={() => setVaultOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={sealToVault} disabled={aiBusy}>
              Sellar
            </Button>
          </div>
        </div>
      </GlassSheet>

      <GlassSheet
        open={paywallOpen}
        title="Lecturas con IA (bloqueado)"
        description="En modo básico no generamos lecturas ni Caja. Puedes seguir registrando."
        onClose={() => setPaywallOpen(false)}
      >
        <div className="space-y-3">
          <div className="rounded-xl bg-mint-cream/70 px-4 py-3 ring-1 ring-gainsboro/60 text-sm text-outer-space/80">
            Para activar lecturas con evidencia, patrones y Caja de Enfrentamiento, elige un plan.
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => {
                setPaywallOpen(false);
                navigate("/planes");
              }}
            >
              Ver planes
            </Button>
            <Button onClick={() => setPaywallOpen(false)}>Cerrar</Button>
          </div>
        </div>
      </GlassSheet>
    </>
  );
}
