import { AudioSession } from "../models/session.model";
import { AudioSessionMetadata } from "../models/metadata.model";
import { env } from "../config/env";
import { extFromContentType } from "./audio-storage.service";

export class MetadataGeneratorService {
  generate(session: AudioSession): AudioSessionMetadata {
    const indexes = Array.from(session.chunksByIndex.keys()).sort((a, b) => a - b);
    const startTime = indexes.length
      ? session.chunksByIndex.get(indexes[0])?.timestamp
      : undefined;
    const endTime = indexes.length
      ? session.chunksByIndex.get(indexes[indexes.length - 1])?.timestamp
      : undefined;

    const durationSeconds =
      startTime && endTime
        ? Math.max(0, Math.round((Date.parse(endTime) - Date.parse(startTime)) / 1000))
        : undefined;

    const expectedChunkCount = session.expectedTotalChunks;
    const missingChunkIndexes =
      expectedChunkCount === undefined
        ? []
        : Array.from({ length: expectedChunkCount }, (_, i) => i).filter(
            (index) => !session.chunksByIndex.has(index),
          );

    return {
      sessionId: session.sessionId,
      recordingId: session.recordingId,
      patientId: session.patientId,
      encounterId: session.encounterId,
      appointmentId: session.appointmentId,
      chunkCount: session.chunksByIndex.size,
      expectedChunkCount,
      missingChunkIndexes,
      duplicateChunkCount: session.duplicateChunkIndexes.size,
      outOfOrderCount: session.outOfOrderCount,
      startTime,
      endTime,
      durationSeconds,
      audioUrl: `${env.audioBaseUrl}/${session.sessionId}.${extFromContentType(session.audioContentType ?? null)}`,
      status: missingChunkIndexes.length === 0 ? "completed" : "partial",
      aiSignals: [...session.aiSignals],
    };
  }
}

export const metadataGeneratorService = new MetadataGeneratorService();
