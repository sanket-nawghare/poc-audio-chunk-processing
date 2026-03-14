# Using the Simulator With the POC

This document explains how to drive the POC backend with the existing Epic Haiku simulator code in `simulator/`.

## Purpose

The simulator emits Epic-style events such as:

- `AmbientSessionBegin`
- `RecordingChunkAvailable`
- `RecordingAvailable`
- `AmbientSessionComplete`

The POC backend does not accept those endpoints directly. It accepts normalized chunk ingestion at:

- `POST /audio/chunk`

To connect the two, the simulator now supports a local bridge mode.

## How Bridge Mode Works

When you pass `--poc-base-url`, the simulator starts a local bridge service that:

- accepts the simulator's `/api/v1.0/haiku/*` requests
- translates each `RecordingChunkAvailable` event into a POC `POST /audio/chunk` request
- preserves patient and encounter identifiers from the simulator session
- exposes a stable `audioRef` URL for each simulated chunk

## Prerequisites

From the repo root:

```bash
cd /home/sanket.nawghare@ad.mindbowser.com/projects/haiku-audio-flow-simulator
```

Make sure dependencies are installed:

```bash
npm install
cd poc
npm install
```

## Step 1: Start the POC Backend

In one terminal:

```bash
cd /home/sanket.nawghare@ad.mindbowser.com/projects/haiku-audio-flow-simulator/poc
npm run dev
```

Default POC URL:

```text
http://localhost:8080
```

Optional health check:

```bash
curl http://localhost:8080/health
```

## Step 2: Run the Simulator in POC Bridge Mode

In a second terminal, from the repo root:

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
  --chunks 3
```

What happens:

- the CLI starts the local bridge on `http://localhost:3334` by default
- the simulator sends Epic-style requests to the bridge
- the bridge forwards chunk events into the POC backend

## Example With a Real Audio File

```bash
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

## Useful CLI Options

- `--poc-base-url <url>`: enables bridge mode and points the bridge at the POC backend
- `--poc-bridge-port <port>`: changes the local bridge port from `3334`
- `--chunks <number>`: fixed number of chunks per recording
- `--chunk-size <kb>`: derive chunk count from audio file size
- `--duplicate-probability <0-1>`: simulate duplicate chunk delivery
- `--concurrent-batch <number>`: send chunks concurrently in batches
- `--recordings <number>`: simulate multiple recordings in one Epic session
- `--audio-file <path>`: use actual audio input instead of mock chunks
- `--instances <number>`: run multiple concurrent simulator instances

## How Session IDs Map Into the POC

The Epic simulator creates one Epic session ID, for example:

```text
sim-1773157454662-3ntwjowts
```

The bridge converts each recording into a POC session ID:

```text
<epicSessionId>-recording-<recordingNumber>
```

Example:

```text
sim-1773157454662-3ntwjowts-recording-1
```

This mapping is required because the current POC session model only supports one `recordingId` per session.

## Step 3: Verify the POC Output

After the simulator run completes, use the derived POC session ID from the simulator logs.

Example:

```bash
curl http://localhost:8080/sessions/sim-1773157454662-3ntwjowts-recording-1
curl http://localhost:8080/fhir/media/sim-1773157454662-3ntwjowts-recording-1
curl http://localhost:8080/fhir/document-reference/sim-1773157454662-3ntwjowts-recording-1
```

Expected result:

- session status becomes `completed` when all chunks arrive
- `expectedTotalChunks` matches the simulator run
- chunk metadata includes `audioRef`, patient ID, and encounter ID

## Recommended Test Cases

### 1. Basic happy path

```bash
npx ts-node ./simulator/cli.ts \
  --poc-base-url http://localhost:8080 \
  --customer-id epic-customer-123 \
  --customer-secret secret123 \
  --client-id haiku-client-456 \
  --user-id practitioner-001 \
  --patient-id patient-001 \
  --encounter-id encounter-001 \
  --chunks 3
```

### 2. Duplicate chunk simulation

```bash
npx ts-node ./simulator/cli.ts \
  --poc-base-url http://localhost:8080 \
  --customer-id epic-customer-123 \
  --customer-secret secret123 \
  --client-id haiku-client-456 \
  --user-id practitioner-001 \
  --patient-id patient-001 \
  --encounter-id encounter-001 \
  --chunks 5 \
  --duplicate-probability 0.4
```

### 3. Concurrent chunk delivery

```bash
npx ts-node ./simulator/cli.ts \
  --poc-base-url http://localhost:8080 \
  --customer-id epic-customer-123 \
  --customer-secret secret123 \
  --client-id haiku-client-456 \
  --user-id practitioner-001 \
  --patient-id patient-001 \
  --encounter-id encounter-001 \
  --chunks 8 \
  --concurrent-batch 3
```

### 4. Multi-recording Epic session

```bash
npx ts-node ./simulator/cli.ts \
  --poc-base-url http://localhost:8080 \
  --customer-id epic-customer-123 \
  --customer-secret secret123 \
  --client-id haiku-client-456 \
  --user-id practitioner-001 \
  --patient-id patient-001 \
  --encounter-id encounter-001 \
  --recordings 2 \
  --chunks 4
```

For multi-recording runs, inspect one derived POC session per recording.

## Notes

- Without `--poc-base-url`, the simulator uses the existing local express simulator instead of the POC bridge.
- The bridge is intended for local testing only.
- The POC store is in-memory, so restarting the POC clears all sessions.
