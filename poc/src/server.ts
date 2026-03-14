import "dotenv/config";
import { createApp } from "./app";
import { chunkIngestionService } from "./services/chunk-ingestion.service";
import { logger } from "./utils/logger";
import { env } from "./config/env";

const PORT = env.port;

async function bootstrap(): Promise<void> {
  await chunkIngestionService.init();

  const app = createApp();
  const server = app.listen(PORT, () => {
    logger.info(`POC backend listening on port ${PORT}`);
  });

  const shutdown = async () => {
    logger.info("Shutting down service");
    await chunkIngestionService.close();
    server.close();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  logger.error("Failed to bootstrap POC service", error);
  process.exit(1);
});
