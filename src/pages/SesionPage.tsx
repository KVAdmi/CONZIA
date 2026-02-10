import { 
  Brain, 
  ChevronRight, 
  Activity, 
  Target, 
  Moon, 
  MessageSquare, 
  ShieldCheck,
  TrendingUp,
  Layout
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useConzia } from "../state/conziaStore";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function SesionPage() {
  const navigate = useNavigate();
  const { state } = useConzia();
  
  const month = state.profile?.current_month || 1;
  const phaseName = month === 1 ? "Catarsis" : month === 2 ? "Elucidación" : "Integración";
  
  const scores = state.profile?.radar_scores || { warrior: 50, lover: 50, king: 50, magician: 50 };

  return (
    <div className="min-h-[100svh] bg-[#0b1220] text-white px-6 pt-12 pb-32 overflow-y-auto">
      {/* Header Analítico */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-bold">Real-time Analytics</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xl font-semibold tracking-tight">AI Cognitive Shadow Work</span>
          </div>
        </div>
        <div className="bg-white/5 p-2 rounded-xl ring-1 ring-white/10">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
        </div>
      </div>

      {/* Gráfica Central (Simulada con CSS para coincidir con la imagen) */}
      <div className="relative flex justify-center items-center my-12">
        <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full" />
        <div className="relative w-64 h-64 rounded-full border border-white/10 flex items-center justify-center">
          {/* Círculos concéntricos */}
          <div className="absolute w-48 h-48 rounded-full border border-white/5" />
          <div className="absolute w-32 h-32 rounded-full border border-white/5" />
          
          {/* Icono Central */}
          <div className="z-10 flex flex-col items-center">
            <Brain className="w-12 h-12 text-white/80 mb-2" />
            <span className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-bold">AI Simulation</span>
          </div>

          {/* Indicadores de Arquetipos en los ejes */}
          <div className="absolute -top-6 text-[9px] font-bold text-white/30 uppercase tracking-widest">Rey</div>
          <div className="absolute -bottom-6 text-[9px] font-bold text-white/30 uppercase tracking-widest">Amante</div>
          <div className="absolute -left-10 text-[9px] font-bold text-white/30 uppercase tracking-widest">Guerrero</div>
          <div className="absolute -right-8 text-[9px] font-bold text-white/30 uppercase tracking-widest">Mago</div>
          
          {/* SVG para el Radar real */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 opacity-60">
            <circle
              cx="128"
              cy="128"
              r="100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="628"
              strokeDashoffset={628 - (628 * 0.75)}
              className="text-indigo-500/30"
            />
          </svg>
        </div>
      </div>

      {/* Grid de Módulos Terapéuticos */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <ModuleCard 
          icon={<MessageSquare className="w-5 h-5" />} 
          title="Desahogo" 
          subtitle="Catarsis Diaria"
          onClick={() => navigate("/desahogo")}
          color="bg-rose-500/10"
        />
        <ModuleCard 
          icon={<Moon className="w-5 h-5" />} 
          title="Sueños" 
          subtitle="Oráculo Morfeo"
          onClick={() => navigate("/suenos")}
          color="bg-indigo-500/10"
        />
        <ModuleCard 
          icon={<Activity className="w-5 h-5" />} 
          title="Análisis" 
          subtitle="Mapa de Sombra"
          onClick={() => navigate("/resultados")}
          color="bg-emerald-500/10"
        />
        <ModuleCard 
          icon={<Target className="w-5 h-5" />} 
          title="Retos" 
          subtitle="Integración"
          onClick={() => navigate("/proceso")}
          color="bg-amber-500/10"
        />
      </div>

      {/* Sección de Progreso de 3 Meses */}
      <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-xl mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Fase Actual: {phaseName}</h3>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md">Mes {month} de 3</span>
        </div>
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-500 h-full transition-all duration-1000" 
            style={{ width: `${(month / 3) * 100}%` }} 
          />
        </div>
        <p className="mt-4 text-sm text-white/60 leading-relaxed">
          Estás en la etapa de <strong>{phaseName}</strong>. Tu objetivo este mes es identificar los patrones que tu sombra utiliza para protegerte del cambio.
        </p>
      </Card>

      {/* CTA Principal */}
      <Button 
        variant="primary" 
        className="w-full py-5 rounded-[24px] shadow-2xl flex items-center justify-center gap-3 group"
        onClick={() => navigate("/desahogo")}
      >
        <span className="font-semibold tracking-wide">Iniciar Sesión Guiada</span>
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
}

function ModuleCard({ icon, title, subtitle, onClick, color }: any) {
  return (
    <motion.div 
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`p-5 rounded-[28px] border border-white/10 backdrop-blur-md cursor-pointer hover:bg-white/5 transition-colors ${color}`}
    >
      <div className="mb-3 text-white/80">{icon}</div>
      <h4 className="text-sm font-bold text-white tracking-tight">{title}</h4>
      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{subtitle}</p>
    </motion.div>
  );
}
