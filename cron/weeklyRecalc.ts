import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { recalculateScores } from '../src/engine/archetypeEngine';
import { getShadowTraits, getCompletedChallenges } from '../src/services/engineService';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Ejecutar todos los domingos a las 00:00
cron.schedule('0 0 * * 0', async () => {
  console.log('[Cron] Starting weekly archetype recalculation');
  
  try {
    // Obtener todos los usuarios activos
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('status', 'active');
    
    if (error) throw error;
    
    if (!users || users.length === 0) {
      console.log('[Cron] No active users found');
      return;
    }
    
    console.log(`[Cron] Processing ${users.length} users`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        // Obtener scores actuales
        const { data: currentMetrics } = await supabase
          .from('archetype_metrics')
          .select('guerrero, rey, amante, mago')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!currentMetrics) {
          console.log(`[Cron] No metrics found for user ${user.id}, skipping`);
          continue;
        }
        
        // Obtener rasgos de sombra de la última semana
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: shadowTraits } = await supabase
          .from('detected_patterns')
          .select('pattern_type, intensity')
          .eq('profile_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString());
        
        // Obtener retos completados de la última semana
        const { data: completedChallenges } = await supabase
          .from('challenges')
          .select('shadow_archetype')
          .eq('profile_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', sevenDaysAgo.toISOString());
        
        // Recalcular scores
        const newScores = recalculateScores(
          currentMetrics,
          shadowTraits || [],
          completedChallenges || []
        );
        
        // Guardar nuevos scores
        const { error: insertError } = await supabase
          .from('archetype_metrics')
          .insert({
            profile_id: user.id,
            guerrero: newScores.guerrero,
            rey: newScores.rey,
            amante: newScores.amante,
            mago: newScores.mago,
            dominant_archetype: newScores.dominant_archetype,
            shadow_archetype: newScores.shadow_archetype,
            balance_index: newScores.balance_index,
          });
        
        if (insertError) throw insertError;
        
        console.log(`[Cron] Recalculated scores for user ${user.id}`);
        successCount++;
        
      } catch (error) {
        console.error(`[Cron] Error recalculating for user ${user.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`[Cron] Weekly recalculation completed: ${successCount} success, ${errorCount} errors`);
    
  } catch (error) {
    console.error('[Cron] Error in weekly recalculation:', error);
  }
});

console.log('[Cron] Weekly archetype recalculation scheduled (Sundays at 00:00)');
