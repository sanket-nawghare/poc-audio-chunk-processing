export interface AudioSessionMetadata {
  sessionId: string;
  recordingId: string;
  patientId: string;
  encounterId: string;
  appointmentId?: string;
  chunkCount: number;
  expectedChunkCount?: number;
  missingChunkIndexes: number[];
  duplicateChunkCount: number;
  outOfOrderCount: number;
  startTime?: string;
  endTime?: string;
  durationSeconds?: number;
  audioUrl: string;
  status: "completed" | "partial";
  aiSignals: string[];
}
