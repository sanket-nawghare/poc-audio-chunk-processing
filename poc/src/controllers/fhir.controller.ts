import { Request, Response, NextFunction } from "express";
import { sessionStore } from "../stores/session.store";
import { NotFoundError } from "../utils/errors";
import { fhirMapperService } from "../services/fhir-mapper.service";

export const fhirController = {
  getSession: (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = sessionStore.getSession(req.params.sessionId);
      if (!session) {
        throw new NotFoundError("Session not found");
      }
      res.json({
        ...session,
        chunksByIndex: Array.from(session.chunksByIndex.values()),
        duplicateChunkIndexes: Array.from(session.duplicateChunkIndexes.values()),
      });
    } catch (error) {
      next(error);
    }
  },

  getMedia: (req: Request, res: Response, next: NextFunction) => {
    try {
      const metadata = sessionStore.getMetadata(req.params.sessionId);
      if (!metadata) {
        throw new NotFoundError("FHIR Media not available. Session is not finalized");
      }
      res.json(fhirMapperService.toMedia(metadata));
    } catch (error) {
      next(error);
    }
  },

  getDocumentReference: (req: Request, res: Response, next: NextFunction) => {
    try {
      const metadata = sessionStore.getMetadata(req.params.sessionId);
      if (!metadata) {
        throw new NotFoundError(
          "FHIR DocumentReference not available. Session is not finalized",
        );
      }
      res.json(fhirMapperService.toDocumentReference(metadata));
    } catch (error) {
      next(error);
    }
  },
};
