import { AudioChunkInput } from "../models/chunk.model";
import { chunkValidationService } from "./chunk-validation.service";
import { sessionAggregationService } from "./session-aggregation.service";
import { ChunkProcessingQueue } from "../queue/chunk-processing.queue";

class ChunkIngestionService {
  private readonly queue = new ChunkProcessingQueue(async (chunk) => {
    await sessionAggregationService.processChunk(chunk);
  });

  async init(): Promise<void> {
    await this.queue.init();
  }

  async ingest(rawPayload: unknown): Promise<AudioChunkInput> {
    const chunk = chunkValidationService.validate(rawPayload);
    await this.queue.enqueue(chunk);
    return chunk;
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

export const chunkIngestionService = new ChunkIngestionService();
