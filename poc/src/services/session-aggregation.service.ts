import { AudioChunkInput, StoredChunk } from "../models/chunk.model";
import { AudioSession } from "../models/session.model";
import { sessionStore } from "../stores/session.store";
import { logger } from "../utils/logger";
import { metadataGeneratorService } from "./metadata-generator.service";
import { audioStorageService } from "./audio-storage.service";
import { aiChunkProcessor } from "../ai/ai-chunk-processor";
import { env } from "../config/env";

export class SessionAggregationService {
  private buildInitialSession(chunk: AudioChunkInput): AudioSession {
    const now = new Date().toISOString();

    return {
      sessionId: chunk.sessionId,
      recordingId: chunk.recordingId,
      patientId: chunk.patientId,
      encounterId: chunk.encounterId,
      appointmentId: chunk.appointmentId,
      status: "in-progress",
      expectedTotalChunks: chunk.totalChunks,
      chunksByIndex: new Map(),
      duplicateChunkIndexes: new Set(),
      outOfOrderCount: 0,
      startedAt: now,
      updatedAt: now,
      aiSignals: [],
    };
  }

  async processChunk(chunk: AudioChunkInput): Promise<AudioSession> {
    const current =
      sessionStore.getSession(chunk.sessionId) ?? this.buildInitialSession(chunk);

    this.assertSessionConsistency(current, chunk);

    if (!current.expectedTotalChunks && chunk.totalChunks) {
      current.expectedTotalChunks = chunk.totalChunks;
    }

    if (current.chunksByIndex.has(chunk.chunkIndex)) {
      current.duplicateChunkIndexes.add(chunk.chunkIndex);
      current.updatedAt = new Date().toISOString();
      sessionStore.saveSession(current);
      logger.warn("Duplicate chunk received", {
        sessionId: chunk.sessionId,
        chunkIndex: chunk.chunkIndex,
      });
      return current;
    }

    const maxSeen = Math.max(-1, ...current.chunksByIndex.keys());
    if (chunk.chunkIndex < maxSeen) {
      current.outOfOrderCount += 1;
    }

    const storedChunk: StoredChunk = {
      ...chunk,
      receivedAt: new Date().toISOString(),
    };
    current.chunksByIndex.set(chunk.chunkIndex, storedChunk);
    const detectedContentType = await audioStorageService.saveChunk(storedChunk);
    if (detectedContentType && !current.audioContentType) {
      current.audioContentType = detectedContentType;
    }

    const aiSignal = env.enableAiChunkAnalysis
      ? await aiChunkProcessor.analyzeChunk(chunk)
      : null;

    if (aiSignal) {
      current.aiSignals.push(aiSignal);
    }

    current.updatedAt = new Date().toISOString();
    this.updateCompletion(current);

    sessionStore.saveSession(current);

    if (current.status === "completed") {
      const chunkIndexes = Array.from(current.chunksByIndex.keys());
      await audioStorageService.assembleSession(current.sessionId, chunkIndexes, current.audioContentType);
      const metadata = metadataGeneratorService.generate(current);
      sessionStore.saveMetadata(metadata);
    }

    return current;
  }

  private updateCompletion(session: AudioSession): void {
    if (!session.expectedTotalChunks) {
      session.status = "in-progress";
      return;
    }

    const missingCount = Array.from({ length: session.expectedTotalChunks }, (_, i) => i)
      .filter((index) => !session.chunksByIndex.has(index)).length;

    session.status = missingCount === 0 ? "completed" : "partial";
    if (session.status === "completed") {
      session.completedAt = new Date().toISOString();
    }
  }

  private assertSessionConsistency(session: AudioSession, chunk: AudioChunkInput): void {
    if (
      session.recordingId !== chunk.recordingId ||
      session.patientId !== chunk.patientId ||
      session.encounterId !== chunk.encounterId
    ) {
      throw new Error(
        `Inconsistent context for sessionId ${chunk.sessionId}. ` +
          "recordingId/patientId/encounterId changed across chunks",
      );
    }
  }
}

export const sessionAggregationService = new SessionAggregationService();
