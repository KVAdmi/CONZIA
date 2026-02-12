import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/ui/Button";

const slides = [
  {
    id: 1,
    title: "Bienvenida a CONZIA",
    description: "Este es un espacio privado, diseñado para acompañarte con claridad, cuidado y respeto.\n\nAquí no se te evalúa ni se te corrige.\nAquí se observa, se entiende y se avanza a tu ritmo.",
    cta: "Continuar",
    secondaryCta: "Omitir"
  },
  {
    id: 2,
    title: "¿Qué es CONZIA?",
    description: "CONZIA no reemplaza a un terapeuta ni te da diagnósticos.\n\nEs una herramienta de observación personal que te ayuda a reconocer patrones, estados y decisiones internas.\n\nNo busca respuestas rápidas. Busca comprensión sostenible.",
    cta: "Entiendo, continuar",
    secondaryCta: "Omitir"
  },
  {
    id: 3,
    title: "¿Cómo funciona?",
    description: "A través de ejercicios breves y momentos de reflexión, CONZIA identifica dinámicas internas que suelen pasar desapercibidas.\n\nNo hay respuestas correctas. No hay prisa.\nSolo información útil para ti.",
    cta: "Continuar",
    secondaryCta: "Omitir"
  },
  {
    id: 4,
    title: "Tú tienes el control",
    description: "Puedes pausar, omitir o retomar cuando lo necesites.\n\nNada se activa sin tu decisión. Nada se muestra sin tu permiso.\n\nEste espacio es tuyo.\n\nTransforma tu sombra en tu poder.",
    cta: "Entrar a CONZIA",
    secondaryCta: "Omitir y entrar"
  }
];

const ONBOARDING_DONE_KEY = "conzia_v1_onboarding_done";

function markOnboardingDone() {
  try {
    localStorage.setItem(ONBOARDING_DONE_KEY, "1");
  } catch {
    // ignore
  }
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      markOnboardingDone();
      navigate("/login");
    }
  };

  const skipOnboarding = () => {
    markOnboardingDone();
    navigate("/login");
  };

  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-between px-8 pb-12 pt-20 bg-[#0b1220] overflow-hidden relative">
      {/* Fondo Cinematográfico con degradados profundos */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1220] via-[#1E2A38] to-[#0b1220] opacity-100" />
      
      {/* Textura de grano sutil para profundidad psicológica */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      {/* Elementos de luz sutiles */}
      <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-[#DDB273]/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-10%] left-[-20%] w-[400px] h-[400px] bg-[#7F809D]/10 rounded-full blur-[120px]" />

      <div className="flex flex-col items-center z-10 w-full max-w-md">
        {/* Logo - Grande con presencia 3D */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 relative"
        >
          {/* Glow effect detrás del logo */}
          <div className="absolute inset-0 blur-[60px] bg-[#DDB273]/20 scale-150" />
          
          {/* Logo con efecto 3D */}
          <div className="relative">
            {/* Sombra 3D - capa trasera */}
            <img 
              src="/brand/conzia-logo.png" 
              alt="" 
              className="w-44 h-auto object-contain brightness-0 invert opacity-10 absolute top-2 left-2 blur-sm"
              aria-hidden="true"
            />
            
            {/* Logo principal */}
            <img 
              src="/brand/conzia-logo.png" 
              alt="CONZIA Logo" 
              className="w-44 h-auto object-contain brightness-0 invert opacity-90 relative z-10 drop-shadow-[0_8px_32px_rgba(221,178,115,0.3)]"
            />
          </div>
        </motion.div>

        {/* Carrusel de Slides - Estilo Cinematográfico */}
        <div className="relative w-full min-h-[350px] flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center"
            >
              <h2 className="text-xl font-light text-white/90 mb-10 uppercase tracking-[0.4em]">
                {slides[currentSlide].title}
              </h2>
              <div className="text-white/60 text-base leading-[1.8] font-light px-4 whitespace-pre-line tracking-wide">
                {slides[currentSlide].description}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Indicadores - Minimalismo Extremo */}
        <div className="flex gap-4 mt-8">
          {slides.map((_, index) => (
            <div 
              key={index}
              className={`h-[1px] transition-all duration-700 ${
                index === currentSlide ? "w-12 bg-[#DDB273]" : "w-4 bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Botones de Acción - Elegancia y Respeto */}
      <div className="w-full max-w-sm space-y-6 z-10">
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Button
            variant="primary"
            className="w-full py-4 bg-transparent border border-white/20 hover:border-[#DDB273]/50 text-white/90 font-light tracking-[0.2em] uppercase text-xs rounded-full transition-all duration-500"
            onClick={nextSlide}
          >
            {slides[currentSlide].cta}
          </Button>
        </motion.div>
        
        <button 
          onClick={skipOnboarding}
          className="w-full py-2 text-white/20 hover:text-white/40 text-[10px] uppercase tracking-[0.3em] font-light transition-colors"
        >
          {slides[currentSlide].secondaryCta}
        </button>

        <div className="pt-12 text-center">
          <p className="text-white/10 text-[8px] tracking-[0.5em] uppercase font-light">
            Introspección Consciente · 2026
          </p>
        </div>
      </div>
    </div>
  );
}
