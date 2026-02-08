import { motion } from "framer-motion";

export type HorizontalBarDatum = { label: string; value: number };

export default function HorizontalBarChart({
  data,
  title,
}: {
  data: HorizontalBarDatum[];
  title: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-medium text-outer-space/80">{title}</div>
        <div className="text-xs text-morning-blue">30 días</div>
      </div>
      <div className="mt-2 rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4 space-y-3">
        {data.map((d, idx) => {
          const pct = (d.value / max) * 100;
          return (
            <div key={d.label} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-[11px] text-outer-space/70">
                <div className="truncate">{d.label}</div>
                <div className="shrink-0">{d.value}</div>
              </div>
              <div className="h-2 rounded-full bg-white ring-1 ring-gainsboro/70 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: 0.12 + idx * 0.04 }}
                  className="h-full bg-outer-space/80"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

