import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { select } from "../services/supabase/client";
import { useAuth } from "../state/authStore";
import { Users, AlertTriangle, TrendingUp, DollarSign, Activity } from "lucide-react";

interface AdminStats {
  total_users: number;
  active_users: number;
  total_revenue: number;
  active_alerts: number;
  avg_resistance: number;
}

interface Alert {
  id: string;
  profile_id: string;
  alert_type: string;
  priority: string;
  message: string;
  created_at: string;
  resolved_at: string | null;
  user_email?: string;
  user_name?: string;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      if (!session) {
        navigate("/acceso");
        return;
      }

      // Verificar si el usuario es admin
      const profileResult = await select<{ role: string }>("user_profiles", {
        select: "role",
        eq: { id: session.user.id },
        accessToken: session.access_token,
      });

      if (!profileResult.ok || profileResult.data.length === 0) {
        navigate("/");
        return;
      }

      const profile = profileResult.data[0];
      if (profile.role !== 'admin') {
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadDashboardData();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/");
    }
  }

  async function loadDashboardData() {
    if (!session) return;

    try {
      // Cargar estadísticas
      const usersResult = await select<{ id: string }>("user_profiles", {
        select: "id",
        accessToken: session.access_token,
      });

      const alertsResult = await select<Alert>("human_support_alerts", {
        select: "*",
        eq: { resolved_at: null },
        order: { column: "created_at", ascending: false },
        limit: 10,
        accessToken: session.access_token,
      });

      const resistanceResult = await select<{ resistance_index: number }>("resistance_metrics", {
        select: "resistance_index",
        accessToken: session.access_token,
      });

      if (usersResult.ok && alertsResult.ok && resistanceResult.ok) {
        const totalUsers = usersResult.data.length;
        const activeAlerts = alertsResult.data.length;
        const avgResistance = resistanceResult.data.length > 0
          ? resistanceResult.data.reduce((sum: number, r: { resistance_index: number }) => sum + r.resistance_index, 0) / resistanceResult.data.length
          : 0;

        setStats({
          total_users: totalUsers,
          active_users: totalUsers, // TODO: Calcular usuarios activos reales
          total_revenue: 0, // TODO: Obtener de billing
          active_alerts: activeAlerts,
          avg_resistance: Math.round(avgResistance),
        });

        setAlerts(alertsResult.data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function resolveAlert(alertId: string) {
    if (!session) return;

    try {
      // TODO: Implementar update en client.ts
      console.log("Resolving alert:", alertId);
      // Recargar datos
      await loadDashboardData();
    } catch (error) {
      console.error("Error resolving alert:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E2A38] flex items-center justify-center">
        <div className="text-[#DDB273] text-xl">Cargando panel de administración...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1E2A38] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#DDB273] mb-8">Panel de Administración</h1>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-[#2A3A4A]/50 backdrop-blur-sm border border-[#DDB273]/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#F4F6F8]/60 text-sm">Total Usuarios</p>
                  <p className="text-[#DDB273] text-2xl font-bold">{stats.total_users}</p>
                </div>
                <Users className="text-[#DDB273]" size={32} />
              </div>
            </div>

            <div className="bg-[#2A3A4A]/50 backdrop-blur-sm border border-[#DDB273]/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#F4F6F8]/60 text-sm">Usuarios Activos</p>
                  <p className="text-[#DDB273] text-2xl font-bold">{stats.active_users}</p>
                </div>
                <Activity className="text-[#DDB273]" size={32} />
              </div>
            </div>

            <div className="bg-[#2A3A4A]/50 backdrop-blur-sm border border-[#DDB273]/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#F4F6F8]/60 text-sm">Alertas Activas</p>
                  <p className="text-[#DDB273] text-2xl font-bold">{stats.active_alerts}</p>
                </div>
                <AlertTriangle className="text-[#DDB273]" size={32} />
              </div>
            </div>

            <div className="bg-[#2A3A4A]/50 backdrop-blur-sm border border-[#DDB273]/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#F4F6F8]/60 text-sm">Resistencia Promedio</p>
                  <p className="text-[#DDB273] text-2xl font-bold">{stats.avg_resistance}</p>
                </div>
                <TrendingUp className="text-[#DDB273]" size={32} />
              </div>
            </div>

            <div className="bg-[#2A3A4A]/50 backdrop-blur-sm border border-[#DDB273]/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#F4F6F8]/60 text-sm">Ingresos Totales</p>
                  <p className="text-[#DDB273] text-2xl font-bold">${stats.total_revenue}</p>
                </div>
                <DollarSign className="text-[#DDB273]" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Alertas */}
        <div className="bg-[#2A3A4A]/50 backdrop-blur-sm border border-[#DDB273]/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-[#DDB273] mb-4">Alertas de Crisis</h2>
          
          {alerts.length === 0 ? (
            <p className="text-[#F4F6F8]/60">No hay alertas activas</p>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert: Alert) => (
                <div key={alert.id} className="bg-[#1E2A38] border border-[#DDB273]/20 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          alert.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                          alert.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          alert.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {alert.priority.toUpperCase()}
                        </span>
                        <span className="text-[#F4F6F8]/60 text-sm">{alert.alert_type}</span>
                      </div>
                      <p className="text-[#F4F6F8] mb-2">{alert.message}</p>
                      <p className="text-[#F4F6F8]/40 text-sm">
                        {new Date(alert.created_at).toLocaleString('es-MX')}
                      </p>
                    </div>
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="px-4 py-2 bg-[#DDB273] text-[#1E2A38] rounded-lg hover:bg-[#DDB273]/80 transition-colors"
                    >
                      Resolver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
