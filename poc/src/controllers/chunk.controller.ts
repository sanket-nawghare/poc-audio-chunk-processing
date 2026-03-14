import { Request, Response, NextFunction } from "express";
import { chunkIngestionService } from "../services/chunk-ingestion.service";

export const chunkController = {
  ingest: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const chunk = await chunkIngestionService.ingest(req.body);
      res.status(202).json({
        message: "Chunk accepted for processing",
        sessionId: chunk.sessionId,
        chunkIndex: chunk.chunkIndex,
      });
    } catch (error) {
      next(error);
    }
  },
};
