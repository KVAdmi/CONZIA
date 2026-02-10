import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/ui/Button";

const slides = [
  {
    id: 1,
    title: "Identificación",
    description: "Descubre los arquetipos que rigen tu sombra y cómo influyen en tu vida diaria.",
    icon: "🔍"
  },
  {
    id: 2,
    title: "Desahogo",
    description: "Un espacio sagrado y seguro para liberar lo que callas y confrontar tu verdad.",
    icon: "🗣️"
  },
  {
    id: 3,
    title: "Sanación",
    description: "Un viaje de 90 días para integrar tu sombra y brillar con tu propia luz.",
    icon: "✨"
  }
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/registro");
    }
  };

  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-between px-8 pb-12 pt-16 bg-conzia-light overflow-hidden relative">
      {/* Fondo con degradado sutil */}
      <div className="absolute inset-0 bg-conzia-gradient opacity-50" />
      
      {/* Elementos decorativos sutiles */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-camel/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[20%] left-[-10%] w-80 h-80 bg-conzia-muted/10 rounded-full blur-3xl" />

      <div className="flex flex-col items-center z-10 w-full max-w-md">
        {/* Logo Principal */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-12"
        >
          <img 
            src="/brand/conzia-logo.png" 
            alt="CONZIA Logo" 
            className="w-40 h-auto object-contain drop-shadow-sm"
          />
        </motion.div>

        {/* Carrusel de Slides */}
        <div className="relative w-full min-h-[320px] flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center text-center"
            >
              <div className="text-6xl mb-8 bg-white w-24 h-24 flex items-center justify-center rounded-3xl shadow-glass border border-white/50">
                {slides[currentSlide].icon}
              </div>
              <h2 className="text-3xl font-bold text-conzia-dark mb-4 tracking-tight">
                {slides[currentSlide].title}
              </h2>
              <p className="text-conzia-gray/80 text-lg leading-relaxed font-light px-4">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Indicadores de Slide */}
        <div className="flex gap-2 mt-8">
          {slides.map((_, index) => (
            <div 
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide ? "w-8 bg-camel" : "w-2 bg-conzia-muted/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="w-full max-w-sm space-y-6 z-10">
        <Button
          variant="primary"
          className="w-full py-5 bg-camel hover:bg-camel/90 text-white font-bold rounded-2xl shadow-lg shadow-camel/20 transition-all active:scale-[0.98] text-lg"
          onClick={nextSlide}
        >
          {currentSlide === slides.length - 1 ? "Comenzar mi viaje" : "Siguiente"}
        </Button>
        
        <div className="text-center">
          <p className="text-conzia-gray/50 text-sm font-medium">
            ¿Ya tienes una cuenta?{" "}
            <button 
              onClick={() => navigate("/login")}
              className="text-conzia-dark hover:text-camel font-bold transition-colors"
            >
              Inicia sesión
            </button>
          </p>
        </div>

        <div className="pt-4 text-center">
          <p className="text-conzia-muted/40 text-[10px] tracking-[0.3em] uppercase font-bold">
            AI Cognitive Shadow Work · 2026
          </p>
        </div>
      </div>
    </div>
  );
}
