import fs from "fs";
import path from "path";
import { StoredChunk } from "../models/chunk.model";
import { logger } from "../utils/logger";
import { env } from "../config/env";

const MIME_TO_EXT: Record<string, string> = {
  "audio/aac": "aac",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/wav": "wav",
  "audio/wave": "wav",
  "audio/ogg": "ogg",
  "audio/webm": "webm",
  "audio/flac": "flac",
};

export function extFromContentType(contentType: string | null): string {
  if (!contentType) return "bin";
  const mime = contentType.split(";")[0].trim().toLowerCase();
  return MIME_TO_EXT[mime] ?? "bin";
}

export class AudioStorageService {
  private readonly storageDir: string;

  constructor() {
    this.storageDir = path.resolve(env.audioStoragePath);
    fs.mkdirSync(this.storageDir, { recursive: true });
  }

  // Returns the detected content type so the caller can store it on the session
  async saveChunk(chunk: StoredChunk): Promise<string | undefined> {
    try {
      const response = await fetch(chunk.audioRef);
      if (!response.ok) {
        logger.warn("Audio fetch returned non-OK status", {
          sessionId: chunk.sessionId,
          chunkIndex: chunk.chunkIndex,
          status: response.status,
        });
        return undefined;
      }

      const contentType = response.headers.get("content-type") ?? undefined;
      const arrayBuffer = await response.arrayBuffer();
      const chunkPath = this.chunkFilePath(chunk.sessionId, chunk.chunkIndex);
      await fs.promises.writeFile(chunkPath, Buffer.from(arrayBuffer));
      return contentType;
    } catch (error) {
      logger.warn("Failed to fetch/save audio chunk", {
        sessionId: chunk.sessionId,
        chunkIndex: chunk.chunkIndex,
        error,
      });
      return undefined;
    }
  }

  async assembleSession(
    sessionId: string,
    chunkIndexes: number[],
    contentType?: string,
  ): Promise<void> {
    const sorted = [...chunkIndexes].sort((a, b) => a - b);
    const buffers: Buffer[] = [];

    for (const index of sorted) {
      const chunkPath = this.chunkFilePath(sessionId, index);
      if (fs.existsSync(chunkPath)) {
        buffers.push(await fs.promises.readFile(chunkPath));
      } else {
        logger.warn("Missing chunk file during assembly", { sessionId, chunkIndex: index });
      }
    }

    if (buffers.length === 0) {
      logger.warn("No chunk files found for assembly", { sessionId });
      return;
    }

    const ext = extFromContentType(contentType ?? null);
    const finalPath = this.sessionFilePath(sessionId, ext);
    await fs.promises.writeFile(finalPath, Buffer.concat(buffers));
    logger.info("Audio assembled", { sessionId, chunks: sorted.length, ext, path: finalPath });

    // Best-effort cleanup of individual chunk files
    for (const index of sorted) {
      fs.unlink(this.chunkFilePath(sessionId, index), () => {});
    }
  }

  sessionFilePath(sessionId: string, ext: string): string {
    return path.join(this.storageDir, `${sessionId}.${ext}`);
  }

  private chunkFilePath(sessionId: string, chunkIndex: number): string {
    return path.join(this.storageDir, `${sessionId}-chunk-${chunkIndex}.bin`);
  }
}

export const audioStorageService = new AudioStorageService();
