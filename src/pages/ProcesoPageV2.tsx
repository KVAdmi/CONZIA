import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAuth } from "../state/authStore";
import { getUserProgramStatus } from "../services/engineServiceHelpers";
import { Calendar, TrendingUp, Target } from "lucide-react";

export default function ProcesoPageV2() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [programStatus, setProgramStatus] = useState<any>(null);

  useEffect(() => {
    async function loadStatus() {
      if (!session?.user?.id || !session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        const status = await getUserProgramStatus(session.user.id, session.access_token);
        setProgramStatus(status);
      } catch (error) {
        console.error("Error loading status:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStatus();
  }, [session]);

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
          <p className="text-white/80 mb-6">Inicia sesión para ver tu progreso</p>
          <Button onClick={() => navigate("/login")}>Iniciar sesión</Button>
        </div>
      </div>
    );
  }

  const daysInProgram = programStatus?.days_in_program || 0;
  const currentMonth = programStatus?.current_month || 1;
  const daysRemaining = 90 - daysInProgram;
  const progress = (daysInProgram / 90) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Tu Proceso de 90 Días</h1>
          <p className="text-white/70">Seguimiento de tu transformación</p>
        </div>

        {/* Progreso general */}
        <Card className="p-6 bg-white/10 border-white/20 backdrop-blur-md mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-[#DDB273]" />
            <h2 className="text-xl font-semibold text-white">Progreso General</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-white/70 mb-2">
                <span>Día {daysInProgram} de 90</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div 
                  className="bg-[#DDB273] h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-white/60 text-sm mb-1">Días completados</div>
                <div className="text-3xl font-bold text-white">{daysInProgram}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-white/60 text-sm mb-1">Días restantes</div>
                <div className="text-3xl font-bold text-white">{daysRemaining}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Mes actual */}
        <Card className="p-6 bg-white/10 border-white/20 backdrop-blur-md mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-[#DDB273]" />
            <h2 className="text-xl font-semibold text-white">Mes Actual</h2>
          </div>

          <div className="space-y-3">
            <div className="text-4xl font-bold text-[#DDB273]">
              Mes {currentMonth}
            </div>
            <div className="text-lg text-white">
              {currentMonth === 1 && "Catarsis — Suelta lo que cargas"}
              {currentMonth === 2 && "Elucidación — Entiende tus patrones"}
              {currentMonth === 3 && "Integración — Actúa desde tu verdad"}
            </div>
            <p className="text-white/70 text-sm">
              {currentMonth === 1 && "En este mes, te enfocas en soltar las emociones reprimidas y reconocer lo que has estado cargando."}
              {currentMonth === 2 && "En este mes, profundizas en tus patrones de comportamiento y entiendes de dónde vienen."}
              {currentMonth === 3 && "En este mes, integras todo lo aprendido y empiezas a actuar desde tu verdad."}
            </p>
          </div>
        </Card>

        {/* Siguiente paso */}
        <Card className="p-6 bg-white/10 border-white/20 backdrop-blur-md mb-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-[#DDB273]" />
            <h2 className="text-xl font-semibold text-white">Siguiente Paso</h2>
          </div>

          <p className="text-white/90 mb-4">
            Continúa tu trabajo diario con las herramientas disponibles:
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => navigate("/desahogo")}
              className="w-full justify-start bg-white/5 hover:bg-white/10 text-white"
            >
              📝 Desahogo — Suelta lo que sientes
            </Button>
            <Button
              onClick={() => navigate("/suenos")}
              className="w-full justify-start bg-white/5 hover:bg-white/10 text-white"
            >
              🌙 Sueños — Interpreta tus mensajes inconscientes
            </Button>
            <Button
              onClick={() => navigate("/consultorio")}
              className="w-full justify-start bg-white/5 hover:bg-white/10 text-white"
            >
              💬 Consultorio — Diálogo guiado
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full justify-start bg-white/5 hover:bg-white/10 text-white"
            >
              📊 Dashboard — Ve tu progreso
            </Button>
          </div>
        </Card>

        {/* Botón volver */}
        <Button
          onClick={() => navigate("/")}
          variant="secondary"
          className="w-full"
        >
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
