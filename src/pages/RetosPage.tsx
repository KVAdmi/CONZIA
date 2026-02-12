import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { supabase } from "../services/supabase/config";
import { 
  generateAndSaveChallenge,
  validateChallengeCompletion 
} from "../services/engineService";
import Button from "../components/ui/Button";
import Textarea from "../components/ui/Textarea";

interface Challenge {
  id: string;
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
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [reflection, setReflection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  useEffect(() => {
    loadChallenges();
  }, []);

  async function loadChallenges() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/acceso");
        return;
      }

      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error("Error loading challenges:", error);
    } finally {
      setLoading(false);
    }
  }

  async function generateNewChallenge() {
    try {
      setGenerating(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const challenge = await generateAndSaveChallenge(
        session.user.id,
        session.access_token
      );

      setChallenges([challenge, ...challenges]);
    } catch (error) {
      console.error("Error generating challenge:", error);
      alert("Error al generar reto. Intenta de nuevo.");
    } finally {
      setGenerating(false);
    }
  }

  async function submitReflection() {
    if (!activeChallenge || !reflection.trim()) return;

    try {
      setSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const result = await validateChallengeCompletion(
        activeChallenge.id,
        reflection,
        session.access_token
      );

      setValidationResult(result);

      if (result.is_valid) {
        // Actualizar challenge en la lista
        setChallenges(challenges.map(c => 
          c.id === activeChallenge.id 
            ? { ...c, status: 'completed', user_reflection: reflection, completed_at: new Date().toISOString() }
            : c
        ));
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          setActiveChallenge(null);
          setReflection("");
          setValidationResult(null);
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting reflection:", error);
      alert("Error al enviar reflexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center px-6 pb-10 pt-12">
        <div className="text-white/75">Cargando tus retos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-12">
      {/* Header */}
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/12"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Dashboard
      </button>

      <div className="mt-6 mb-6">
        <h1 className="text-3xl font-bold text-white">Tus Retos</h1>
        <p className="mt-2 text-sm text-white/65">
          Desafíos personalizados para fortalecer tu arquetipo en sombra
        </p>
      </div>

      {/* Generate Button */}
      {activeChallenges.length === 0 && (
        <div className="mb-6">
          <Button
            variant="primary"
            onClick={generateNewChallenge}
            disabled={generating}
            type="button"
          >
            {generating ? "Generando reto..." : "Generar Nuevo Reto"}
          </Button>
        </div>
      )}

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div className="mb-6">
          <div className="text-[11px] tracking-[0.18em] text-white/55 mb-4">RETOS ACTIVOS</div>
          {activeChallenges.map((challenge) => (
            <div
              key={challenge.id}
              className="mb-4 rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-[#DDB273]" />
                <div className="text-xs text-white/65 capitalize">
                  {challenge.shadow_archetype} • {challenge.difficulty}
                </div>
              </div>
              <div className="text-sm text-white/85 whitespace-pre-line mb-4">
                {challenge.challenge_text}
              </div>
              <div className="text-xs text-white/55 mb-4">
                {challenge.reflection_prompt}
              </div>
              <Button
                variant="primary"
                onClick={() => setActiveChallenge(challenge)}
                type="button"
                className="w-full"
              >
                Completar Reto
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div className="mb-6">
          <div className="text-[11px] tracking-[0.18em] text-white/55 mb-4">RETOS COMPLETADOS</div>
          {completedChallenges.map((challenge) => (
            <div
              key={challenge.id}
              className="mb-4 rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)] opacity-75"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <div className="text-xs text-white/65 capitalize">
                  {challenge.shadow_archetype} • Completado
                </div>
              </div>
              <div className="text-sm text-white/85 whitespace-pre-line mb-4">
                {challenge.challenge_text}
              </div>
              {challenge.user_reflection && (
                <div className="rounded-2xl bg-white/6 ring-1 ring-white/10 px-4 py-3">
                  <div className="text-xs text-white/55 mb-2">Tu reflexión:</div>
                  <div className="text-sm text-white/75 whitespace-pre-line">
                    {challenge.user_reflection}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reflection Modal */}
      {activeChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6">
          <div className="w-full max-w-md rounded-[34px] bg-[#0b1220]/95 ring-1 ring-white/10 backdrop-blur-xl px-6 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
            <div className="text-[11px] tracking-[0.18em] text-white/55">COMPLETAR RETO</div>
            <div className="mt-3 text-xl font-semibold text-white">
              Reflexiona sobre tu experiencia
            </div>
            <div className="mt-4 text-sm text-white/65">
              {activeChallenge.reflection_prompt}
            </div>
            
            <div className="mt-6">
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Escribe tu reflexión aquí (mínimo 50 caracteres)..."
                rows={6}
                disabled={submitting}
              />
            </div>

            {validationResult && !validationResult.is_valid && (
              <div className="mt-4 rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 px-4 py-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <div className="text-xs text-red-400">{validationResult.reason}</div>
                </div>
              </div>
            )}

            {validationResult && validationResult.is_valid && (
              <div className="mt-4 rounded-2xl bg-green-500/10 ring-1 ring-green-500/20 px-4 py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <div className="text-xs text-green-400">
                    ¡Reto completado! +{validationResult.score_impact} puntos en {activeChallenge.shadow_archetype}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setActiveChallenge(null);
                  setReflection("");
                  setValidationResult(null);
                }}
                className="flex-1 rounded-[24px] bg-white/10 ring-1 ring-white/10 backdrop-blur-md px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/15"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                onClick={submitReflection}
                className="flex-1 rounded-[24px] bg-[#DDB273] px-6 py-3 text-center text-sm font-semibold text-[#1E2A38] transition hover:bg-[#DDB273]/90 disabled:opacity-50"
                disabled={submitting || reflection.trim().length < 50}
              >
                {submitting ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
