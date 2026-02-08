import { motion } from "framer-motion";

export type HeatCell = { date: string; value: number };

function alphaFor(value: number, max: number) {
  if (max <= 0) return 0.08;
  const t = Math.min(1, value / max);
  return 0.10 + t * 0.55;
}

export default function Heatmap({
  cells,
  title,
}: {
  cells: HeatCell[]; // last 28–35 días
  title: string;
}) {
  const max = Math.max(1, ...cells.map((c) => c.value));
  const rows = 5;
  const cols = 7;
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ date: "", value: 0 })));

  for (let i = 0; i < Math.min(rows * cols, cells.length); i += 1) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    grid[r]![c] = cells[i]!;
  }

  const weekdayLabels = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-medium text-outer-space/80">{title}</div>
        <div className="text-xs text-morning-blue">5 semanas</div>
      </div>

      <div className="mt-2 rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4">
        <div className="flex items-center justify-between text-[11px] text-outer-space/55">
          {weekdayLabels.map((w) => (
            <div key={w} className="w-[calc(100%/7)] text-center">
              {w}
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-rows-5 gap-2">
          {grid.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-7 gap-2">
              {row.map((cell, cIdx) => {
                const a = alphaFor(cell.value, max);
                return (
                  <motion.div
                    key={`${rIdx}-${cIdx}`}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.08 + (rIdx * 7 + cIdx) * 0.01, duration: 0.25 }}
                    title={`${cell.date || "—"}: ${cell.value}`}
                    className="h-6 rounded-md ring-1 ring-gainsboro/60"
                    style={{ backgroundColor: `rgba(84, 41, 25, ${a})` }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-3 text-[11px] text-outer-space/60">
          Intensidad = densidad de registros por día.
        </div>
      </div>
    </div>
  );
}
