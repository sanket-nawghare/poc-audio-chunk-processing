export const env = {
  port: Number(process.env.PORT ?? 8080),
  useBullMq: process.env.USE_BULLMQ === "true",
  redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  enableAiChunkAnalysis: process.env.ENABLE_AI_CHUNK_ANALYSIS === "true",
};

