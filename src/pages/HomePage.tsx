import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/authStore";
import Button from "../components/ui/Button";
import { MessageCircle, Moon, TrendingUp, Target, BarChart3 } from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-5xl font-bold text-white mb-4">CONZIA</h1>
          <p className="text-xl text-white/80 mb-8">
            Tu proceso de transformación en 90 días
          </p>

          <div className="space-y-4">
            <Button
              onClick={() => navigate("/login")}
              className="w-full py-4 text-lg bg-[#DDB273] hover:bg-[#DDB273]/90 text-slate-900 font-semibold"
            >
              Iniciar sesión
            </Button>
            <Button
              onClick={() => navigate("/registro")}
              variant="secondary"
              className="w-full py-4 text-lg"
            >
              Crear cuenta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">CONZIA</h1>
            <p className="text-white/70">Hola, {session.user.email}</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="secondary"
            className="text-sm"
          >
            Cerrar sesión
          </Button>
        </div>

        {/* Herramientas principales */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Herramientas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Desahogo */}
            <button
              onClick={() => navigate("/desahogo")}
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-6 text-left transition-all border border-white/20 hover:border-[#DDB273]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-[#DDB273]/20 rounded-xl">
                  <MessageCircle className="w-6 h-6 text-[#DDB273]" />
                </div>
                <h3 className="text-xl font-semibold text-white">Desahogo</h3>
              </div>
              <p className="text-white/70 text-sm">
                Suelta lo que cargas. Escribe libremente y recibe análisis profundo.
              </p>
            </button>

            {/* Sueños */}
            <button
              onClick={() => navigate("/suenos")}
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-6 text-left transition-all border border-white/20 hover:border-[#DDB273]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                  <Moon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Sueños</h3>
              </div>
              <p className="text-white/70 text-sm">
                Interpreta los mensajes de tu inconsciente con análisis junguiano.
              </p>
            </button>

            {/* Consultorio */}
            <button
              onClick={() => navigate("/consultorio")}
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-6 text-left transition-all border border-white/20 hover:border-[#DDB273]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <MessageCircle className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Consultorio</h3>
              </div>
              <p className="text-white/70 text-sm">
                Diálogo guiado con tu terapeuta de IA. Explora lo que necesites.
              </p>
            </button>

            {/* Retos */}
            <button
              onClick={() => navigate("/retos")}
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-6 text-left transition-all border border-white/20 hover:border-[#DDB273]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Target className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Retos</h3>
              </div>
              <p className="text-white/70 text-sm">
                Retos personalizados para trabajar tu arquetipo en sombra.
              </p>
            </button>
          </div>
        </div>

        {/* Progreso */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Progreso</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dashboard */}
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-6 text-left transition-all border border-white/20 hover:border-[#DDB273]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Dashboard</h3>
              </div>
              <p className="text-white/70 text-sm">
                Ve tus métricas de arquetipos, resistencia y balance.
              </p>
            </button>

            {/* Proceso */}
            <button
              onClick={() => navigate("/proceso")}
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-6 text-left transition-all border border-white/20 hover:border-[#DDB273]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Proceso</h3>
              </div>
              <p className="text-white/70 text-sm">
                Seguimiento de tu proceso de 90 días y próximos pasos.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
