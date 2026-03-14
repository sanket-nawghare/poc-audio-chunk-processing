export interface AudioChunkInput {
  sessionId: string;
  recordingId: string;
  chunkIndex: number;
  totalChunks?: number;
  timestamp: string;
  audioRef: string;
  patientId: string;
  encounterId: string;
  appointmentId?: string;
}

export interface StoredChunk extends AudioChunkInput {
  receivedAt: string;
}
