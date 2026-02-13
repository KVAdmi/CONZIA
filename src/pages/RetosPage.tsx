import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { select, insert, update } from "../services/supabase/client";
import { useAuth } from "../state/authStore";
import { generateChallenge } from "../services/engineService";
import type { ConziaArchetype } from "../types/models";
import Button from "../components/ui/Button";
import Textarea from "../components/ui/Textarea";

interface Challenge {
  id: string;
  profile_id: string;
  shadow_archetype: string;
  difficulty: string;
  challenge_text: string;
  reflection_prompt: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  user_reflection: string | null;
}

export default function RetosPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [reflection, setReflection] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadChallenges();
  }, []);

  async function loadChallenges() {
    if (!session) {
      navigate("/acceso");
      return;
    }

    try {
      const result = await select<Challenge>("challenges", {
        eq: { profile_id: session.user.id },
        order: { column: "created_at", ascending: false },
        accessToken: session.access_token,
      });

      if (result.ok) {
        setChallenges(result.data);
      }
    } catch (error) {
      console.error("Error loading challenges:", error);
    } finally {
      setLoading(false);
    }
  }

  async function generateNewChallenge() {
    if (!session) return;

    try {
      setGenerating(true);

      // Generar reto usando el motor
      // TODO: Obtener arquetipo en sombra y tema dominante reales
      const shadowArchetype = "guerrero"; // Placeholder
      const dominantTheme = "miedo al fracaso"; // Placeholder
      
      const generatedChallenge = generateChallenge(
        shadowArchetype as ConziaArchetype,
        dominantTheme,
        1, // Mes 1 (Catarsis) por defecto
        50 // Resistencia media por defecto
      );

      if (!generatedChallenge) {
        throw new Error("No se pudo generar el reto");
      }

      // Guardar en base de datos
      const challengeData = {
        profile_id: session.user.id,
        shadow_archetype: generatedChallenge.shadow_archetype,
        difficulty: generatedChallenge.difficulty,
        challenge_text: generatedChallenge.challenge_text,
        reflection_prompt: "¿Cómo te sentiste al completar este reto? ¿Qué aprendiste sobre ti?",
        status: "active",
        created_at: new Date().toISOString(),
      };

      const result = await insert<Challenge>("challenges", challengeData, {
        accessToken: session.access_token,
      });

      if (result.ok && result.data.length > 0) {
        setChallenges([result.data[0], ...challenges]);
      }
    } catch (error) {
      console.error("Error generating challenge:", error);
      alert("Error al generar reto. Intenta de nuevo.");
    } finally {
      setGenerating(false);
    }
  }

  async function submitReflection(challengeId: string) {
    if (!session || !reflection.trim()) return;

    try {
      setSubmitting(true);

      // Actualizar reto con reflexión
      const updateData = {
        user_reflection: reflection,
        status: "completed",
        completed_at: new Date().toISOString(),
      };

      // TODO: Implementar update en client.ts
      console.log("Updating challenge:", challengeId, updateData);

      // Recargar retos
      await loadChallenges();
      setActiveChallenge(null);
      setReflection("");
    } catch (error) {
      console.error("Error submitting reflection:", error);
      alert("Error al enviar reflexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E2A38] flex items-center justify-center">
        <div className="text-[#DDB273] text-xl">Cargando retos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E2A38] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[#DDB273] hover:text-[#DDB273]/80 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Volver</span>
          </button>
          <h1 className="text-3xl font-bold text-[#DDB273]">Retos de Transformación</h1>
          <div className="w-20"></div>
        </div>

        {/* Generar nuevo reto */}
        <div className="bg-[#2A3A4A]/50 backdrop-blur-sm border border-[#DDB273]/20 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[#DDB273] mb-4">Generar Nuevo Reto</h2>
          <p className="text-[#F4F6F8]/80 mb-4">
            Los retos están diseñados para fortalecer tu arquetipo en sombra y ayudarte a integrar aspectos ocultos de tu personalidad.
          </p>
          <Button
            onClick={generateNewChallenge}
            disabled={generating}
            className="bg-[#DDB273] text-[#1E2A38] hover:bg-[#DDB273]/80"
          >
            {generating ? "Generando..." : "Generar Reto Personalizado"}
          </Button>
        </div>

        {/* Lista de retos */}
        <div className="space-y-4">
          {challenges.length === 0 ? (
            <div className="bg-[#2A3A4A]/50 backdrop-blur-sm border border-[#DDB273]/20 rounded-lg p-8 text-center">
              <p className="text-[#F4F6F8]/60">No tienes retos aún. Genera tu primer reto personalizado.</p>
            </div>
          ) : (
            challenges.map((challenge) => (
              <div
                key={challenge.id}
                className="bg-[#2A3A4A]/50 backdrop-blur-sm border border-[#DDB273]/20 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {challenge.status === "completed" ? (
                      <CheckCircle className="text-green-400" size={24} />
                    ) : challenge.status === "active" ? (
                      <Clock className="text-[#DDB273]" size={24} />
                    ) : (
                      <AlertCircle className="text-orange-400" size={24} />
                    )}
                    <span className="text-[#DDB273] font-bold">
                      Arquetipo: {challenge.shadow_archetype}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    challenge.status === "completed"
                      ? "bg-green-500/20 text-green-400"
                      : challenge.status === "active"
                      ? "bg-[#DDB273]/20 text-[#DDB273]"
                      : "bg-orange-500/20 text-orange-400"
                  }`}>
                    {challenge.status === "completed" ? "Completado" : challenge.status === "active" ? "Activo" : "Pendiente"}
                  </span>
                </div>

                <p className="text-[#F4F6F8] mb-4">{challenge.challenge_text}</p>

                {challenge.status === "active" && !activeChallenge && (
                  <Button
                    onClick={() => setActiveChallenge(challenge)}
                    className="bg-[#DDB273] text-[#1E2A38] hover:bg-[#DDB273]/80"
                  >
                    Completar Reto
                  </Button>
                )}

                {activeChallenge?.id === challenge.id && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-[#DDB273] mb-2">
                        {challenge.reflection_prompt}
                      </label>
                      <Textarea
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                        placeholder="Escribe tu reflexión aquí..."
                        rows={6}
                        className="w-full bg-[#1E2A38] border-[#DDB273]/20 text-[#F4F6F8]"
                      />
                    </div>
                    <div className="flex gap-4">
                      <Button
                        onClick={() => submitReflection(challenge.id)}
                        disabled={submitting || !reflection.trim()}
                        className="bg-[#DDB273] text-[#1E2A38] hover:bg-[#DDB273]/80"
                      >
                        {submitting ? "Enviando..." : "Enviar Reflexión"}
                      </Button>
                      <Button
                        onClick={() => {
                          setActiveChallenge(null);
                          setReflection("");
                        }}
                        className="bg-[#2A3A4A] text-[#F4F6F8] hover:bg-[#2A3A4A]/80"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {challenge.status === "completed" && challenge.user_reflection && (
                  <div className="mt-4 p-4 bg-[#1E2A38] border border-[#DDB273]/20 rounded-lg">
                    <p className="text-[#DDB273] font-bold mb-2">Tu Reflexión:</p>
                    <p className="text-[#F4F6F8]/80">{challenge.user_reflection}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
