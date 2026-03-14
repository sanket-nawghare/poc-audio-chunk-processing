# Clinical Audio Chunk POC

POC backend for ingesting simulated clinical audio chunks, assembling sessions, and generating FHIR-compatible metadata.

## Features

- `POST /audio/chunk` ingestion endpoint
- Session aggregation with duplicate/out-of-order/missing detection
- Session metadata generation on completion/partial state
- FHIR output endpoints:
  - `GET /fhir/media/:sessionId`
  - `GET /fhir/document-reference/:sessionId`
- Optional BullMQ queue-based async processing
- Optional AI chunk analysis hook (mock implementation)

## Queue Modes

- Inline mode (default): processes chunks in request path.
- BullMQ mode: set `USE_BULLMQ=true` and configure `REDIS_URL` in `.env`.

## Environment

Copy the sample file and adjust values:

```bash
cp .env.example .env
```

Variables:

- `PORT`: API port (default `8080`)
- `USE_BULLMQ`: enables BullMQ queue processing (`true`/`false`)
- `REDIS_URL`: Redis DSN used by BullMQ (only used when `USE_BULLMQ=true`)
- `ENABLE_AI_CHUNK_ANALYSIS`: enables mock AI chunk signal extraction

Example:

```bash
USE_BULLMQ=true REDIS_URL=redis://127.0.0.1:6379 npm run dev
```

If BullMQ or Redis is unavailable, service falls back to inline processing and logs a warning.

## AI Integration Hook

Set `ENABLE_AI_CHUNK_ANALYSIS=true` to enable mock AI signals per chunk.

Current mock behavior:

- emits `periodic-clinical-cue` every 10th chunk.

This is designed for replacing with a real model/service later.

## Run

```bash
cd poc
npm install
npm run dev
```

## Sample Chunk

```json
{
  "sessionId": "session-123",
  "recordingId": "recording-123",
  "chunkIndex": 0,
  "totalChunks": 3,
  "timestamp": "2026-03-09T10:00:00.000Z",
  "audioRef": "https://simulator.local/chunks/0.wav",
  "patientId": "pat-001",
  "encounterId": "enc-001",
  "appointmentId": "appt-001"
}
```

## Design Notes

- Queue abstraction allows processing backend swap (inline/BullMQ).
- Session store is in-memory for POC simplicity.
- FHIR mapping focuses on `Media` and optional `DocumentReference`.
- No transcription or PHI persistence is implemented.
