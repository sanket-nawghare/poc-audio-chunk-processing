/**
 * Epic Haiku Simulator
 *
 * This script simulates the behavior of Epic's Haiku voice assistant system.
 * It mimics the workflow of:
 * 1. Ambient session initialization
 * 2. Recording chunk availability notifications
 * 3. Recording availability notifications
 * 4. Session completion
 *
 * The simulator sends POST requests to the API endpoints in the same sequence
 * as Epic Haiku would, allowing for local testing without requiring Epic infrastructure.
 */

import axios, { AxiosError } from 'axios';

export interface SimulatorConfig {
  baseUrl: string; // e.g., http://localhost:3000
  customerID: string;
  customerSecret: string;
  haikuClientId: string;
  callbackUrl?: string; // Optional: URL of the callback service (express simulator)
}

export interface RecordingConfig {
  audioFilePath?: string;
  audioData?: Buffer;
  contentType?: string;
}

export interface SessionConfig {
  userID: string;
  patientID: Array<{ ID: string; Type: string }>;
  encounterID: Array<{ ID: string; Type: string }>;
  noteType?: string;
  totalChunks?: number;
  chunkDelayMs?: number;
  recordingDelayMs?: number;
  betweenRecordingsDelayMs?: number; // Delay between recordings in a multi-recording session
  audioFilePath?: string; // Optional: Path to actual audio file (AAC format)
  audioData?: Buffer;     // Optional: Direct audio buffer
  contentType?: string;   // Optional: MIME type of the audio (e.g., audio/aac, audio/mpeg)
  duplicateChunkProbability?: number; // Probability (0-1) that a chunk will be duplicated
  concurrentChunkBatchSize?: number;  // Number of chunks to send concurrently (0 = all sequential)
  chunkSizeBytes?: number;            // Size of each audio chunk in bytes (default: 100 * 1024 = 100KB)
  recordings?: RecordingConfig[]; // Optional: Multiple recordings for a single session
}

interface SimulationStep {
  name: string;
  endpoint: string;
  payload: Record<string, unknown>;
  delayBefore?: number;
}

export class EpicHaikuSimulator {
  private config: SimulatorConfig;
  private sessionId: string = '';
  private recordingVersion: string = '1';
  private stepCount: number = 0;
  private currentContentType: string = 'audio/aac';

  constructor(config: SimulatorConfig) {
    this.config = config;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep for specified milliseconds
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Add authentication headers
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Haiku-Client-ID': this.config.haikuClientId,
      'X-Customer-ID': this.config.customerID,
      'X-Customer-Secret': this.config.customerSecret,
      sim: 'true'
    };
  }

  /**
   * Send a request to an endpoint
   */
  private async sendRequest(
    method: string,
    endpoint: string,
    payload: Record<string, unknown>,
  ): Promise<unknown> {
    this.stepCount++;
    const url = `${this.config.baseUrl}/api/v1.0/haiku/${endpoint}`;

    console.log(
      `\n[Step ${this.stepCount}] ${method} ${url}`,
    );
    // console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await axios({
        method,
        url,
        data: payload,
        headers: this.getHeaders(),
        timeout: 30000,
      });

      console.log(
        `✓ Response (${response.status}):`,
        JSON.stringify(response.data, null, 2),
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(
          `✗ Error (${error.response?.status}):`,
          error.response?.data || error.message,
        );
      } else {
        console.error('✗ Error:', error);
      }
      throw error;
    }
  }

  /**
   * Step 1: Begin an ambient session
   * This initializes the session and stores session metadata
   */
  async beginSession(sessionConfig: SessionConfig): Promise<void> {
    this.sessionId = this.generateSessionId();
    this.recordingVersion = '1';

    const noteSections = [
      '10164-2',
      '29545-1',
      '30954-2',
      '51847-2',
      '86467-8',
      '96335-5',
    ];

    // Select a random subset (some but not all) from noteSections
    const shuffled = [...noteSections].sort(() => Math.random() - 0.5);
    const count = Math.floor(Math.random() * (noteSections.length - 1)) + 1;
    const selectedSections = shuffled.slice(0, count);

    const payload = {
      userID: sessionConfig.userID,
      sessionID: this.sessionId,
      patientID: sessionConfig.patientID,
      encounterID: sessionConfig.encounterID,
      customerID: this.config.customerID,
      customerSecret: this.config.customerSecret,
      callbackUrl: (this.config as any).callbackUrl || this.config.baseUrl,
      data: {
        noteType: sessionConfig.noteType || '11506-3',
        user: {
          careContext: '1',
        },
        notes: {
          noteSections: selectedSections,
        },
      },
    };

    await this.sendRequest('POST', 'AmbientSessionBegin', payload);
    console.log(`\n→ Session ${this.sessionId} started`);
  }

  /**
   * Step 2: Notify about recording chunks
   * This simulates Epic sending multiple audio file chunks that need processing
   * Each chunk contains actual audio data in AAC format
   */
  async sendRecordingChunks(
    totalChunks: number = 3,
    chunkDelayMs: number = 2000,
    audioData?: Buffer,
    duplicateChunkProbability: number = 0,
    concurrentChunkBatchSize: number = 0,
    chunkSizeBytes: number = 100 * 1024,
  ): Promise<void> {
    console.log(`\n→ Sending ${totalChunks} recording chunks...`);

    if (duplicateChunkProbability > 0) {
      console.log(`  - Duplicate chunk probability: ${(duplicateChunkProbability * 100).toFixed(0)}%`);
    }
    if (concurrentChunkBatchSize > 1) {
      console.log(`  - Concurrent batch size: ${concurrentChunkBatchSize}`);
    }

    // Build list of chunks to send (including duplicates)
    const chunksToSend: number[] = [];
    for (let i = 1; i <= totalChunks; i++) {
      chunksToSend.push(i);

      // Randomly decide if this chunk should be duplicated
      if (duplicateChunkProbability > 0 && Math.random() < duplicateChunkProbability) {
        chunksToSend.push(i); // Add duplicate
        console.log(`  ⚠ Chunk ${i} will be sent as a duplicate`);
      }
    }

    // Send chunks in batches (concurrent or sequential)
    let processedCount = 0;
    while (processedCount < chunksToSend.length) {
      const batchSize = concurrentChunkBatchSize > 1
        ? Math.min(concurrentChunkBatchSize, chunksToSend.length - processedCount)
        : 1;

      const batch = chunksToSend.slice(processedCount, processedCount + batchSize);

      if (batchSize > 1) {
        console.log(`\n  → Sending batch of ${batch.length} chunks concurrently: [${batch.join(', ')}]`);

        // Send all chunks in batch concurrently
        await Promise.all(
          batch.map((chunkNum) => this.sendSingleChunk(chunkNum, totalChunks, audioData, chunkSizeBytes))
        );
      } else {
        // Sequential send
        if (processedCount > 0) {
          await this.sleep(chunkDelayMs);
        }
        await this.sendSingleChunk(batch[0], totalChunks, audioData, chunkSizeBytes);
      }

      processedCount += batchSize;

      // Add delay between batches if sending concurrently
      if (batchSize > 1 && processedCount < chunksToSend.length) {
        await this.sleep(chunkDelayMs);
      }
    }

    console.log(`\n→ All ${chunksToSend.length} recording chunks sent (${totalChunks} unique chunks)`);
  }

  /**
   * Send a single chunk notification
   */
  private async sendSingleChunk(
    chunkNumber: number,
    totalChunks: number,
    audioData?: Buffer,
    chunkSizeBytes: number = 100 * 1024,
  ): Promise<void> {
    // Generate or use provided audio data for this chunk
    const chunkAudioData = audioData
      ? this.getChunkFromAudio(audioData, chunkNumber, chunkSizeBytes)
      : this.generateMockAudioChunk(chunkSizeBytes);

    console.log(`\n  Chunk ${chunkNumber}/${totalChunks}:`);
    console.log(`    - Size: ${chunkAudioData.length} bytes`);
    console.log(`    - Format: ${this.currentContentType}`);

    const payload = {
      sessionID: this.sessionId,
      recording: this.recordingVersion,
      chunk: chunkNumber.toString(),
      totalChunks: totalChunks.toString(),
      // chunkData: chunkAudioData.toString('base64'), // Base64 encoded audio
      chunkSize: chunkAudioData.length,
      contentType: this.currentContentType,
    };

    await this.sendRequest('POST', 'RecordingChunkAvailable', payload);
  }

  /**
   * Generate a mock audio chunk (simulated AAC audio data)
   * In production, this would be actual audio from Epic's API
   */
  private generateMockAudioChunk(chunkSizeBytes: number = 100 * 1024): Buffer {
    const audioBuffer = Buffer.alloc(chunkSizeBytes);

    // Fill with pseudo-random audio data
    for (let i = 0; i < chunkSizeBytes; i++) {
      audioBuffer[i] = Math.floor(Math.random() * 256);
    }

    return audioBuffer;
  }

  /**
   * Extract a chunk from a larger audio buffer using a fixed byte size
   */
  private getChunkFromAudio(
    audioBuffer: Buffer,
    chunkNumber: number,
    chunkSizeBytes: number,
  ): Buffer {
    const startIndex = (chunkNumber - 1) * chunkSizeBytes;
    const endIndex = Math.min(chunkNumber * chunkSizeBytes, audioBuffer.length);

    return audioBuffer.subarray(startIndex, endIndex);
  }

  /**
   * Step 3: Notify that recording is available
   * This signals that the recording has been completed and all chunks have been sent
   */
  async sendRecordingAvailable(
    recordingDelayMs: number = 2000,
    totalChunks: number = 3,
    isLastRecording: boolean = true
  ): Promise<void> {
    if (recordingDelayMs > 0) {
      console.log(`\n→ Waiting ${recordingDelayMs}ms before sending RecordingAvailable...`);
      await this.sleep(recordingDelayMs);
    }

    const payload = {
      sessionID: this.sessionId,
      recording: this.recordingVersion,
      totalChunks: totalChunks.toString(),
      lastRecording: isLastRecording ? "1" : 0,
    };

    await this.sendRequest('POST', 'RecordingAvailable', payload);
    console.log(`\n→ Recording available notification sent (lastRecording: ${isLastRecording ? 1 : 0})`);
  }

  /**
   * Step 4: Complete the session
   * This cleans up the session and associated data
   */
  async completeSession(): Promise<void> {
    const payload = {
      sessionID: this.sessionId,
    };

    await this.sendRequest('POST', 'AmbientSessionComplete', payload);
    console.log(`\n→ Session ${this.sessionId} completed`);
  }

  /**
   * Get content type from file path extension
   */
  private getContentTypeFromPath(filePath?: string): string | undefined {
    if (!filePath) return undefined;
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (!ext) return undefined;
    const map: Record<string, string> = {
      aac: 'audio/aac',
      m4a: 'audio/mp4',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      webm: 'audio/webm',
      flac: 'audio/flac',
    };
    return map[ext] || undefined;
  }

  /**
   * Send a single recording (chunks + recording available notification)
   * Used for multi-recording sessions
   */
  async sendSingleRecording(
    recordingConfig: RecordingConfig,
    sessionConfig: SessionConfig,
    recordingIndex: number,
    totalRecordings: number
  ): Promise<void> {
    const isLastRecording = recordingIndex === totalRecordings - 1;

    // Set recording version to the current recording number (1-based)
    this.recordingVersion = (recordingIndex + 1).toString();

    console.log(`\n╔══════════════════════════════════════════════════════════╗`);
    console.log(`║  Recording ${recordingIndex + 1} of ${totalRecordings}`);
    console.log(`║  Recording Version: ${this.recordingVersion}`);
    if (recordingConfig.audioFilePath) {
      console.log(`║  Audio File: ${recordingConfig.audioFilePath}`);
    }
    console.log(`╚══════════════════════════════════════════════════════════╝`);

    if (sessionConfig.totalChunks !== undefined && sessionConfig.chunkSizeBytes !== undefined) {
      throw new Error(
        'Cannot specify both totalChunks and chunkSizeBytes. Use only one to define chunk splitting.'
      );
    }

    const DEFAULT_CHUNK_SIZE = 100 * 1024; // 100KB
    const chunkDelayMs = sessionConfig.chunkDelayMs || 2000;
    const callbackUrl = (this.config as any).callbackUrl || this.config.baseUrl;

    // Load audio data if provided
    let audioData = recordingConfig.audioData;
    if (recordingConfig.audioFilePath && !audioData) {
      try {
        const fs = await import('fs/promises');
        audioData = await fs.readFile(recordingConfig.audioFilePath);
        console.log(`✓ Audio file loaded: ${recordingConfig.audioFilePath} (${audioData.length} bytes)\n`);
      } catch (error) {
        console.warn(`⚠ Could not load audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.log('  Using simulated audio chunks instead\n');
      }
    }

    // Determine content type
    this.currentContentType = recordingConfig.contentType ||
      this.getContentTypeFromPath(recordingConfig.audioFilePath) ||
      'audio/aac';

    // Resolve chunkSizeBytes and totalChunks — exactly one of the two may be provided
    let chunkSizeBytes: number;
    let totalChunks: number;

    if (audioData && audioData.length > 0) {
      if (sessionConfig.chunkSizeBytes !== undefined) {
        chunkSizeBytes = sessionConfig.chunkSizeBytes;
        totalChunks = Math.ceil(audioData.length / chunkSizeBytes);
      } else if (sessionConfig.totalChunks !== undefined) {
        totalChunks = sessionConfig.totalChunks;
        chunkSizeBytes = Math.ceil(audioData.length / totalChunks);
      } else {
        // Default: 100KB chunks
        chunkSizeBytes = DEFAULT_CHUNK_SIZE;
        totalChunks = Math.ceil(audioData.length / chunkSizeBytes);
      }
    } else {
      // Mock mode: no audio data — chunkSizeBytes controls each mock chunk size
      chunkSizeBytes = sessionConfig.chunkSizeBytes || DEFAULT_CHUNK_SIZE;
      totalChunks = sessionConfig.totalChunks || 3;
    }

    console.log(`\n  Chunk size: ${chunkSizeBytes} bytes (${(chunkSizeBytes / 1024).toFixed(1)}KB)`);
    console.log(`  Total chunks: ${totalChunks}${audioData ? ` (from ${audioData.length} bytes of audio)` : ' (mock)'}`);

    // Register audio with callback service
    if (callbackUrl && audioData && audioData.length > 0) {
      try {
        await axios.post(
          `${callbackUrl}/simulator/register`,
          {
            sessionID: this.sessionId,
            recording: this.recordingVersion,
            totalChunks,
            audioData: audioData.toString('base64'),
            contentType: this.currentContentType,
          },
          { headers: { 'Content-Type': 'application/json' } },
        );
        console.log(`✓ Registered audio with callbackUrl: ${callbackUrl}`);
      } catch (err) {
        console.warn(`⚠ Failed to register audio with callbackUrl ${callbackUrl}: ${err instanceof Error ? err.message : err}`);
      }
    }

    const duplicateChunkProbability = sessionConfig.duplicateChunkProbability || 0;
    const concurrentChunkBatchSize = sessionConfig.concurrentChunkBatchSize || 0;

    // Send chunks
    await this.sendRecordingChunks(
      totalChunks,
      chunkDelayMs,
      audioData,
      duplicateChunkProbability,
      concurrentChunkBatchSize,
      chunkSizeBytes,
    );

    // Send recording available
    const recordingDelayMs = sessionConfig.recordingDelayMs || 2000;
    await this.sendRecordingAvailable(recordingDelayMs, totalChunks, isLastRecording);
  }

  /**
   * Run the complete Epic Haiku workflow simulation
   */
  async runFullSimulation(sessionConfig: SessionConfig): Promise<void> {
    // Build recordings array - either from explicit recordings config or from single audioFilePath
    let recordings: RecordingConfig[] = [];
    if (sessionConfig.recordings && sessionConfig.recordings.length > 0) {
      recordings = sessionConfig.recordings;
    } else {
      // Single recording mode (backward compatible)
      recordings = [{
        audioFilePath: sessionConfig.audioFilePath,
        audioData: sessionConfig.audioData,
        contentType: sessionConfig.contentType,
      }];
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('     Epic Haiku Simulation - Full Workflow');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Base URL: ${this.config.baseUrl}`);
    console.log(`Customer ID: ${this.config.customerID}`);
    console.log(`Haiku Client ID: ${this.config.haikuClientId}`);
    console.log(`Total Recordings: ${recordings.length}`);

    if (recordings.length === 1 && recordings[0].audioFilePath) {
      console.log(`Audio File: ${recordings[0].audioFilePath}`);
    } else if (recordings.length > 1) {
      recordings.forEach((rec, i) => {
        console.log(`  Recording ${i + 1}: ${rec.audioFilePath || 'Mock audio'}`);
      });
    }
    console.log('═══════════════════════════════════════════════════════════\n');

    try {
      // Step 1: Begin session
      await this.beginSession(sessionConfig);
      let end = false;
      if (end) process.exit();

      const betweenRecordingsDelayMs = sessionConfig.betweenRecordingsDelayMs || 1000;

      // Step 2 & 3: Send recordings (chunks + recording available for each)
      for (let i = 0; i < recordings.length; i++) {
        if (i > 0 && betweenRecordingsDelayMs > 0) {
          console.log(`\n→ Waiting ${betweenRecordingsDelayMs}ms before starting next recording...`);
          await this.sleep(betweenRecordingsDelayMs);
        }

        await this.sendSingleRecording(
          recordings[i],
          sessionConfig,
          i,
          recordings.length
        );
      }

      // Step 4: Complete session
      const sessionCompleteDelayMs = 1000;
      await this.sleep(sessionCompleteDelayMs);
      await this.completeSession();

      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('     ✓ Simulation Completed Successfully');
      console.log(`     Total Recordings: ${recordings.length}`);
      console.log('═══════════════════════════════════════════════════════════\n');
    } catch (error) {
      console.error(
        '\n═══════════════════════════════════════════════════════════',
      );
      console.error('     ✗ Simulation Failed');
      console.error('═══════════════════════════════════════════════════════════\n');
      throw error;
    }
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get the current recording version
   */
  getRecordingVersion(): string {
    return this.recordingVersion;
  }
}
