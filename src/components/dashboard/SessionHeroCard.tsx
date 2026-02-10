import { Brain } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
  dayIndex: number;
  totalDays: number;
  currentDoor?: string;
  arquetipo?: string;
  friccion?: string;
};

/**
 * Hero card principal del dashboard
 * Muestra estado actual de la sesión
 */
export default function SessionHeroCard({ dayIndex, totalDays, currentDoor, arquetipo, friccion }: Props) {
  return (
    <div className="rounded-[28px] bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-xl ring-1 ring-white/12 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      {/* Cerebro animado */}
      <div className="flex items-center justify-center mb-4">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="rounded-full bg-white/10 p-4 ring-1 ring-white/20"
        >
          <Brain className="h-8 w-8 text-camel" />
        </motion.div>
      </div>

      {/* Estado de sesión */}
      <div className="text-center">
        <div className="text-xs tracking-wider text-white/50 uppercase mb-1">Sesión Activa</div>
        <div className="text-lg font-semibold text-white mb-3">
          Día {dayIndex}/{totalDays}
        </div>

        {currentDoor && (
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 ring-1 ring-white/10 mb-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Hoy: {currentDoor}
          </div>
        )}

        {/* Info del usuario */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-white/60">
          {arquetipo && (
            <div>
              <span className="text-white/40">Arquetipo:</span> <span className="text-white/70">{arquetipo}</span>
            </div>
          )}
          {friccion && (
            <div>
              <span className="text-white/40">Fricción:</span> <span className="text-white/70">{friccion}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
