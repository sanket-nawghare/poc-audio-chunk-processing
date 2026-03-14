import { AudioChunkInput } from "../models/chunk.model";
import { CHUNK_JOB_NAME, QUEUE_NAME } from "../config/constants";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export type ChunkJobHandler = (chunk: AudioChunkInput) => Promise<void>;

type BullQueue = {
  add: (name: string, data: AudioChunkInput, opts: { jobId: string }) => Promise<unknown>;
};

type BullWorker = {
  close: () => Promise<void>;
};

export class ChunkProcessingQueue {
  private queue: BullQueue | null = null;
  private worker: BullWorker | null = null;
  private readonly handler: ChunkJobHandler;
  private readonly useBullMq: boolean;

  constructor(handler: ChunkJobHandler) {
    this.handler = handler;
    this.useBullMq = env.useBullMq;
  }

  async init(): Promise<void> {
    if (!this.useBullMq) {
      logger.info("BullMQ disabled. Falling back to inline processing mode.");
      return;
    }

    try {
      // Dynamic require keeps local mode working even when bullmq is not installed yet.
      const { Queue, Worker } = require("bullmq");
      const redisUrl = env.redisUrl;
      const connection = { url: redisUrl };

      this.queue = new Queue(QUEUE_NAME, { connection });
      this.worker = new Worker(
        QUEUE_NAME,
        async (job: { data: AudioChunkInput }) => {
          await this.handler(job.data);
        },
        { connection },
      );

      logger.info("BullMQ initialized", { queue: QUEUE_NAME, redisUrl });
    } catch (error) {
      logger.warn(
        "BullMQ initialization failed. Falling back to inline mode.",
        error,
      );
      this.queue = null;
      this.worker = null;
    }
  }

  async enqueue(chunk: AudioChunkInput): Promise<void> {
    if (this.queue) {
      await this.queue.add(CHUNK_JOB_NAME, chunk, {
        jobId: `${chunk.sessionId}-${chunk.chunkIndex}`,
      });
      return;
    }

    await this.handler(chunk);
  }

  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
