# Epic Haiku Simulator

A comprehensive TypeScript simulator for testing the Epic Haiku voice assistant integration without requiring actual Epic infrastructure.

## Overview

The Epic Haiku Simulator replicates the complete workflow of Epic's Haiku voice recording system:

1. **Ambient Session Begin** - Initializes a recording session with patient and encounter context
2. **Recording Chunk Available** - Notifies about individual audio chunks from the recording
3. **Recording Available** - Signals completion of the recording and all chunks
4. **Session Complete** - Cleans up the session

## Architecture

### Core Components

#### `epic-haiku.simulator.ts` - Main Simulator Class

The `EpicHaikuSimulator` class manages the simulation workflow:

```typescript
const simulator = new EpicHaikuSimulator({
  baseUrl: 'http://localhost:3000',
  customerID: 'epic-customer-123',
  customerSecret: 'secret123',
  haikuClientId: 'haiku-client-456',
});

await simulator.runFullSimulation({
  userID: 'practitioner-001',
  patientID: [{ ID: 'patient-001', Type: 'FHIR' }],
  encounterID: [{ ID: 'encounter-001', Type: 'FHIR' }],
  totalChunks: 3,
  chunkDelayMs: 500,
  recordingDelayMs: 2000,
});
```

**Key Methods:**

- `beginSession(sessionConfig)` - Start an ambient session
- `sendRecordingChunks(totalChunks, chunkDelayMs)` - Send recording chunk notifications
- `sendRecordingAvailable(recordingDelayMs)` - Send recording available notification
- `completeSession()` - Complete and clean up session
- `runFullSimulation(sessionConfig)` - Execute the complete workflow

#### `scenarios.ts` - Pre-configured Test Scenarios

The `SimulationScenarios` class provides ready-to-use test cases:

```typescript
const scenarios = new SimulationScenarios(simulatorConfig);

// Run specific scenario
await scenarios.runScenario(ScenarioType.MULTIPLE_CHUNKS, sessionConfig);

// Run all scenarios
await scenarios.runAllScenarios(sessionConfig);
```

**Available Scenarios:**

1. **BASIC** - Standard 3-chunk recording with normal timing
2. **MULTIPLE_CHUNKS** - Long recording with 10 chunks
3. **QUICK_RECORDING** - Single chunk, minimal delays
4. **SLOW_PROCESSING** - 5 chunks with extended delays

#### `cli.ts` - Command-line Interface

CLI tool for running simulations from the terminal:

```bash
npx ts-node apps/api/src/common/simulator/cli.ts \
  --base-url http://localhost:3000 \
  --customer-id epic-customer-123 \
  --customer-secret secret123 \
  --client-id haiku-client-456 \
  --user-id practitioner-001 \
  --patient-id patient-001 \
  --encounter-id encounter-001 \
  --chunks 3 \
  --chunk-delay 500 \
  --recording-delay 2000
```

## Usage

### 1. Basic Usage in Code

```typescript
import { EpicHaikuSimulator } from './epic-haiku.simulator.js';

const simulator = new EpicHaikuSimulator({
  baseUrl: process.env.API_URL || 'http://localhost:3000',
  customerID: 'your-customer-id',
  customerSecret: 'your-customer-secret',
  haikuClientId: 'your-haiku-client-id',
});

await simulator.runFullSimulation({
  userID: 'practitioner-123',
  patientID: [{ ID: 'patient-456', Type: 'FHIR' }],
  encounterID: [{ ID: 'encounter-789', Type: 'FHIR' }],
  totalChunks: 3,
  chunkDelayMs: 500,
  recordingDelayMs: 2000,
});
```

### 2. Using Scenarios

```typescript
import { SimulationScenarios, ScenarioType } from './scenarios.js';

const scenarios = new SimulationScenarios(simulatorConfig);

// Run a specific scenario
await scenarios.runScenario(
  ScenarioType.MULTIPLE_CHUNKS,
  {
    userID: 'practitioner-123',
    patientID: [{ ID: 'patient-456', Type: 'FHIR' }],
    encounterID: [{ ID: 'encounter-789', Type: 'FHIR' }],
  }
);

// Run all scenarios
await scenarios.runAllScenarios({
  userID: 'practitioner-123',
  patientID: [{ ID: 'patient-456', Type: 'FHIR' }],
  encounterID: [{ ID: 'encounter-789', Type: 'FHIR' }],
});
```

### 3. CLI Usage

#### Run Basic Simulation

```bash
npx ts-node apps/api/src/common/simulator/cli.ts \
  --base-url http://localhost:3000 \
  --customer-id customer123 \
  --customer-secret secret123 \
  --client-id client456 \
  --user-id practitioner001 \
  --patient-id patient001 \
  --encounter-id encounter001
```

#### Run with Custom Configuration

```bash
npx ts-node apps/api/src/common/simulator/cli.ts \
  --base-url http://api.example.com \
  --customer-id my-customer \
  --customer-secret my-secret \
  --client-id my-client \
  --user-id doctor123 \
  --patient-id patient456 \
  --encounter-id visit789 \
  --chunks 10 \
  --chunk-delay 300 \
  --recording-delay 5000 \
  --note-type "Office Note"
```

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Epic Haiku Simulator                      │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ AmbientSessionBegin  │
                  │ (Initialize Session) │
                  └──────────────────────┘
                             │
                             ▼
                  ┌──────────────────────────┐
                  │ RecordingChunkAvailable  │  ◄─┐
                  │ (Send Chunk N)           │   │
                  └──────────────────────────┘   │
                             │                  │
                             ├─────────────────┘
                             │ (repeat for each chunk)
                             ▼
                  ┌──────────────────────┐
                  │ RecordingAvailable   │
                  │ (All chunks sent)    │
                  └──────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │AmbientSessionComplete│
                  │ (Clean up session)   │
                  └──────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  Simulation Complete │
                  └──────────────────────┘
```

## Configuration Reference

### SimulatorConfig Interface

```typescript
interface SimulatorConfig {
  baseUrl: string;                // API base URL (e.g., http://localhost:3000)
  customerID: string;             // Epic customer ID
  customerSecret: string;         // Epic customer secret
  haikuClientId: string;          // Haiku client ID for authentication
}
```

### SessionConfig Interface

```typescript
interface SessionConfig {
  userID: string;                           // Practitioner/User ID
  patientID: Array<{ ID: string; Type: string }>;      // Patient identifiers (FHIR)
  encounterID: Array<{ ID: string; Type: string }>;    // Encounter identifiers (FHIR)
  noteType?: string;                       // Type of note (default: "Clinic Note")
  totalChunks?: number;                    // Number of chunks to simulate (default: 3)
  chunkDelayMs?: number;                   // Delay between chunks in ms (default: 500)
  recordingDelayMs?: number;               // Delay before recording available in ms (default: 2000)
}
```

## Output Example

```
═══════════════════════════════════════════════════════════
     Epic Haiku Simulation - Full Workflow
═══════════════════════════════════════════════════════════
Base URL: http://localhost:3000
Customer ID: customer123
Haiku Client ID: haiku456
═══════════════════════════════════════════════════════════

[Step 1] POST http://localhost:3000/api/v1.0/haiku/AmbientSessionBegin
Payload: {
  "userID": "practitioner-001",
  "sessionID": "sim-1702097845000-xyz123abc",
  ...
}
✓ Response (200): {
  "sessionID": "sim-1702097845000-xyz123abc",
  "userID": "practitioner-001"
}

→ Session sim-1702097845000-xyz123abc started

→ Sending 3 recording chunks...

[Step 2] POST http://localhost:3000/api/v1.0/haiku/RecordingChunkAvailable
Payload: {
  "sessionID": "sim-1702097845000-xyz123abc",
  "recording": "457123",
  "chunk": "1"
}
✓ Response (200): {
  "message": "Added send recording chunk to queue"
}

...

═══════════════════════════════════════════════════════════
     ✓ Simulation Completed Successfully
═══════════════════════════════════════════════════════════
```

## Testing Scenarios

### Scenario 1: Basic Workflow
- **Purpose:** Verify standard Epic Haiku integration
- **Chunks:** 3
- **Timing:** 500ms between chunks, 2s before recording available
- **Use Case:** Daily testing, CI/CD pipelines

### Scenario 2: Multiple Chunks
- **Purpose:** Test handling of longer recordings
- **Chunks:** 10
- **Timing:** 300ms between chunks, 3s before recording available
- **Use Case:** Load testing, performance verification

### Scenario 3: Quick Recording
- **Purpose:** Test rapid processing
- **Chunks:** 1
- **Timing:** No delay between chunks, 500ms before recording available
- **Use Case:** Edge case testing, quick integration checks

### Scenario 4: Slow Processing
- **Purpose:** Test resilience with network delays
- **Chunks:** 5
- **Timing:** 2s between chunks, 5s before recording available
- **Use Case:** Robustness testing, timeout verification

## Integration with Worker Queues

The simulator works seamlessly with the BullMQ worker system:

1. **RecordingChunkAvailable** triggers `sendRecordingChunk` worker
   - Fetches audio chunk from callbackUrl
   - Transcribes the chunk
   - Decrements chunk counter in Redis

2. **RecordingAvailable** triggers `sendRecordingAvailable` worker
   - Waits for all chunks to be processed
   - Generates clinical note
   - Sends documentation ready callback

## Error Handling

The simulator includes comprehensive error handling:

- **Network Errors:** Caught and logged with full details
- **Timeout Errors:** 30-second timeout per request
- **Validation Errors:** Proper HTTP status code handling
- **Step Failure:** Stops execution and reports step number

## Best Practices

1. **Use environment variables for sensitive data**
   ```bash
   export SIMULATOR_CUSTOMER_ID="your-customer-id"
   export SIMULATOR_CUSTOMER_SECRET="your-secret"
   export SIMULATOR_HAIKU_CLIENT_ID="your-client-id"
   ```

2. **Run scenarios in order of complexity**
   - Start with BASIC scenario
   - Progress to MULTIPLE_CHUNKS
   - Test edge cases with QUICK_RECORDING and SLOW_PROCESSING

3. **Verify queue processing**
   - Check Redis for session data
   - Monitor queue jobs in BullMQ UI
   - Verify callback webhook calls

4. **Document custom scenarios**
   - Add comments explaining timing
   - Document any special IDs or test data
   - Keep git history of scenario changes

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED
```
- Verify API server is running on the correct URL
- Check firewall rules
- Verify baseUrl configuration

### Authentication Failed
```
✗ Error (401): Unauthorized
```
- Verify customerID and customerSecret are correct
- Check haikuClientId is valid
- Verify X-Haiku-Client-ID header is being sent

### Timeout
```
Error: timeout of 30000ms exceeded
```
- API server may be slow
- Increase timeout in simulator config
- Check API server logs for errors

### Redis Issues
```
Error: Redis client is missing
```
- Verify Redis is running
- Check Redis connection configuration
- Monitor Redis keys in chunk counter

## File Structure

```
src/common/simulator/
├── epic-haiku.simulator.ts    # Main simulator class
├── scenarios.ts               # Pre-configured test scenarios
├── cli.ts                     # Command-line interface
└── README.md                  # This file
```

## Contributing

To add new scenarios:

1. Add scenario type to `ScenarioType` enum in `scenarios.ts`
2. Implement scenario method in `SimulationScenarios` class
3. Update `runScenario()` switch statement
4. Document in this README
5. Test with CLI tool

## License

This simulator is part of the SullyAI Epic Integration project.
