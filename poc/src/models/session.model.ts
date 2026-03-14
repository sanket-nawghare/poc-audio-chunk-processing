import { StoredChunk } from "./chunk.model";

export type SessionStatus = "in-progress" | "completed" | "partial";

export interface AudioSession {
  sessionId: string;
  recordingId: string;
  patientId: string;
  encounterId: string;
  appointmentId?: string;
  status: SessionStatus;
  expectedTotalChunks?: number;
  chunksByIndex: Map<number, StoredChunk>;
  duplicateChunkIndexes: Set<number>;
  outOfOrderCount: number;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  aiSignals: string[];
  audioContentType?: string;
}
