import { Router } from "express";
import { fhirController } from "../controllers/fhir.controller";

export const fhirRouter = Router();
fhirRouter.get("/sessions/:sessionId", fhirController.getSession);
fhirRouter.get("/fhir/media/:sessionId", fhirController.getMedia);
fhirRouter.get(
  "/fhir/document-reference/:sessionId",
  fhirController.getDocumentReference,
);
