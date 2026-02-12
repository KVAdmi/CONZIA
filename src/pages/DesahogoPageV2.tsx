import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Textarea from "../components/ui/Textarea";
import { useAuth } from "../state/authStore";
import { analyzeDesahogoV2 } from "../services/ai/analyzeDesahogoV2";
import { getUserProgramStatus, saveDesahogoEntry } from "../services/engineServiceHelpers";
import type { ConziaDesahogoAnalysis } from "../types/models";

export default function DesahogoPageV2() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ConziaDesahogoAnalysis | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(1);
  const [loading, setLoading] = useState(true);

  // Cargar estado del usuario
  useEffect(() => {
    async function loadUserStatus() {
      if (!session?.user?.id || !session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        const programStatus = await getUserProgramStatus(session.user.id, session.access_token);
        if (programStatus) {
          setCurrentMonth(programStatus.current_month);
        }
      } catch (error) {
        console.error("Error loading user status:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserStatus();
  }, [session]);

  async function entregar() {
    if (!session?.user?.id || !session?.access_token || aiBusy) return;
    
    const clean = text.trim();
    if (clean.length < 12) {
      setStatus("Escribe al menos una línea real. Una escena. Un pensamiento.");
      return;
    }

    setAiBusy(true);
    setStatus("Analizando tu desahogo...");
    setAnalysis(null);

    try {
      // Analizar con IA
      const analysis = await analyzeDesahogoV2({
        text: clean,
        userId: session.user.id,
        accessToken: session.access_token,
      });

      // Guardar en Supabase
      await saveDesahogoEntry(
        session.user.id,
        clean,
        analysis,
        session.access_token
      );

      setAnalysis(analysis);
      setText(""); // Limpiar textarea
      setStatus("✅ Desahogo guardado");
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Error:", error);
      setStatus("❌ Error al procesar. Intenta de nuevo.");
    } finally {
      setAiBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Sesión requerida</h2>
          <p className="text-white/80 mb-6">Inicia sesión para usar el desahogo</p>
          <Button onClick={() => navigate("/login")}>Iniciar sesión</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Desahogo</h1>
          <p className="text-white/70">
            {currentMonth === 1 && "Mes 1: Catarsis — Suelta lo que cargas"}
            {currentMonth === 2 && "Mes 2: Elucidación — Entiende tus patrones"}
            {currentMonth === 3 && "Mes 3: Integración — Actúa desde tu verdad"}
          </p>
        </div>

        {/* Sin análisis: Mostrar textarea */}
        {!analysis && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
            <label className="block text-white text-lg font-semibold mb-4">
              ¿Qué necesitas soltar hoy?
            </label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe lo que sientes, lo que te pesa, lo que no has dicho..."
              rows={8}
              disabled={aiBusy}
              className="w-full bg-white/5 text-white placeholder-white/40 border border-white/20 rounded-xl p-4"
            />
            
            {status && (
              <div className={`mt-4 p-3 rounded-lg ${
                status.includes("❌") ? "bg-red-500/20 text-red-200" : 
                status.includes("✅") ? "bg-green-500/20 text-green-200" : 
                "bg-blue-500/20 text-blue-200"
              }`}>
                {status}
              </div>
            )}

            <div className="mt-6 flex gap-4">
              <Button
                onClick={entregar}
                disabled={aiBusy || text.trim().length < 12}
                className="flex-1"
              >
                {aiBusy ? "Analizando..." : "Entregar"}
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="secondary"
                disabled={aiBusy}
              >
                Volver
              </Button>
            </div>
          </div>
        )}

        {/* Con análisis: Mostrar resultado */}
        {analysis && (
          <div className="space-y-6">
            {/* Emoción detectada */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-3">Emoción detectada</h3>
              <div className="inline-block bg-[#DDB273]/20 text-[#DDB273] px-4 py-2 rounded-lg text-lg font-medium">
                {analysis.emotion === "ira" && "🔥 Ira"}
                {analysis.emotion === "tristeza" && "😢 Tristeza"}
                {analysis.emotion === "miedo" && "😰 Miedo"}
                {analysis.emotion === "culpa" && "😔 Culpa"}
                {analysis.emotion === "ansiedad" && "😟 Ansiedad"}
                {analysis.emotion === "vergüenza" && "😳 Vergüenza"}
              </div>
            </div>

            {/* Reflexión */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-3">Reflexión</h3>
              <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                {analysis.reflection}
              </p>
            </div>

            {/* Patrón detectado */}
            {analysis.pattern_tag && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3">Patrón detectado</h3>
                <div className="inline-block bg-purple-500/20 text-purple-200 px-4 py-2 rounded-lg">
                  {analysis.pattern_tag}
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setAnalysis(null);
                  setText("");
                }}
                className="flex-1"
              >
                Nuevo desahogo
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="secondary"
              >
                Ver dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
