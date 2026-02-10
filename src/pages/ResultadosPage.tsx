import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useConzia } from "../state/conziaStore";
import type { ConziaArchetype, ConziaProfile, ConziaShadowTrait } from "../types/models";
import { diffDays, parseISODate } from "../utils/dates";

const ARCH_ORDER: ConziaArchetype[] = ["guerrero", "amante", "rey", "mago"];

const ARCH_LABEL: Record<ConziaArchetype, string> = {
  guerrero: "Guerrero",
  amante: "Amante",
  rey: "Sabio Rey",
  mago: "Mago",
};

function scoreFromProfile(profile: ConziaProfile | null, archetype: ConziaArchetype): number {
  const v = profile?.archetype_scores?.[archetype];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function pickDominantAndShadow(scores: Record<ConziaArchetype, number>) {
  const sorted = ARCH_ORDER.slice().sort((a, b) => scores[b] - scores[a]);
  return { dominant: sorted[0]!, shadow: sorted.at(-1)! };
}

function RadarChart({ scores }: { scores: Record<ConziaArchetype, number> }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 96;

  const full = ARCH_ORDER.map((_, i) => {
    const angle = ((-90 + i * 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const light = ARCH_ORDER.map((a, i) => {
    const pct = Math.max(0, Math.min(100, scores[a]));
    const rr = (r * pct) / 100;
    const angle = ((-90 + i * 90) * Math.PI) / 180;
    return { x: cx + rr * Math.cos(angle), y: cy + rr * Math.sin(angle) };
  });

  const polygon = (pts: Array<{ x: number; y: number }>) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Radar 4 pilares">
      <defs>
        <radialGradient id="radarGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.24)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      <circle cx={cx} cy={cy} r={r + 20} fill="url(#radarGlow)" />

      {[0.25, 0.5, 0.75, 1].map((m) => (
        <polygon
          key={m}
          points={polygon(
            full.map((p) => ({ x: cx + (p.x - cx) * m, y: cy + (p.y - cy) * m })),
          )}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1}
        />
      ))}

      {full.map((p, i) => (
        <line
          key={ARCH_ORDER[i]}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1}
        />
      ))}

      <polygon points={polygon(full)} fill="rgba(11,18,32,0.28)" stroke="rgba(255,255,255,0.22)" strokeWidth={1.2} />
      <polygon points={polygon(light)} fill="rgba(125, 92, 107, 0.4)" stroke="rgb(125, 92, 107)" strokeWidth={2} />

      {full.map((p, i) => {
        const a = ARCH_ORDER[i]!;
        const dx = p.x - cx;
        const dy = p.y - cy;
        const tx = p.x + Math.sign(dx) * 18;
        const ty = p.y + Math.sign(dy) * 18;
        const anchor = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "start" : "end") : "middle";
        return (
          <text
            key={`label_${a}`}
            x={tx}
            y={ty}
            fill="rgba(255,255,255,0.78)"
            fontSize="11"
            fontWeight="600"
            textAnchor={anchor}
            dominantBaseline="middle"
          >
            {ARCH_LABEL[a]}
          </text>
        );
      })}
    </svg>
  );
}

function TraitCard({ item }: { item: ConziaShadowTrait }) {
  return (
    <div className="min-w-[220px] rounded-2xl bg-white/10 ring-1 ring-white/10 px-4 py-4 text-white">
      <div className="text-xs tracking-[0.18em] text-white/55">HALLAZGO</div>
      <div className="mt-2 text-sm font-semibold tracking-tight">{item.trait}</div>
      <div className="mt-2 text-xs text-white/70">{item.origin_probable}</div>
      <div className="mt-3 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/75 ring-1 ring-white/10">
        {item.status === "detected" ? "Detectado" : "Integrado"}
      </div>
    </div>
  );
}

export default function ResultadosPage() {
  const navigate = useNavigate();
  const { state } = useConzia();

  const process = useMemo(() => {
    const pick = state.activeProcessId ? state.processes.find((p) => p.id === state.activeProcessId) : undefined;
    return pick ?? state.processes[0] ?? null;
  }, [state.activeProcessId, state.processes]);

  const scores = useMemo(() => {
    return ARCH_ORDER.reduce((acc, a) => {
      acc[a] = scoreFromProfile(state.profile, a);
      return acc;
    }, {} as Record<ConziaArchetype, number>);
  }, [state.profile]);

  const derived = useMemo(() => pickDominantAndShadow(scores), [scores]);

  const dominant = state.profile?.dominant_archetype ?? derived.dominant;
  const shadow = state.profile?.shadow_archetype ?? derived.shadow;

  const daysRemaining = useMemo(() => {
    if (!process) return 90;
    try {
      const elapsed = diffDays(parseISODate(process.started_at), new Date());
      return Math.max(0, 90 - elapsed);
    } catch {
      return 90;
    }
  }, [process]);

  const month1 = Math.max(0, Math.min(30, 90 - daysRemaining));
  const month2 = Math.max(0, Math.min(30, 60 - daysRemaining));
  const month3 = Math.max(0, Math.min(30, 30 - daysRemaining));

  const oracle = useMemo(() => {
    const d = ARCH_LABEL[dominant];
    const s = ARCH_LABEL[shadow];
    const trait = state.profile?.shadow_traits?.[0]?.trait ?? null;
    const line1 = `Tu luz se apoya en el ${d}.`;
    const line2 = trait ? `Tu sombra se asoma como ${trait}.` : `Tu sombra está pidiendo integrar al ${s}.`;
    return `${line1} ${line2}`;
  }, [dominant, shadow, state.profile?.shadow_traits]);

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-12">
      <div className="text-white">
        <div className="text-[11px] tracking-[0.18em] text-white/55">ORÁCULO</div>
        <div className="mt-3 text-2xl font-semibold tracking-tight">Tu espejo inicial</div>
        <div className="mt-3 rounded-2xl bg-[#0b1220]/70 ring-1 ring-white/10 px-5 py-4 text-sm text-white/80">
          {oracle}
        </div>
      </div>

      <div className="mt-7 rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 pb-6 pt-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between gap-4">
          <div className="text-white">
            <div className="text-xs tracking-[0.18em] text-white/55">RADAR</div>
            <div className="mt-2 text-sm text-white/75">
              Luz: {ARCH_LABEL[dominant]} · Sombra: {ARCH_LABEL[shadow]}
            </div>
          </div>
          <div className="text-right text-white">
            <div className="text-xs text-white/55">90 días</div>
            <div className="mt-1 text-sm font-semibold">{daysRemaining} restantes</div>
          </div>
        </div>

        <div className="mt-5 flex justify-center">
          <RadarChart scores={scores} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {ARCH_ORDER.map((a) => (
            <div key={a} className="rounded-2xl bg-white/6 ring-1 ring-white/10 px-4 py-3 text-white">
              <div className="text-xs text-white/55">{ARCH_LABEL[a]}</div>
              <div className="mt-1 text-sm font-semibold">{Math.round(scores[a])}%</div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-white">
          <div className="text-xs tracking-[0.18em] text-white/55">HALLAZGOS DE SOMBRA</div>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {(state.profile?.shadow_traits?.length ? state.profile.shadow_traits : []).map((t) => (
              <TraitCard key={`${t.trait}_${t.origin_probable}`} item={t} />
            ))}
            {!state.profile?.shadow_traits?.length ? (
              <div className="rounded-2xl bg-white/6 ring-1 ring-white/10 px-4 py-4 text-sm text-white/70">
                Aún sin hallazgos.
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 text-white">
          <div className="text-xs tracking-[0.18em] text-white/55">TU VIAJE (90 DÍAS)</div>
          <div className="mt-3 rounded-2xl bg-white/6 ring-1 ring-white/10 px-4 py-4">
            <div className="flex items-center justify-between text-xs text-white/70">
              <div>Mes 1</div>
              <div>Mes 2</div>
              <div>Mes 3</div>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="flex h-full w-full">
                <div className="h-full bg-camel" style={{ width: `${(month1 / 90) * 100}%` }} />
                <div className="h-full bg-camel/70" style={{ width: `${(month2 / 90) * 100}%` }} />
                <div className="h-full bg-camel/45" style={{ width: `${(month3 / 90) * 100}%` }} />
              </div>
            </div>
            <div className="mt-3 text-xs text-white/65">
              Mes 1: Observación · Mes 2: Diálogo · Mes 3: Integración
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-2">
          <Button variant="primary" onClick={() => navigate("/desahogo")} type="button" className="w-full py-3">
            IR AL DESAHOGO DE HOY
          </Button>
          <Button onClick={() => navigate("/sesion")} type="button" className="w-full">
            ACEPTO MI SOMBRA
          </Button>
        </div>
      </div>

      <Card className="mt-6 p-6">
        <div className="text-sm font-semibold tracking-tight text-outer-space">Ley de oro</div>
        <div className="mt-2 text-sm text-outer-space/70">
          Nada termina en “guardar”. Siempre termina en Reflejo + Pregunta + Acción.
        </div>
      </Card>
    </div>
  );
}
