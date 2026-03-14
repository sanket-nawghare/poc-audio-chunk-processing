# POC Usage

This document covers how to run and test the clinical audio POC backend in `poc/`.

## Location

```bash
cd /home/sanket.nawghare@ad.mindbowser.com/projects/haiku-audio-flow-simulator/poc
```

## Install

```bash
npm install
```

## Run Unit Tests

This is the fastest verification path.

```bash
npm test
```

Current coverage in this repo includes the session aggregation behavior test in `tests/unit/session-aggregation.service.spec.ts`.

## Start the POC Server

```bash
npm run dev
```

Default server URL:

```text
http://localhost:8080
```

## Health Check

In a second terminal:

```bash
curl http://localhost:8080/health
```

Expected response:

```json
{"ok":true,"service":"clinical-audio-poc"}
```

## Send Sample Audio Chunks

Send chunks for the same `sessionId` and `recordingId`. Example first chunk:

```bash
curl -X POST http://localhost:8080/audio/chunk \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-123",
    "recordingId": "recording-123",
    "chunkIndex": 0,
    "totalChunks": 3,
    "timestamp": "2026-03-09T10:00:00.000Z",
    "audioRef": "https://simulator.local/chunks/0.wav",
    "patientId": "pat-001",
    "encounterId": "enc-001",
    "appointmentId": "appt-001"
  }'
```

Second chunk:

```bash
curl -X POST http://localhost:8080/audio/chunk \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-123",
    "recordingId": "recording-123",
    "chunkIndex": 1,
    "totalChunks": 3,
    "timestamp": "2026-03-09T10:00:05.000Z",
    "audioRef": "https://simulator.local/chunks/1.wav",
    "patientId": "pat-001",
    "encounterId": "enc-001",
    "appointmentId": "appt-001"
  }'
```

Third chunk:

```bash
curl -X POST http://localhost:8080/audio/chunk \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-123",
    "recordingId": "recording-123",
    "chunkIndex": 2,
    "totalChunks": 3,
    "timestamp": "2026-03-09T10:00:10.000Z",
    "audioRef": "https://simulator.local/chunks/2.wav",
    "patientId": "pat-001",
    "encounterId": "enc-001",
    "appointmentId": "appt-001"
  }'
```

## Inspect Session Output

After all chunks are submitted:

```bash
curl http://localhost:8080/sessions/session-123
curl http://localhost:8080/fhir/media/session-123
curl http://localhost:8080/fhir/document-reference/session-123
```

## Optional Environment Flags

Run with BullMQ enabled:

```bash
USE_BULLMQ=true REDIS_URL=redis://127.0.0.1:6379 npm run dev
```

Run with mock AI chunk analysis enabled:

```bash
ENABLE_AI_CHUNK_ANALYSIS=true npm run dev
```

## Build for Production

```bash
npm run build
npm start
```

## Test With the Existing Simulator

Start the POC:

```bash
cd /home/sanket.nawghare@ad.mindbowser.com/projects/haiku-audio-flow-simulator/poc
npm run dev
```

In another terminal, run the simulator bridge mode from the repo root:

```bash
cd /home/sanket.nawghare@ad.mindbowser.com/projects/haiku-audio-flow-simulator
npx ts-node ./simulator/cli.ts \
  --poc-base-url http://localhost:8080 \
  --customer-id epic-customer-123 \
  --customer-secret secret123 \
  --client-id haiku-client-456 \
  --user-id practitioner-001 \
  --patient-id patient-001 \
  --encounter-id encounter-001 \
  --audio-file ./recordings/test.aac
```

What bridge mode does:

- accepts the simulator's Epic-style `/api/v1.0/haiku/*` requests
- translates `RecordingChunkAvailable` into POC `POST /audio/chunk`
- exposes stable `audioRef` URLs for each chunk
- maps each Epic recording to a POC session ID in the form `<epicSessionId>-recording-<recordingNumber>`

After a run finishes, inspect the generated POC session with the derived session ID shown in the simulator logs:

```bash
curl http://localhost:8080/sessions/<derived-poc-session-id>
curl http://localhost:8080/fhir/media/<derived-poc-session-id>
curl http://localhost:8080/fhir/document-reference/<derived-poc-session-id>
```

## Notes

- Inline processing is the default mode.
- If BullMQ or Redis is unavailable, the service falls back to inline processing.
- The in-memory store is reset when the process restarts.
