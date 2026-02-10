import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Card de métrica con diseño glassmorphism
 * Mantiene paleta actual de CONZIA
 */
export default function MetricCard({ children, className = "" }: Props) {
  return (
    <div
      className={`
        rounded-2xl bg-white/5 backdrop-blur-md
        ring-1 ring-white/10
        px-4 py-3
        shadow-[0_8px_32px_rgba(0,0,0,0.25)]
        transition hover:bg-white/8
        ${className}
      `}
    >
      {children}
    </div>
  );
}
