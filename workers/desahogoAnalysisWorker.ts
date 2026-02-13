import { Queue, Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { bullMQConnection } from './config/redis';
import { analyzeDesahogoV2 } from '../src/services/ai/analyzeDesahogoV2';
import { assessRisk, generateCrisisResponse } from '../src/engine/crisisProtocol';



const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cola para análisis de desahogo
export const desahogoQueue = new Queue('desahogo-analysis', {
  connection: bullMQConnection,
});

// Worker para procesar análisis
export const desahogoWorker = new Worker(
  'desahogo-analysis',
  async (job) => {
    const { entryId, userId, text, accessToken } = job.data;
    
    console.log(`[Worker] Processing desahogo analysis for entry ${entryId}`);
    
    try {
      // 1. Analizar con Claude
      const analysis = await analyzeDesahogoV2({
        text,
        userId,
        accessToken,
      });
      
      // 2. Guardar análisis en la entrada
      const { error: updateError } = await supabase
        .from('desahogo_entries')
        .update({
          ai_analysis: analysis,
          analyzed_at: new Date().toISOString(),
        })
        .eq('id', entryId);
      
      if (updateError) throw updateError;
      
      // 3. Evaluar riesgo de crisis
      const riskAssessment = assessRisk(userId, text);
      
      // 4. Si hay crisis, generar alerta
      if (riskAssessment.risk_level === 'critical' || riskAssessment.risk_level === 'high') {
        const crisisResponse = generateCrisisResponse(riskAssessment);
        
        // Guardar alerta en human_support_alerts
        const { error: alertError } = await supabase
          .from('human_support_alerts')
          .insert({
            profile_id: userId,
            alert_type: riskAssessment.risk_level === 'critical' ? 'crisis' : 'high_resistance',
            priority: crisisResponse.alert_priority,
            message: crisisResponse.message,
            metadata: {
              entry_id: entryId,
              risk_score: riskAssessment.risk_score,
              risk_factors: riskAssessment.risk_factors,
            },
          });
        
        if (alertError) throw alertError;
        
        console.log(`[Worker] Crisis alert created for user ${userId}`);
        
        // Agregar job a cola de alertas de crisis
        await crisisAlertQueue.add('send-crisis-alert', {
          userId,
          entryId,
          riskLevel: riskAssessment.risk_level,
          riskScore: riskAssessment.risk_score,
        });
      }
      
      console.log(`[Worker] Successfully processed entry ${entryId}`);
      return { success: true, analysis };
      
    } catch (error) {
      console.error(`[Worker] Error processing entry ${entryId}:`, error);
      throw error;
    }
  },
  {
    connection: {
      host: REDIS_HOST,
      port: REDIS_PORT,
    },
    concurrency: 5, // Procesar 5 jobs en paralelo
  }
);

// Cola para alertas de crisis
export const crisisAlertQueue = new Queue('crisis-alerts', {
  connection: bullMQConnection,
});

// Worker para enviar alertas de crisis
export const crisisAlertWorker = new Worker(
  'crisis-alerts',
  async (job) => {
    const { userId, entryId, riskLevel, riskScore } = job.data;
    
    console.log(`[Worker] Sending crisis alert for user ${userId}`);
    
    try {
      // 1. Obtener información del usuario
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single();
      
      if (!profile) throw new Error('User profile not found');
      
      // 2. Enviar email al equipo (implementar con SendGrid)
      // await sendEmail({
      //   to: 'equipo@conzia.com',
      //   subject: `[CRISIS] Usuario ${profile.full_name || profile.email} en riesgo ${riskLevel}`,
      //   body: `
      //     Usuario: ${profile.full_name || profile.email}
      //     Email: ${profile.email}
      //     Nivel de riesgo: ${riskLevel}
      //     Score de riesgo: ${riskScore}
      //     Entry ID: ${entryId}
      //     
      //     Acción requerida: Contactar al usuario inmediatamente.
      //   `,
      // });
      
      // 3. Enviar SMS al supervisor clínico (implementar con Twilio)
      // await sendSMS({
      //   to: process.env.CLINICAL_SUPERVISOR_PHONE,
      //   message: `CRISIS: Usuario ${profile.email} requiere atención inmediata. Nivel: ${riskLevel}`,
      // });
      
      // 4. Actualizar alerta en DB
      const { error } = await supabase
        .from('human_support_alerts')
        .update({
          notified_at: new Date().toISOString(),
        })
        .eq('profile_id', userId)
        .eq('metadata->>entry_id', entryId);
      
      if (error) throw error;
      
      console.log(`[Worker] Crisis alert sent for user ${userId}`);
      return { success: true };
      
    } catch (error) {
      console.error(`[Worker] Error sending crisis alert:`, error);
      throw error;
    }
  },
  {
    connection: {
      host: REDIS_HOST,
      port: REDIS_PORT,
    },
    priority: 1, // Máxima prioridad
  }
);

// Manejo de errores
desahogoWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
  
  if (job && job.attemptsMade < 3) {
    // Reintentar con backoff exponencial
    console.log(`[Worker] Retrying job ${job.id} (attempt ${job.attemptsMade + 1}/3)`);
  } else {
    console.error(`[Worker] Job ${job?.id} moved to DLQ after 3 attempts`);
  }
});

crisisAlertWorker.on('failed', (job, err) => {
  console.error(`[Worker] Crisis alert job ${job?.id} failed:`, err);
});

console.log('[Worker] Desahogo analysis worker started');
console.log('[Worker] Crisis alert worker started');
