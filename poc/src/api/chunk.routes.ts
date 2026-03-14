import { Router } from "express";
import { chunkController } from "../controllers/chunk.controller";

export const chunkRouter = Router();
chunkRouter.post("/audio/chunk", chunkController.ingest);
