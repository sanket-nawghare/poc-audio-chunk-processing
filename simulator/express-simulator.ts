import express from 'express';
import bodyParser from 'body-parser';
import type { Server } from 'http';

type StoredAudio = {
  buffer: Buffer; 
  totalChunks: number;
  contentType?: string;
};

export async function startExpressSimulator(port = 3333): Promise<{ url: string; stop: () => Promise<void> }> {
  const app = express();
  app.use(bodyParser.json({ limit: '50mb' }));

  const store = new Map<string, StoredAudio>();

  // Register audio for a session
  app.post('/simulator/register', (req, res) => {
    try {
      const { sessionID, recording, totalChunks, audioData } = req.body as any;
      if (!sessionID) return res.status(400).json({ error: 'missing sessionID' });

      let buffer: Buffer | undefined;
      const contentTypeFromBody = (req.body && req.body.contentType) || undefined;
      const contentTypeHeader = req.headers['content-type'] as string | undefined;
      const contentType = contentTypeFromBody || contentTypeHeader || 'audio/aac';
      if (audioData) {
        buffer = Buffer.from(audioData, 'base64');
      }

      if (!buffer) {
        // no audio provided - keep empty buffer
        buffer = Buffer.alloc(0);
      }

      const storeKey = recording ? `${sessionID}:${recording}` : sessionID;
      store.set(storeKey, {
        buffer,
        totalChunks: Number(totalChunks) || 1,
        contentType,
      });

      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Endpoint expected by workers to fetch a chunk
  app.post('/api/epic/2021/Clinical/VoiceAssistant/GetAmbientRecordingChunk', (req, res) => {
    try {
      const { sessionID, recording, chunk } = req.body as any;

      if (!sessionID || !chunk) {
        return res.status(400).json({ error: 'missing sessionID or chunk' });
      }

      const storeKey = recording ? `${sessionID}:${recording}` : sessionID;
      const stored = store.get(storeKey);
      let chunkBuffer: Buffer;

      if (stored && stored.buffer && stored.buffer.length > 0) {
        console.log('send chunk here');
        
        const totalChunks = stored.totalChunks || 1;
        const chunkSize = Math.ceil(stored.buffer.length / totalChunks);
        const chunkNumber = Number(chunk);
        const startIndex = (chunkNumber - 1) * chunkSize;
        const endIndex = Math.min(chunkNumber * chunkSize, stored.buffer.length);
        chunkBuffer = stored.buffer.subarray(startIndex, endIndex);
      } else {
        // generate mock AAC-like data if nothing registered
        const size = 10000 + (Number(chunk) * 2000) % 40000;
        const buf = Buffer.alloc(size);
        for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256);
        chunkBuffer = buf;
      }

      // If we stored a contentType for this session, return that; otherwise default to audio/aac
      const storedContentType = stored && (stored as StoredAudio).contentType;
      console.log('storedContentType', storedContentType, chunkBuffer);
      
      res.set('Content-Type', storedContentType || 'audio/aac');
      res.send(chunkBuffer);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Ambient Recordings Processed endpoint
  app.post('/api/epic/2021/Clinical/VoiceAssistant/AmbientRecordingsProcessed', (req, res) => {
    console.log('-------------------AmbientRecordingsProcessed------------------------');
    console.log(req.body);
    console.log('-------------------------------------------');

    
    try {
      res.json({
        data: {
          error: ''
        },
        status: true,
        statusText: true
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Documentation Ready endpoint
  app.post('/api/epic/2021/Clinical/VoiceAssistant/DocumentationReady', (req, res) => {
    console.log('-------------------DocumentationReady------------------------');
    console.log(req.body);
    console.log('-------------------------------------------');
    
    try {
      res.json({
        data: {
          error: ''
        }
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(port, () => resolve(s));
  });

  // const url = `http://host.docker.internal:${port}`;
  const url = `http://localhost:${port}`;
  console.log(`Express simulator started at ${url}`);

  return {
    url,
    stop: async () => {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve(undefined)));
      });
      console.log('Express simulator stopped');
    },
  };
}

export default startExpressSimulator;
