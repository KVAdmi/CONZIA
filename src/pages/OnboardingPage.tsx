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
    description: "Puedes pausar, omitir o retomar cuando lo necesites.\n\nNada se activa sin tu decisión. Nada se muestra sin tu permiso.\n\nEste espacio es tuyo.",
    cta: "Entrar a CONZIA",
    secondaryCta: "Omitir y entrar"
  }
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/login");
    }
  };

  const skipOnboarding = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-between px-8 pb-12 pt-16 bg-conzia-light overflow-hidden relative">
      {/* Fondo con degradado sutil y profesional */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#F4F6F8] to-[#F4F6F8] opacity-100" />
      
      {/* Elementos decorativos sutiles para transmitir paz */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-camel/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[10%] left-[-10%] w-80 h-80 bg-conzia-muted/5 rounded-full blur-[100px]" />

      <div className="flex flex-col items-center z-10 w-full max-w-md">
        {/* Logo Principal - Sutil y Profesional */}
        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-16"
        >
          <img 
            src="/brand/conzia-logo.png" 
            alt="CONZIA Logo" 
            className="w-32 h-auto object-contain opacity-90"
          />
        </motion.div>

        {/* Carrusel de Slides */}
        <div className="relative w-full min-h-[380px] flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col items-center text-center"
            >
              <h2 className="text-2xl font-bold text-conzia-dark mb-8 tracking-tight">
                {slides[currentSlide].title}
              </h2>
              <div className="text-conzia-gray/80 text-base leading-relaxed font-light px-2 whitespace-pre-line">
                {slides[currentSlide].description}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Indicadores de Slide - Minimalistas */}
        <div className="flex gap-2.5 mt-4">
          {slides.map((_, index) => (
            <div 
              key={index}
              className={`h-1 rounded-full transition-all duration-500 ${
                index === currentSlide ? "w-6 bg-camel" : "w-1.5 bg-conzia-muted/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Botones de Acción - Claros y Amorosos */}
      <div className="w-full max-w-sm space-y-4 z-10">
        <Button
          variant="primary"
          className="w-full py-4.5 bg-camel hover:bg-camel/90 text-white font-bold rounded-2xl shadow-lg shadow-camel/10 transition-all active:scale-[0.99] text-base"
          onClick={nextSlide}
        >
          {slides[currentSlide].cta}
        </Button>
        
        <button 
          onClick={skipOnboarding}
          className="w-full py-2 text-conzia-muted/60 hover:text-conzia-dark text-sm font-medium transition-colors"
        >
          {slides[currentSlide].secondaryCta}
        </button>

        <div className="pt-8 text-center">
          <p className="text-conzia-muted/30 text-[9px] tracking-[0.4em] uppercase font-bold">
            Acompañamiento Consciente · 2026
          </p>
        </div>
      </div>
    </div>
  );
}
