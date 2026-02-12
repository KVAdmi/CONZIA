import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Ejecutar todos los días a las 10:00
cron.schedule('0 10 * * *', async () => {
  console.log('[Cron] Starting abandonment detection');
  
  try {
    const now = new Date();
    
    // 7 días: Email de seguimiento
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: inactive7, error: error7 } = await supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .eq('status', 'active')
      .lt('last_activity_at', sevenDaysAgo.toISOString());
    
    if (error7) throw error7;
    
    if (inactive7 && inactive7.length > 0) {
      console.log(`[Cron] Found ${inactive7.length} users inactive for 7 days`);
      
      for (const user of inactive7) {
        // Enviar email (implementar con SendGrid)
        // await sendEmail({
        //   to: user.email,
        //   subject: 'Te extrañamos en CONZIA',
        //   body: `
        //     Hola ${user.full_name || 'amigo'},
        //     
        //     Notamos que no has entrado a CONZIA en los últimos 7 días.
        //     Tu proceso de transformación te está esperando.
        //     
        //     ¿Qué te detiene? Estamos aquí para apoyarte.
        //   `,
        // });
        
        console.log(`[Cron] Sent 7-day email to ${user.email}`);
      }
    }
    
    // 14 días: Push notification
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const { data: inactive14, error: error14 } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('status', 'active')
      .lt('last_activity_at', fourteenDaysAgo.toISOString());
    
    if (error14) throw error14;
    
    if (inactive14 && inactive14.length > 0) {
      console.log(`[Cron] Found ${inactive14.length} users inactive for 14 days`);
      
      for (const user of inactive14) {
        // Enviar push notification (implementar)
        // await sendPushNotification(user.id, {
        //   title: 'Tu proceso continúa',
        //   body: '¿Listo para retomar?',
        // });
        
        console.log(`[Cron] Sent 14-day push to ${user.id}`);
      }
    }
    
    // 30 días: Alerta para equipo humano
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: inactive30, error: error30 } = await supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .eq('status', 'active')
      .lt('last_activity_at', thirtyDaysAgo.toISOString());
    
    if (error30) throw error30;
    
    if (inactive30 && inactive30.length > 0) {
      console.log(`[Cron] Found ${inactive30.length} users inactive for 30 days`);
      
      for (const user of inactive30) {
        // Crear alerta para equipo humano
        const { error: alertError } = await supabase
          .from('human_support_alerts')
          .insert({
            profile_id: user.id,
            alert_type: 'abandonment_risk',
            priority: 'medium',
            message: `Usuario ${user.full_name || user.email} inactivo por 30 días`,
            metadata: {
              last_activity: thirtyDaysAgo.toISOString(),
            },
          });
        
        if (alertError) throw alertError;
        
        console.log(`[Cron] Created abandonment alert for ${user.id}`);
      }
    }
    
    console.log('[Cron] Abandonment detection completed');
    
  } catch (error) {
    console.error('[Cron] Error in abandonment detection:', error);
  }
});

console.log('[Cron] Abandonment detection scheduled (daily at 10:00)');
