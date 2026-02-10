import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "../components/ui/Button";

export default function OnboardingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-between px-8 pb-12 pt-20 bg-[#0b1220] overflow-hidden relative">
      {/* Elementos decorativos de fondo */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-camel/10 rounded-full blur-[120px]" 
      />
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[120px]" 
      />

      <div className="flex flex-col items-center z-10 w-full">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 100,
            damping: 20,
            delay: 0.2 
          }}
          className="relative mb-12"
        >
          <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <img 
            src="/logo.png" 
            alt="CONZIA Logo" 
            className="w-48 h-48 object-contain relative z-10 drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          />
        </motion.div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-5xl font-bold text-white tracking-[0.2em] text-center mb-4"
        >
          CONZIA
        </motion.h1>
        
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: 48 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="h-1 bg-camel rounded-full mb-10" 
        />
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-white/70 text-center text-lg leading-relaxed max-w-xs font-light"
        >
          Bienvenido a tu santuario de introspección. Un viaje de 90 días hacia el corazón de tu sombra.
        </motion.p>
      </div>

      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="w-full max-w-sm space-y-6 z-10"
      >
        <Button
          variant="primary"
          className="w-full py-6 bg-camel hover:bg-camel/90 text-white font-semibold rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.4)] transition-all active:scale-[0.98] text-lg"
          onClick={() => navigate("/registro")}
        >
          Comenzar mi viaje
        </Button>
        
        <div className="text-center">
          <p className="text-white/40 text-sm">
            ¿Ya tienes una cuenta?{" "}
            <button 
              onClick={() => navigate("/login")}
              className="text-white/80 hover:text-white font-medium underline underline-offset-8 transition-colors"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="z-10"
      >
        <p className="text-white/20 text-[10px] tracking-[0.3em] uppercase font-medium">
          AI Cognitive Shadow Work · 2026
        </p>
      </motion.div>
    </div>
  );
}
