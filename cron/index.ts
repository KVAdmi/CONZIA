/**
 * CONZIA - Cron Jobs Manager
 * 
 * Este archivo inicia todos los cron jobs del sistema.
 * 
 * Para ejecutar en producción:
 * 1. Configurar variables de entorno (.env)
 * 2. Ejecutar: node --loader ts-node/esm cron/index.ts
 * 3. O usar PM2: pm2 start cron/index.ts --name conzia-cron
 */

import './weeklyRecalc';
import './abandonmentDetection';

console.log('✅ CONZIA Cron Jobs iniciados');
console.log('📅 Weekly Recalc: Todos los lunes a las 00:00');
console.log('🚨 Abandonment Detection: Todos los días a las 08:00');
