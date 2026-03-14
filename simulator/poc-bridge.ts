import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import type { Server } from 'http';

type SessionContext = {
  patientId: string;
  encounterId: string;
  appointmentId?: string;
};

type StoredAudio = {
  buffer: Buffer;
  totalChunks: number;
  contentType?: string;
};

type RecordingState = {
  totalChunks?: number;
};

function selectIdentifier(
  identifiers: Array<{ ID?: string; Type?: string }> | undefined,
): string {
  if (!identifiers || identifiers.length === 0) {
    return 'unknown';
  }

  const preferred = identifiers.find((value) => value.Type === 'FHIR' && value.ID);
  if (preferred?.ID) {
    return preferred.ID.trim();
  }

  const fallback = identifiers.find((value) => value.ID);
  return fallback?.ID?.trim() || 'unknown';
}

function buildStoreKey(sessionID: string, recording: string): string {
  return `${sessionID}:${recording}`;
}

function buildPocSessionId(sessionID: string, recording: string): string {
  return `${sessionID}-recording-${recording}`;
}

export async function startPocBridge(
  pocBaseUrl: string,
  port = 3334,
): Promise<{ url: string; stop: () => Promise<void> }> {
  const app = express();
  app.use(bodyParser.json({ limit: '50mb' }));

  const sessionContexts = new Map<string, SessionContext>();
  const audioStore = new Map<string, StoredAudio>();
  const recordingState = new Map<string, RecordingState>();

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'epic-haiku-poc-bridge', pocBaseUrl });
  });

  app.post('/api/v1.0/haiku/AmbientSessionBegin', (req, res) => {
    const { sessionID, patientID, encounterID, appointmentID } = req.body as {
      sessionID?: string;
      patientID?: Array<{ ID?: string; Type?: string }>;
      encounterID?: Array<{ ID?: string; Type?: string }>;
      appointmentID?: string;
    };

    if (!sessionID) {
      return res.status(400).json({ error: 'missing sessionID' });
    }

    sessionContexts.set(sessionID, {
      patientId: selectIdentifier(patientID),
      encounterId: selectIdentifier(encounterID),
      appointmentId: appointmentID,
    });

    console.log(
      `[POC bridge] session started ${sessionID} -> patient=${selectIdentifier(patientID)} encounter=${selectIdentifier(encounterID)}`,
    );

    return res.json({
      sessionID,
      status: 'accepted',
      mode: 'poc-bridge',
    });
  });

  app.post('/api/v1.0/haiku/RecordingChunkAvailable', async (req, res) => {
    const { sessionID, recording, chunk, totalChunks } = req.body as {
      sessionID?: string;
      recording?: string;
      chunk?: string;
      totalChunks?: string | number;
    };

    if (!sessionID || !recording || !chunk) {
      return res.status(400).json({ error: 'missing sessionID, recording, or chunk' });
    }

    const context = sessionContexts.get(sessionID);
    if (!context) {
      return res.status(400).json({ error: `unknown sessionID ${sessionID}` });
    }

    const chunkNumber = Number(chunk);
    if (!Number.isInteger(chunkNumber) || chunkNumber <= 0) {
      return res.status(400).json({ error: 'chunk must be a positive integer string' });
    }

    const storeKey = buildStoreKey(sessionID, recording);
    const knownTotalChunks =
      Number(totalChunks) ||
      recordingState.get(storeKey)?.totalChunks ||
      audioStore.get(storeKey)?.totalChunks;

    if (knownTotalChunks) {
      recordingState.set(storeKey, { totalChunks: knownTotalChunks });
    }

    const pocPayload = {
      sessionId: buildPocSessionId(sessionID, recording),
      recordingId: recording,
      chunkIndex: chunkNumber - 1,
      totalChunks: knownTotalChunks || undefined,
      timestamp: new Date().toISOString(),
      audioRef: `http://localhost:${port}/simulator/audio/${encodeURIComponent(sessionID)}/${encodeURIComponent(recording)}/${encodeURIComponent(chunk)}`,
      patientId: context.patientId,
      encounterId: context.encounterId,
      appointmentId: context.appointmentId,
    };

    try {
      const response = await axios.post(`${pocBaseUrl}/audio/chunk`, pocPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });

      console.log(
        `[POC bridge] forwarded chunk session=${pocPayload.sessionId} recording=${recording} chunkIndex=${pocPayload.chunkIndex}`,
      );

      return res.json({
        status: 'accepted',
        pocSessionId: pocPayload.sessionId,
        data: response.data,
      });
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data || error.message
        : String(error);
      console.error(`[POC bridge] failed to forward chunk:`, message);
      return res.status(502).json({ error: 'failed to forward chunk', details: message });
    }
  });

  app.post('/api/v1.0/haiku/RecordingAvailable', (req, res) => {
    const { sessionID, recording, totalChunks } = req.body as {
      sessionID?: string;
      recording?: string;
      totalChunks?: string | number;
    };

    if (!sessionID || !recording) {
      return res.status(400).json({ error: 'missing sessionID or recording' });
    }

    const numericTotalChunks = Number(totalChunks);
    if (numericTotalChunks > 0) {
      recordingState.set(buildStoreKey(sessionID, recording), {
        totalChunks: numericTotalChunks,
      });
    }

    const pocSessionId = buildPocSessionId(sessionID, recording);
    console.log(
      `[POC bridge] recording completed epicSession=${sessionID} recording=${recording} pocSession=${pocSessionId} totalChunks=${numericTotalChunks || 'unknown'}`,
    );

    return res.json({
      status: 'accepted',
      pocSessionId,
      totalChunks: numericTotalChunks || undefined,
    });
  });

  app.post('/api/v1.0/haiku/AmbientSessionComplete', (req, res) => {
    const { sessionID } = req.body as { sessionID?: string };
    if (sessionID) {
      console.log(`[POC bridge] session completed ${sessionID}`);
    }
    res.json({ status: 'accepted', sessionID });
  });

  app.post('/simulator/register', (req, res) => {
    try {
      const { sessionID, recording, totalChunks, audioData } = req.body as {
        sessionID?: string;
        recording?: string;
        totalChunks?: number;
        audioData?: string;
      };

      if (!sessionID) {
        return res.status(400).json({ error: 'missing sessionID' });
      }

      const buffer = audioData ? Buffer.from(audioData, 'base64') : Buffer.alloc(0);
      const contentType =
        ((req.body && (req.body as { contentType?: string }).contentType) || undefined) ??
        'audio/aac';
      const storeKey = buildStoreKey(sessionID, recording || '1');

      audioStore.set(storeKey, {
        buffer,
        totalChunks: Number(totalChunks) || 1,
        contentType,
      });
      recordingState.set(storeKey, { totalChunks: Number(totalChunks) || 1 });

      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/simulator/audio/:sessionID/:recording/:chunk', (req, res) => {
    try {
      const { sessionID, recording, chunk } = req.params;
      const storeKey = buildStoreKey(sessionID, recording);
      const stored = audioStore.get(storeKey);
      let chunkBuffer: Buffer;

      if (stored && stored.buffer.length > 0) {
        const totalChunks = stored.totalChunks || 1;
        const chunkNumber = Number(chunk);
        const chunkSize = Math.ceil(stored.buffer.length / totalChunks);
        const startIndex = (chunkNumber - 1) * chunkSize;
        const endIndex = Math.min(chunkNumber * chunkSize, stored.buffer.length);
        chunkBuffer = stored.buffer.subarray(startIndex, endIndex);
        res.set('Content-Type', stored.contentType || 'audio/aac');
      } else {
        chunkBuffer = Buffer.alloc(0);
        res.set('Content-Type', 'application/octet-stream');
      }

      res.send(chunkBuffer);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  const server: Server = await new Promise((resolve) => {
    const started = app.listen(port, () => resolve(started));
  });

  const url = `http://localhost:${port}`;
  console.log(`POC bridge started at ${url} -> ${pocBaseUrl}`);

  return {
    url,
    stop: async () => {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve(undefined)));
      });
      console.log('POC bridge stopped');
    },
  };
}

export default startPocBridge;
