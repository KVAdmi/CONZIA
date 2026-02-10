import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConzia } from "../state/conziaStore";
import { createId } from "../utils/id";
import Button from "../components/ui/Button";
import Textarea from "../components/ui/Textarea";
import Card from "../components/ui/Card";
import { Sparkles, Image as ImageIcon, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SuenosPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useConzia();
  const [dreamText, setDreamText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dreamResult, setDreamResult] = useState<{
    interpretation: string;
    imageUrl?: string;
    symbols: string[];
  } | null>(null);

  async function handleAnalyzeDream() {
    if (dreamText.length < 20) return;
    setIsAnalyzing(true);

    try {
      // 1. Llamada a la IA para interpretación y generación de prompt visual
      const resp = await fetch("/api/ai/dream-analysis", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          text: dreamText,
          user_id: state.profile?.alias 
        }),
      });

      const json = await resp.json();
      if (json.ok) {
        setDreamResult({
          interpretation: json.analysis.interpretation,
          imageUrl: json.analysis.imageUrl,
          symbols: json.analysis.symbols
        });

        // Guardar en el historial de lecturas
        dispatch({
          type: "add_reading",
          reading: {
            id: createId("r"),
            date: new Date().toISOString(),
            type: "reflejo",
            content: {
              contencion: "Has traído un mensaje del inconsciente.",
              loQueVeo: json.analysis.interpretation,
              loQueEvitas: "El símbolo principal de este sueño es " + json.analysis.symbols[0],
              pregunta: "¿Cómo se siente esta imagen en tu cuerpo ahora mismo?"
            }
          }
        });
      }
    } catch (err) {
      console.error("Error analizando sueño:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="min-h-[100svh] bg-[#0b1220] px-6 py-12 text-white overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-white/10 rounded-2xl">
          <Moon className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">El Oráculo de Morfeo</h1>
          <p className="text-xs text-white/50">Traduce los símbolos de tu inconsciente</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!dreamResult ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-xl">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 block">
                Describe tu sueño con el mayor detalle posible
              </label>
              <Textarea
                value={dreamText}
                onChange={(e) => setDreamText(e.target.value)}
                placeholder="Había un bosque oscuro, y de pronto aparecía una sombra que..."
                className="min-h-[200px] bg-transparent border-none text-lg placeholder:text-white/20 focus:ring-0 p-0"
              />
            </Card>

            <Button
              variant="primary"
              onClick={handleAnalyzeDream}
              disabled={dreamText.length < 20 || isAnalyzing}
              className="w-full py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                "Invocando al Inconsciente..."
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Interpretar y Visualizar
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {dreamResult.imageUrl && (
              <div className="relative aspect-square rounded-[34px] overflow-hidden ring-1 ring-white/20 shadow-2xl">
                <img 
                  src={dreamResult.imageUrl} 
                  alt="Visualización del sueño" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex gap-2 flex-wrap">
                    {dreamResult.symbols.map(s => (
                      <span key={s} className="text-[10px] px-2 py-1 bg-white/20 backdrop-blur-md rounded-full uppercase tracking-widest">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Card className="p-6 bg-white/10 border-white/20 backdrop-blur-2xl">
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Interpretación Analítica</h3>
              <p className="text-lg leading-relaxed italic text-white/90">
                "{dreamResult.interpretation}"
              </p>
            </Card>

            <div className="flex gap-3">
              <Button 
                className="flex-1 py-4 rounded-2xl bg-white/5 border-white/10"
                onClick={() => {
                  setDreamResult(null);
                  setDreamText("");
                }}
              >
                Nuevo Sueño
              </Button>
              <Button 
                variant="primary"
                className="flex-1 py-4 rounded-2xl"
                onClick={() => navigate("/sesion")}
              >
                Volver al Inicio
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
