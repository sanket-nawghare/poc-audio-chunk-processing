const port = Number(process.env.PORT ?? 8080);

export const env = {
  port,
  useBullMq: process.env.USE_BULLMQ === "true",
  redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  enableAiChunkAnalysis: process.env.ENABLE_AI_CHUNK_ANALYSIS === "true",
  audioBaseUrl: process.env.AUDIO_BASE_URL ?? `http://localhost:${port}/audio`,
  audioStoragePath: process.env.AUDIO_STORAGE_PATH ?? "./tmp/audio",
};

