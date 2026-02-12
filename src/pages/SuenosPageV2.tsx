import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/authStore";
import Button from "../components/ui/Button";
import Textarea from "../components/ui/Textarea";
import Card from "../components/ui/Card";
import { Sparkles, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SuenosPageV2() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [dreamText, setDreamText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dreamResult, setDreamResult] = useState<{
    interpretation: string;
    symbols: string[];
    archetype: string;
  } | null>(null);

  async function handleAnalyzeDream() {
    if (dreamText.length < 20) return;
    setIsAnalyzing(true);

    try {
      // Llamar a Claude para interpretar el sueño
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: `Eres un analista junguiano experto en interpretación de sueños. 
              
Tu trabajo es:
1. Identificar los símbolos principales del sueño
2. Interpretar el sueño desde la psicología analítica
3. Conectar con arquetipos (Guerrero, Rey, Amante, Mago)
4. Dar una interpretación profunda pero clara

Responde en formato JSON:
{
  "symbols": ["símbolo1", "símbolo2", "símbolo3"],
  "interpretation": "Interpretación profunda del sueño (2-3 párrafos)",
  "archetype": "Arquetipo dominante (guerrero/rey/amante/mago)"
}`
            },
            {
              role: "user",
              content: `Interpreta este sueño:\n\n${dreamText}`
            }
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);

      setDreamResult({
        interpretation: parsed.interpretation,
        symbols: parsed.symbols || [],
        archetype: parsed.archetype || "mago",
      });
    } catch (err) {
      console.error("Error analizando sueño:", err);
      alert("Error al analizar el sueño. Intenta de nuevo.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Sesión requerida</h2>
          <p className="text-white/80 mb-6">Inicia sesión para interpretar tus sueños</p>
          <Button onClick={() => navigate("/login")}>Iniciar sesión</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-6 py-12 text-white overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-white/10 rounded-2xl">
            <Moon className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">El Oráculo de Morfeo</h1>
            <p className="text-sm text-white/50">Traduce los símbolos de tu inconsciente</p>
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
              <Card className="p-6 bg-white/10 border-white/20 backdrop-blur-xl">
                <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4 block">
                  Describe tu sueño con el mayor detalle posible
                </label>
                <Textarea
                  value={dreamText}
                  onChange={(e) => setDreamText(e.target.value)}
                  placeholder="Soñé que corría en un bosque oscuro, y que en el piso había muchos gusanos como de basura..."
                  className="min-h-[200px] bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#DDB273] p-4 rounded-xl"
                  rows={10}
                />
              </Card>

              <Button
                onClick={handleAnalyzeDream}
                disabled={dreamText.length < 20 || isAnalyzing}
                className="w-full py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2 bg-[#DDB273] hover:bg-[#DDB273]/90 text-slate-900 font-semibold"
              >
                {isAnalyzing ? (
                  "Invocando al Inconsciente..."
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Interpretar Sueño
                  </>
                )}
              </Button>

              <Button
                onClick={() => navigate("/")}
                variant="secondary"
                className="w-full"
              >
                Volver
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Símbolos detectados */}
              <Card className="p-6 bg-white/10 border-white/20 backdrop-blur-2xl">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">
                  Símbolos detectados
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {dreamResult.symbols.map((s, i) => (
                    <span 
                      key={i} 
                      className="text-sm px-3 py-1.5 bg-[#DDB273]/20 text-[#DDB273] backdrop-blur-md rounded-full font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Card>

              {/* Arquetipo */}
              <Card className="p-6 bg-white/10 border-white/20 backdrop-blur-2xl">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">
                  Arquetipo dominante
                </h3>
                <div className="text-2xl font-bold text-[#DDB273] capitalize">
                  {dreamResult.archetype === "guerrero" && "⚔️ Guerrero"}
                  {dreamResult.archetype === "rey" && "👑 Rey"}
                  {dreamResult.archetype === "amante" && "❤️ Amante"}
                  {dreamResult.archetype === "mago" && "🔮 Mago"}
                </div>
              </Card>

              {/* Interpretación */}
              <Card className="p-6 bg-white/10 border-white/20 backdrop-blur-2xl">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">
                  Interpretación Analítica
                </h3>
                <p className="text-lg leading-relaxed text-white/90 whitespace-pre-wrap">
                  {dreamResult.interpretation}
                </p>
              </Card>

              {/* Botones */}
              <div className="flex gap-3">
                <Button 
                  className="flex-1 py-4 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10"
                  onClick={() => {
                    setDreamResult(null);
                    setDreamText("");
                  }}
                >
                  Nuevo Sueño
                </Button>
                <Button 
                  className="flex-1 py-4 rounded-2xl bg-[#DDB273] hover:bg-[#DDB273]/90 text-slate-900 font-semibold"
                  onClick={() => navigate("/")}
                >
                  Volver al Inicio
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
