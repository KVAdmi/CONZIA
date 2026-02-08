import { motion } from "framer-motion";

export type BarDatum = {
  label: string;
  done: number;
  partial: number;
  notDone: number;
};

function maxTotal(data: BarDatum[]) {
  return Math.max(1, ...data.map((d) => d.done + d.partial + d.notDone));
}

export default function StackedBarChart({
  data,
  title,
}: {
  data: BarDatum[];
  title: string;
}) {
  const max = maxTotal(data);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-medium text-outer-space/80">{title}</div>
        <div className="text-xs text-morning-blue">7 días</div>
      </div>
      <div className="mt-2 rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4">
        <div className="flex items-end gap-2">
          {data.map((d, idx) => {
            const total = d.done + d.partial + d.notDone;
            const height = (total / max) * 120;
            const doneH = total === 0 ? 0 : (d.done / total) * height;
            const partialH = total === 0 ? 0 : (d.partial / total) * height;
            const notH = total === 0 ? 0 : (d.notDone / total) * height;

            return (
              <div key={d.label} className="flex-1">
                <div className="flex h-32 items-end">
                  <div className="mx-auto w-full max-w-[34px] rounded-lg bg-white ring-1 ring-gainsboro/70 overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: doneH }}
                      transition={{ duration: 0.6, delay: 0.15 + idx * 0.04 }}
                      className="bg-outer-space/85"
                      title={`Lo hice: ${d.done}`}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: partialH }}
                      transition={{ duration: 0.6, delay: 0.18 + idx * 0.04 }}
                      className="bg-morning-blue/80"
                      title={`A medias: ${d.partial}`}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: notH }}
                      transition={{ duration: 0.6, delay: 0.21 + idx * 0.04 }}
                      className="bg-gainsboro/90"
                      title={`No lo hice: ${d.notDone}`}
                    />
                  </div>
                </div>
                <div className="mt-2 text-center text-[11px] text-outer-space/65">{d.label}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-outer-space/70">
          <div className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-outer-space/85" aria-hidden /> Lo hice
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-morning-blue/80" aria-hidden /> A medias
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-gainsboro/90" aria-hidden /> No lo hice
          </div>
        </div>
      </div>
    </div>
  );
}

