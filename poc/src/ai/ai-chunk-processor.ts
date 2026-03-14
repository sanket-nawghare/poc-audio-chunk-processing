import { AudioChunkInput } from "../models/chunk.model";

export interface AIChunkProcessor {
  analyzeChunk(chunk: AudioChunkInput): Promise<string | null>;
}

class MockAIChunkProcessor implements AIChunkProcessor {
  async analyzeChunk(chunk: AudioChunkInput): Promise<string | null> {
    if (chunk.chunkIndex % 10 === 0) {
      return "periodic-clinical-cue";
    }

    return null;
  }
}

export const aiChunkProcessor: AIChunkProcessor = new MockAIChunkProcessor();
