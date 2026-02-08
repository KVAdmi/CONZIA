import { useId } from "react";
import { cn } from "../../utils/cn";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export default function RadialProgress({
  value,
  size = 220,
  strokeWidth = 14,
  trackColor = "rgba(255,255,255,0.18)",
  className,
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const v = clamp01(value);
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * v;
  const gap = c - dash;

  const gid = useId();
  const gradientId = `conzia-ring-${gid}`;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
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
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>

      {children ? <div className="absolute inset-0 grid place-items-center">{children}</div> : null}
    </div>
  );
}

