import { AudioChunkInput } from "../models/chunk.model";
import { ValidationError } from "../utils/errors";

const REQUIRED_STRING_KEYS: Array<keyof AudioChunkInput> = [
  "sessionId",
  "recordingId",
  "timestamp",
  "audioRef",
  "patientId",
  "encounterId",
];

export class ChunkValidationService {
  validate(payload: unknown): AudioChunkInput {
    if (!payload || typeof payload !== "object") {
      throw new ValidationError("Chunk payload must be a JSON object");
    }

    const chunk = payload as AudioChunkInput;

    for (const key of REQUIRED_STRING_KEYS) {
      if (typeof chunk[key] !== "string" || !chunk[key]) {
        throw new ValidationError(`Invalid or missing ${key}`);
      }
    }

    if (!Number.isInteger(chunk.chunkIndex) || chunk.chunkIndex < 0) {
      throw new ValidationError("chunkIndex must be a non-negative integer");
    }

    if (
      chunk.totalChunks !== undefined &&
      (!Number.isInteger(chunk.totalChunks) || chunk.totalChunks <= 0)
    ) {
      throw new ValidationError("totalChunks must be a positive integer when present");
    }

    if (Number.isNaN(Date.parse(chunk.timestamp))) {
      throw new ValidationError("timestamp must be ISO-8601 parseable");
    }

    return chunk;
  }
}

export const chunkValidationService = new ChunkValidationService();
