import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type Props = {
  label: string;
  sublabel?: string;
  value: number; // 0..1
  size?: number;
  strokeWidth?: number;
} & HTMLAttributes<HTMLDivElement>;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export default function ProgressRing({
  label,
  sublabel,
  value,
  size = 64,
  strokeWidth = 8,
  className,
  ...props
}: Props) {
  const v = clamp01(value);
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * v;
  const gap = c - dash;

  return (
    <div className={cn("inline-flex items-center gap-3", className)} {...props}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <defs>
          <linearGradient id="xmiRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(125, 92, 107)" />
            <stop offset="60%" stopColor="rgb(168, 181, 193)" />
            <stop offset="100%" stopColor="rgb(84, 41, 25)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(28,25,23,0.12)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#xmiRing)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>

      <div className="min-w-0">
        <div className="text-xs text-morning-blue">{label}</div>
        {sublabel ? <div className="mt-0.5 text-xs text-outer-space/60">{sublabel}</div> : null}
      </div>
    </div>
  );
}

