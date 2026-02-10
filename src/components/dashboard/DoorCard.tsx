import { LockKeyhole } from "lucide-react";
import { ReactNode } from "react";

type DoorStatus = "available" | "locked" | "active" | "completed";

type Props = {
  icon: ReactNode;
  label: string;
  status: DoorStatus;
  onClick?: () => void;
};

/**
 * Card individual de puerta con estado visual
 */
export default function DoorCard({ icon, label, status, onClick }: Props) {
  const isLocked = status === "locked";
  const isActive = status === "active";
  const isCompleted = status === "completed";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocked}
      className={`
        relative flex flex-col items-center justify-center
        rounded-2xl p-4 min-h-[100px]
        transition-all duration-200
        ${
          isLocked
            ? "bg-white/5 ring-1 ring-white/10 opacity-50 cursor-not-allowed"
            : isActive
            ? "bg-camel/20 ring-2 ring-camel shadow-[0_0_20px_rgba(125,92,107,0.3)]"
            : isCompleted
            ? "bg-emerald-500/10 ring-1 ring-emerald-500/30"
            : "bg-white/8 ring-1 ring-white/12 hover:bg-white/12 hover:ring-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.2)] active:scale-[0.98]"
        }
      `}
    >
      {/* Icono de candado si está bloqueada */}
      {isLocked && (
        <div className="absolute top-2 right-2">
          <LockKeyhole className="h-3 w-3 text-white/30" />
        </div>
      )}

      {/* Icono principal */}
      <div className={`mb-2 ${isLocked ? "text-white/30" : "text-white/90"}`}>{icon}</div>

      {/* Label */}
      <div className={`text-xs font-medium ${isLocked ? "text-white/30" : "text-white/80"}`}>{label}</div>

      {/* Indicador de estado */}
      {isActive && <div className="mt-2 text-[10px] text-camel font-semibold">EN CURSO</div>}
      {isCompleted && <div className="mt-2 text-[10px] text-emerald-400 font-semibold">COMPLETO</div>}
    </button>
  );
}
