import { Redis } from "ioredis";

/**
 * Configuración de Redis para workers y cron jobs
 * 
 * Para desarrollo local: usa Redis local (localhost:6379)
 * Para producción: usa Upstash Redis (configurar en .env)
 */

const redisConfig = {
  host: import.meta.env.VITE_REDIS_HOST || "localhost",
  port: parseInt(import.meta.env.VITE_REDIS_PORT || "6379"),
  password: import.meta.env.VITE_REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Requerido por BullMQ
  enableReadyCheck: false,
};

// Cliente Redis para uso general
export const redis = new Redis(redisConfig);

// Configuración de conexión para BullMQ
export const bullMQConnection = {
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Eventos de conexión
redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (error) => {
  console.error("❌ Redis error:", error);
});

redis.on("close", () => {
  console.log("🔌 Redis connection closed");
});
