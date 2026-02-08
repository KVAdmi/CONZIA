import { motion } from "framer-motion";
import { useId, useMemo } from "react";
import { cn } from "../../utils/cn";
import { areaFromLine, pointsFromValues, smoothPath } from "./svgPaths";

export default function MiniSparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const ids = useId();
  const width = 260;
  const height = 74;
  const padding = 10;
  const baselineY = height - padding;

  const { linePath, areaPath, last } = useMemo(() => {
    const points = pointsFromValues({
      values,
      width,
      height,
      padding,
      domain: { min: 0, max: 10 },
    });
    const linePath = smoothPath(points);
    const areaPath = areaFromLine({ linePath, points, baselineY });
    const last = points[points.length - 1]!;
    return { linePath, areaPath, last };
  }, [baselineY, height, padding, values, width]);

  const fillId = `${ids}-fill`;
  const glowId = `${ids}-glow`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-14 w-full", className)}
      role="img"
      aria-label="Tendencia"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.34" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <filter id={glowId} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.35 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        d={`M ${padding} ${baselineY} L ${width - padding} ${baselineY}`}
        stroke="currentColor"
        strokeOpacity={0.14}
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      <motion.path
        d={areaPath}
        fill={`url(#${fillId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.75}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.25 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
        filter={`url(#${glowId})`}
      />

      <motion.circle
        cx={last.x}
        cy={last.y}
        r={4}
        fill="currentColor"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.35, ease: "easeOut" }}
      />
    </svg>
  );
}
