# POC Audio Chunk Processing

A proof-of-concept system that simulates the Epic Haiku ambient audio workflow and processes audio chunks through a backend POC service.

---

## Architecture Overview

```
Simulator (CLI)
    │
    │  Epic Haiku API calls
    ▼
POC Bridge (localhost:3334)        ← translates Epic Haiku format → POC format
    │
    │  POST /audio/chunk
    ▼
POC Backend (localhost:8080)       ← stores chunks, assembles audio, generates FHIR
```

---

## Quick Start

### 1. Start the POC Backend

```bash
cd poc
npm install
npm run dev
```

The backend starts on `http://localhost:8080`. Configure via `poc/.env`:

```env
PORT=8080
USE_BULLMQ=false              # set true to use Redis/BullMQ queue
REDIS_URL=redis://127.0.0.1:6379
ENABLE_AI_CHUNK_ANALYSIS=false
AUDIO_BASE_URL=http://localhost:8080/audio
AUDIO_STORAGE_PATH=./tmp/audio
```

### 2. Run the Simulator

From the project root:

```bash
npm install
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

The simulator:
1. Starts a local **POC Bridge** on port `3334`
2. Calls Epic Haiku-style endpoints on the bridge
3. The bridge translates and forwards each chunk to the POC backend

---

## Simulator Options

| Option | Default | Description |
|--------|---------|-------------|
| `--poc-base-url` | — | POC backend URL. Starts the POC bridge when set |
| `--customer-id` | required | Epic customer ID |
| `--customer-secret` | required | Epic customer secret |
| `--client-id` | required | Haiku client ID |
| `--user-id` | required | Practitioner/user ID |
| `--patient-id` | required | Patient ID |
| `--encounter-id` | required | Encounter ID |
| `--audio-file` | — | Path to audio file. Can be repeated for multiple recordings |
| `--recordings` | 1 | Total number of recordings (pads with mock audio if fewer `--audio-file` given) |
| `--chunks` | — | Fixed number of chunks per recording (mutually exclusive with `--chunk-size`) |
| `--chunk-size` | 100 KB | Chunk size in KB; derives chunk count from audio length |
| `--chunk-delay` | 500 ms | Delay between sending chunks |
| `--recording-delay` | 2000 ms | Delay before signalling recording available |
| `--between-recordings-delay` | 1000 ms | Delay between recordings in a session |
| `--instances` | 1 | Number of concurrent simulator instances |
| `--concurrent-batch` | 0 | Chunks to send in parallel (0 = sequential) |
| `--duplicate-probability` | 0 | Probability (0.0–1.0) of sending a duplicate chunk |
| `--poc-bridge-port` | 3334 | Local port for the POC bridge |

### Examples

**Mock audio, fixed chunk count:**
```bash
npx ts-node ./simulator/cli.ts \
  --customer-id epic-customer-123 --customer-secret secret123 \
  --client-id haiku-client-456 --user-id practitioner-001 \
  --patient-id patient-001 --encounter-id encounter-001 \
  --chunks 5
```

**Real audio file, auto chunk size:**
```bash
npx ts-node ./simulator/cli.ts \
  --poc-base-url http://localhost:8080 \
  --customer-id epic-customer-123 --customer-secret secret123 \
  --client-id haiku-client-456 --user-id practitioner-001 \
  --patient-id patient-001 --encounter-id encounter-001 \
  --audio-file ./recordings/test.aac \
  --chunk-size 50
```

**Multiple concurrent instances (load test):**
```bash
npx ts-node ./simulator/cli.ts \
  --poc-base-url http://localhost:8080 \
  --customer-id epic-customer-123 --customer-secret secret123 \
  --client-id haiku-client-456 --user-id practitioner-001 \
  --patient-id patient-001 --encounter-id encounter-001 \
  --audio-file ./recordings/test.aac \
  --instances 5
```

---

## POC Backend Endpoints

### Health Check

```
GET /health
```

```json
{ "ok": true, "service": "clinical-audio-poc" }
```

---

### Ingest Audio Chunk

```
POST /audio/chunk
Content-Type: application/json
```

**Request body:**
```json
{
  "sessionId":    "sim-1234567890-abc123-recording-1",
  "recordingId":  "1",
  "chunkIndex":   0,
  "totalChunks":  3,
  "timestamp":    "2026-03-14T10:00:00.000Z",
  "audioRef":     "http://localhost:3334/simulator/audio/session/1/1",
  "patientId":    "patient-001",
  "encounterId":  "encounter-001"
}
```

**Response `202`:**
```json
{
  "message": "Chunk accepted for processing",
  "sessionId": "sim-1234567890-abc123-recording-1",
  "chunkIndex": 0
}
```

---

### Get Session (raw)

```
GET /sessions/:sessionId
```

Returns the live session state including all received chunks.

**Response `200`:**
```json
{
  "sessionId": "sim-1234567890-abc123-recording-1",
  "recordingId": "1",
  "patientId": "patient-001",
  "encounterId": "encounter-001",
  "status": "completed",
  "expectedTotalChunks": 2,
  "chunksByIndex": [
    {
      "sessionId": "sim-1234567890-abc123-recording-1",
      "chunkIndex": 0,
      "audioRef": "http://...",
      "timestamp": "2026-03-14T10:00:00.000Z",
      "receivedAt": "2026-03-14T10:00:00.123Z"
    }
  ],
  "duplicateChunkIndexes": [],
  "outOfOrderCount": 0,
  "startedAt": "2026-03-14T10:00:00.000Z",
  "updatedAt": "2026-03-14T10:00:02.000Z",
  "completedAt": "2026-03-14T10:00:02.000Z"
}
```

> **Note:** Available for all sessions (in-progress and completed). Returns `404` if the session ID is unknown.

---

### Get FHIR Media Resource

```
GET /fhir/media/:sessionId
```

Returns a FHIR R4 `Media` resource for the completed session.

**Response `200`:**
```json
{
  "resourceType": "Media",
  "id": "sim-1234567890-abc123-recording-1",
  "status": "completed",
  "type": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/media-type",
      "code": "audio",
      "display": "Audio"
    }]
  },
  "subject": { "reference": "Patient/patient-001" },
  "encounter": { "reference": "Encounter/encounter-001" },
  "createdDateTime": "2026-03-14T10:00:02.000Z",
  "content": {
    "contentType": "audio/wav",
    "url": "http://localhost:8080/audio/sim-1234567890-abc123-recording-1.aac",
    "title": "Clinical Audio sim-1234567890-abc123-recording-1"
  }
}
```

> **Note:** Returns `404` until the session is fully completed.

---

### Get FHIR DocumentReference Resource

```
GET /fhir/document-reference/:sessionId
```

Returns a FHIR R4 `DocumentReference` resource for the completed session.

**Response `200`:**
```json
{
  "resourceType": "DocumentReference",
  "id": "sim-1234567890-abc123-recording-1",
  "status": "current",
  "subject": { "reference": "Patient/patient-001" },
  "context": {
    "encounter": [{ "reference": "Encounter/encounter-001" }]
  },
  "type": { "text": "Clinical Audio Recording" },
  "content": [{
    "attachment": {
      "contentType": "audio/wav",
      "url": "http://localhost:8080/audio/sim-1234567890-abc123-recording-1.aac",
      "title": "Session sim-1234567890-abc123-recording-1 audio",
      "creation": "2026-03-14T10:00:02.000Z"
    }
  }]
}
```

> **Note:** Returns `404` until the session is fully completed.

---

### Download Assembled Audio

```
GET /audio/:sessionId.:ext
```

Serves the assembled audio file directly (static file).

```bash
curl http://localhost:8080/audio/sim-1234567890-abc123-recording-1.aac \
  --output session.aac
```

The `audioUrl` field in both FHIR responses contains the exact URL to use.

---

## Typical Flow

```
1. Run simulator  →  session starts, chunks are forwarded to POC backend
2. Wait for "✓ Simulation completed" in simulator output
3. Copy the sessionId from the simulator logs
4. GET /sessions/:sessionId          →  verify all chunks received, status = "completed"
5. GET /fhir/media/:sessionId        →  get FHIR Media resource
6. GET /fhir/document-reference/:sessionId  →  get FHIR DocumentReference
7. GET /audio/:sessionId.aac         →  download assembled audio file
```

---

## Project Structure

```
.
├── simulator/               # Epic Haiku simulator (CLI + bridge)
│   ├── cli.ts               # Entry point: npx ts-node ./simulator/cli.ts
│   ├── epic-haiku.simulator.ts  # Simulates Epic Haiku API calls
│   └── poc-bridge.ts        # Translates Epic Haiku → POC format
│
└── poc/                     # POC backend (Express)
    ├── .env                 # Environment config
    ├── src/
    │   ├── server.ts        # Entry point
    │   ├── app.ts           # Express app + routes
    │   ├── api/             # Route definitions
    │   ├── controllers/     # Request handlers
    │   ├── services/        # Business logic
    │   │   ├── chunk-ingestion.service.ts
    │   │   ├── chunk-validation.service.ts
    │   │   ├── session-aggregation.service.ts
    │   │   ├── audio-storage.service.ts
    │   │   ├── metadata-generator.service.ts
    │   │   └── fhir-mapper.service.ts
    │   ├── models/          # TypeScript interfaces
    │   └── stores/          # In-memory session/metadata store
    └── tmp/audio/           # Assembled audio files (auto-created)
```
