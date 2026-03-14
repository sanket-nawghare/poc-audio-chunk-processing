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

  let stopping = false;
  const shutdown = async () => {
    if (stopping) return;
    stopping = true;
    logger.info("Shutting down service");
    server.closeAllConnections();
    server.close(async () => {
      await chunkIngestionService.close();
      process.exit(0);
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  logger.error("Failed to bootstrap POC service", error);
  process.exit(1);
});
