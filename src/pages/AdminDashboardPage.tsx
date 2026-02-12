import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase/config";
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
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/acceso");
        return;
      }

      // Verificar si el usuario es admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      loadAdminData();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/dashboard");
    }
  }

  async function loadAdminData() {
    try {
      // Cargar estadísticas
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, subscription_status');

      const totalUsers = users?.length || 0;
      const activeUsers = users?.filter(u => u.subscription_status === 'active').length || 0;

      // Cargar alertas activas
      const { data: alertsData } = await supabase
        .from('human_support_alerts')
        .select(`
          *,
          user_profiles!inner(email, full_name)
        `)
        .is('resolved_at', null)
        .order('created_at', { ascending: false });

      const alertsWithUser = (alertsData || []).map(alert => ({
        ...alert,
        user_email: alert.user_profiles?.email,
        user_name: alert.user_profiles?.full_name,
      }));

      setAlerts(alertsWithUser);

      // Calcular resistencia promedio
      const { data: resistanceData } = await supabase
        .from('resistance_metrics')
        .select('resistance_index')
        .order('created_at', { ascending: false })
        .limit(100);

      const avgResistance = resistanceData && resistanceData.length > 0
        ? resistanceData.reduce((sum, r) => sum + r.resistance_index, 0) / resistanceData.length
        : 0;

      setStats({
        total_users: totalUsers,
        active_users: activeUsers,
        total_revenue: 0, // TODO: Calcular desde Stripe
        active_alerts: alertsWithUser.length,
        avg_resistance: Math.round(avgResistance),
      });

    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function resolveAlert(alertId: string) {
    try {
      const { error } = await supabase
        .from('human_support_alerts')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;

      // Actualizar lista
      setAlerts(alerts.filter(a => a.id !== alertId));
      if (stats) {
        setStats({ ...stats, active_alerts: stats.active_alerts - 1 });
      }
    } catch (error) {
      console.error("Error resolving alert:", error);
      alert("Error al resolver alerta");
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center px-6 pb-10 pt-12">
        <div className="text-white/75">Cargando panel de administración...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/10 ring-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 ring-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 ring-yellow-500/20';
      default: return 'text-blue-400 bg-blue-500/10 ring-blue-500/20';
    }
  };

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
        <p className="mt-2 text-sm text-white/65">
          Monitoreo y gestión de CONZIA
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-[24px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-[#DDB273]" />
              <div>
                <div className="text-xs text-white/65">Usuarios</div>
                <div className="text-2xl font-bold text-white">{stats.total_users}</div>
                <div className="text-xs text-white/55">{stats.active_users} activos</div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div>
                <div className="text-xs text-white/65">Alertas</div>
                <div className="text-2xl font-bold text-white">{stats.active_alerts}</div>
                <div className="text-xs text-white/55">Sin resolver</div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-400" />
              <div>
                <div className="text-xs text-white/65">Resistencia Promedio</div>
                <div className="text-2xl font-bold text-white">{stats.avg_resistance}</div>
                <div className="text-xs text-white/55">/100</div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-green-400" />
              <div>
                <div className="text-xs text-white/65">Ingresos</div>
                <div className="text-2xl font-bold text-white">$0</div>
                <div className="text-xs text-white/55">Este mes</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="mb-6">
        <div className="text-[11px] tracking-[0.18em] text-white/55 mb-4">ALERTAS ACTIVAS</div>
        
        {alerts.length === 0 ? (
          <div className="rounded-[24px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 py-8 text-center">
            <div className="text-sm text-white/65">No hay alertas activas</div>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-[24px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getPriorityColor(alert.priority)}`}>
                      {alert.priority.toUpperCase()}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white capitalize">
                      {alert.alert_type.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="rounded-full bg-white/10 ring-1 ring-white/10 backdrop-blur-md px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                  >
                    Resolver
                  </button>
                </div>
                
                <div className="text-sm text-white/75 mb-3">{alert.message}</div>
                
                <div className="flex items-center gap-4 text-xs text-white/55">
                  <div>Usuario: {alert.user_name || alert.user_email}</div>
                  <div>•</div>
                  <div>{new Date(alert.created_at).toLocaleString('es-MX')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/admin/users")}
          className="rounded-[24px] bg-white/10 ring-1 ring-white/10 backdrop-blur-md px-6 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/15"
        >
          Ver Usuarios
        </button>
        <button
          onClick={() => navigate("/admin/metrics")}
          className="rounded-[24px] bg-white/10 ring-1 ring-white/10 backdrop-blur-md px-6 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/15"
        >
          Métricas
        </button>
      </div>
    </div>
  );
}
