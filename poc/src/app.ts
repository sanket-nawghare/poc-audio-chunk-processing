import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { chunkRouter } from "./api/chunk.routes";
import { fhirRouter } from "./api/fhir.routes";
import { ValidationError, NotFoundError } from "./utils/errors";
import { env } from "./config/env";

export const createApp = () => {
  const app = express();

  app.use(bodyParser.json({ limit: "10mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "clinical-audio-poc" });
  });

  app.use("/audio", express.static(path.resolve(env.audioStoragePath)));
  app.use(chunkRouter);
  app.use(fhirRouter);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: message });
  });

  return app;
};
