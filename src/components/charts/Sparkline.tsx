import { motion } from "framer-motion";
import { useId, useMemo } from "react";
import { areaFromLine, smoothPath } from "./svgPaths";

type Point = { xLabel?: string; value: number };

function fmt(n: number): string {
  return n.toFixed(2);
}

export default function Sparkline({
  points,
  title,
  subtitle,
}: {
  points: Point[];
  title: string;
  subtitle?: string;
}) {
  const ids = useId();
  const width = 560;
  const height = 150;
  const padding = 18;
  const baselineY = height - padding;
  const fillId = `${ids}-fill`;

  const { linePath, areaPath } = useMemo(() => {
    const safe = points.length ? points : [{ value: 0 }];
    const values = safe.map((p) => p.value);
    const w = width - padding * 2;
    const h = height - padding * 2;
    const stepX = safe.length <= 1 ? 0 : w / (safe.length - 1);
    const domainMin = 0;
    const domainMax = 10;
    const span = Math.max(0.0001, domainMax - domainMin);

    const xy = values.map((v, idx) => {
      const x = padding + idx * stepX;
      const t = (v - domainMin) / span;
      const y = padding + (1 - t) * h;
      return { x, y };
    });

    const linePath = smoothPath(xy, 0.22);
    const areaPath = areaFromLine({ linePath, points: xy, baselineY });
    return { linePath, areaPath };
  }, [baselineY, height, padding, points, width]);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-medium text-outer-space/80">{title}</div>
        {subtitle ? <div className="text-xs text-morning-blue">{subtitle}</div> : null}
      </div>
      <div className="mt-2 rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-3 py-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full text-camel">
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.26" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path
            d={`M ${fmt(padding)} ${fmt(baselineY)} L ${fmt(width - padding)} ${fmt(baselineY)}`}
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeWidth={1.5}
            strokeLinecap="round"
            className="text-outer-space/80"
          />

          <motion.path
            d={areaPath}
            fill={`url(#${fillId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-camel"
          />
          <motion.path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0.2 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
            className="text-camel"
          />
        </svg>
      </div>
    </div>
  );
}
