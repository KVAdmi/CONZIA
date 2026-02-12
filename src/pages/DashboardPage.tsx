import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConzia } from "../state/conziaStore";
import { 
  getLatestArchetypeMetrics,
  getLatestResistanceMetrics,
  getUserProgramStatus 
} from "../services/engineServiceHelpers";
import { useAuth } from "../state/authStore";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

interface ArchetypeMetrics {
  guerrero: number;
  rey: number;
  amante: number;
  mago: number;
  dominant_archetype: string;
  shadow_archetype: string;
  balance_index: number;
}

interface ResistanceMetrics {
  resistance_index: number;
  resistance_level: string;
}

interface ProgramStatus {
  program_start_date: string;
  current_month: number;
  days_in_program: number;
  total_entries: number;
  completed_challenges: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { state } = useConzia();
  const [archetypeMetrics, setArchetypeMetrics] = useState<ArchetypeMetrics | null>(null);
  const [resistanceMetrics, setResistanceMetrics] = useState<ResistanceMetrics | null>(null);
  const [programStatus, setProgramStatus] = useState<ProgramStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const { session } = useAuth();

  async function loadDashboardData() {
    try {
      if (!session?.user?.id || !session?.access_token) {
        navigate("/login");
        return;
      }

      const userId = session.user.id;
      const accessToken = session.access_token;

      // Cargar métricas de arquetipos
      const archetypes = await getLatestArchetypeMetrics(userId, accessToken);
      setArchetypeMetrics(archetypes);

      // Cargar métricas de resistencia
      const resistance = await getLatestResistanceMetrics(userId, accessToken);
      setResistanceMetrics(resistance);

      // Cargar estado del programa
      const status = await getUserProgramStatus(userId, accessToken);
      if (status) {
        // Agregar campos faltantes con valores por defecto
        setProgramStatus({
          ...status,
          total_entries: 0, // TODO: Obtener de la base de datos
          completed_challenges: 0, // TODO: Obtener de la base de datos
        });
      }

    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center px-6 pb-10 pt-12">
        <div className="text-white/75">Cargando tu dashboard...</div>
      </div>
    );
  }

  const radarData = archetypeMetrics ? [
    { archetype: 'Guerrero', value: archetypeMetrics.guerrero },
    { archetype: 'Rey', value: archetypeMetrics.rey },
    { archetype: 'Amante', value: archetypeMetrics.amante },
    { archetype: 'Mago', value: archetypeMetrics.mago },
  ] : [];

  const getResistanceColor = (level: string) => {
    switch (level) {
      case 'Mínima': return 'text-green-400';
      case 'Baja': return 'text-blue-400';
      case 'Moderada': return 'text-yellow-400';
      case 'Alta': return 'text-orange-400';
      case 'Crítica': return 'text-red-400';
      default: return 'text-white/75';
    }
  };

  const getResistanceIcon = (level: string) => {
    if (level === 'Mínima' || level === 'Baja') return <CheckCircle className="h-5 w-5" />;
    if (level === 'Moderada') return <Activity className="h-5 w-5" />;
    return <AlertTriangle className="h-5 w-5" />;
  };

  const monthPhase = programStatus?.current_month === 1 ? 'Catarsis' 
    : programStatus?.current_month === 2 ? 'Elucidación' 
    : 'Integración';

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-sm text-white/65">
          Tu viaje de transformación en tiempo real
        </p>
      </div>

      {/* Program Status */}
      {programStatus && (
        <div className="mb-6 rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
          <div className="text-[11px] tracking-[0.18em] text-white/55">PROGRESO DEL PROGRAMA</div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-white">{programStatus.days_in_program}/90</div>
              <div className="text-xs text-white/65">Días completados</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#DDB273]">{monthPhase}</div>
              <div className="text-xs text-white/65">Mes {programStatus.current_month}</div>
            </div>
          </div>
          <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#DDB273] to-[#F4F6F8] transition-all duration-500"
              style={{ width: `${(programStatus.days_in_program / 90) * 100}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-white/65">
            <div>
              <span className="font-semibold text-white">{programStatus.total_entries}</span> entradas
            </div>
            <div>
              <span className="font-semibold text-white">{programStatus.completed_challenges}</span> retos completados
            </div>
          </div>
        </div>
      )}

      {/* Archetype Radar */}
      {archetypeMetrics && (
        <div className="mb-6 rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
          <div className="text-[11px] tracking-[0.18em] text-white/55">TUS ARQUETIPOS</div>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#ffffff20" />
                <PolarAngleAxis 
                  dataKey="archetype" 
                  tick={{ fill: '#ffffff99', fontSize: 12 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]}
                  tick={{ fill: '#ffffff66', fontSize: 10 }}
                />
                <Radar 
                  name="Score" 
                  dataKey="value" 
                  stroke="#DDB273" 
                  fill="#DDB273" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/6 ring-1 ring-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <div className="text-xs text-white/65">Dominante</div>
              </div>
              <div className="mt-2 text-lg font-semibold text-white capitalize">
                {archetypeMetrics.dominant_archetype}
              </div>
            </div>
            <div className="rounded-2xl bg-white/6 ring-1 ring-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-orange-400" />
                <div className="text-xs text-white/65">En Sombra</div>
              </div>
              <div className="mt-2 text-lg font-semibold text-white capitalize">
                {archetypeMetrics.shadow_archetype}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-white/6 ring-1 ring-white/10 px-4 py-3">
            <div className="text-xs text-white/65">Índice de Balance</div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl font-bold text-white">{archetypeMetrics.balance_index}</div>
              <div className="text-xs text-white/55">/100</div>
            </div>
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#DDB273] to-[#F4F6F8] transition-all duration-500"
                style={{ width: `${archetypeMetrics.balance_index}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Resistance Metrics */}
      {resistanceMetrics && (
        <div className="mb-6 rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
          <div className="text-[11px] tracking-[0.18em] text-white/55">RESISTENCIA ACTUAL</div>
          <div className="mt-4 flex items-center gap-4">
            <div className={`${getResistanceColor(resistanceMetrics.resistance_level)}`}>
              {getResistanceIcon(resistanceMetrics.resistance_level)}
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{resistanceMetrics.resistance_index}</div>
              <div className={`text-sm ${getResistanceColor(resistanceMetrics.resistance_level)}`}>
                {resistanceMetrics.resistance_level}
              </div>
            </div>
          </div>
          <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                resistanceMetrics.resistance_level === 'Crítica' || resistanceMetrics.resistance_level === 'Alta'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500'
                  : resistanceMetrics.resistance_level === 'Moderada'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  : 'bg-gradient-to-r from-green-500 to-blue-500'
              }`}
              style={{ width: `${resistanceMetrics.resistance_index}%` }}
            />
          </div>
          {resistanceMetrics.resistance_level === 'Alta' || resistanceMetrics.resistance_level === 'Crítica' ? (
            <div className="mt-4 rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 px-4 py-3">
              <div className="text-xs text-red-400">
                Tu resistencia está alta. Considera hablar con el equipo de apoyo humano.
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/desahogo")}
          className="rounded-[24px] bg-[#DDB273] px-6 py-4 text-center text-sm font-semibold text-[#1E2A38] transition hover:bg-[#DDB273]/90"
        >
          Nueva Entrada
        </button>
        <button
          onClick={() => navigate("/retos")}
          className="rounded-[24px] bg-white/10 ring-1 ring-white/10 backdrop-blur-md px-6 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/15"
        >
          Ver Retos
        </button>
      </div>
    </div>
  );
}
