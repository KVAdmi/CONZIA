import { motion } from "framer-motion";
import { useMemo } from "react";
import type { Pattern } from "../../types/models";
import { cn } from "../../utils/cn";

type Node = {
  id: string;
  name: string;
  frequency30d: number;
  trend: Pattern["trend"];
  x: number;
  y: number;
  r: number;
};

function hashToUnit(input: string, seed: number): number {
  // FNV-1a-ish, stable and fast
  let h = 2166136261 ^ seed;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // [0, 1)
  return ((h >>> 0) % 10_000) / 10_000;
}

function radiusFrom(freq: number): number {
  const clamped = Math.max(1, Math.min(24, freq));
  return 10 + clamped * 0.9;
}

function colorClassForTrend(trend: Pattern["trend"]): string {
  // No "éxito/fracaso". Solo marea: más activo, estable, cede.
  if (trend === "up") return "text-chestnut";
  if (trend === "down") return "text-camel";
  return "text-fog-blue";
}

export default function PatternConstellation({
  patterns,
  className,
  onSelect,
}: {
  patterns: Pattern[];
  className?: string;
  onSelect?: (patternId: string) => void;
}) {
  const width = 560;
  const height = 220;
  const padding = 22;

  const nodes = useMemo<Node[]>(() => {
    const sorted = [...patterns].sort((a, b) => b.frequency30d - a.frequency30d).slice(0, 10);
    return sorted.map((p) => {
      const ux = hashToUnit(p.id, 11);
      const uy = hashToUnit(p.id, 37);
      const x = padding + ux * (width - padding * 2);
      const y = padding + uy * (height - padding * 2);
      return {
        id: p.id,
        name: p.name,
        frequency30d: p.frequency30d,
        trend: p.trend,
        x,
        y,
        r: radiusFrom(p.frequency30d),
      };
    });
  }, [patterns]);

  const dominant = useMemo(() => {
    return [...patterns].sort((a, b) => b.frequency30d - a.frequency30d)[0]?.id ?? null;
  }, [patterns]);

  if (!patterns.length) {
    return (
      <div className={cn("rounded-2xl bg-white/70 ring-1 ring-gainsboro/60 px-5 py-5", className)}>
        <div className="text-sm font-semibold tracking-tight text-outer-space">Constelación</div>
        <div className="mt-2 text-sm text-outer-space/70">Aún no hay patrones suficientes.</div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl bg-white/70 ring-1 ring-gainsboro/60 px-5 py-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold tracking-tight text-outer-space">Constelación</div>
          <div className="mt-1 text-sm text-outer-space/70">
            Patrones activos como mapa. No juicio. Solo forma.
          </div>
        </div>
        <div className="text-xs text-outer-space/60">30 días</div>
      </div>

      <div className="mt-4 rounded-2xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-3 py-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">
          <defs>
            <radialGradient id="concia-constellation-glow" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor="rgba(125,92,107,0.18)" />
              <stop offset="100%" stopColor="rgba(125,92,107,0)" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width={width} height={height} fill="url(#concia-constellation-glow)" />

          {nodes.map((n, idx) => {
            const isDominant = n.id === dominant;
            const label = `${n.name} · ${n.frequency30d} (30d)`;
            return (
              <motion.g
                key={n.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.06 + idx * 0.03, duration: 0.35 }}
                className={cn("cursor-pointer", colorClassForTrend(n.trend))}
                onClick={() => onSelect?.(n.id)}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r}
                  fill="currentColor"
                  opacity={isDominant ? 0.16 : 0.10}
                />
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={Math.max(8, n.r * 0.52)}
                  fill="currentColor"
                  opacity={isDominant ? 0.28 : 0.18}
                />
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={Math.max(5, n.r * 0.25)}
                  fill="currentColor"
                  opacity={isDominant ? 0.78 : 0.62}
                />
                <title>{label}</title>
              </motion.g>
            );
          })}
        </svg>
        <div className="mt-2 text-[11px] text-outer-space/60">
          Toca un nodo para abrir evidencia del patrón.
        </div>
      </div>
    </div>
  );
}
