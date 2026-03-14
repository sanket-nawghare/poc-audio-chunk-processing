# Epic Haiku Simulator - Architecture & Design

## Overview

The Epic Haiku Simulator is a comprehensive testing framework that replicates the behavior of Epic's Haiku voice assistant system. It's designed to support local development, testing, and validation of the Haiku integration without requiring actual Epic infrastructure.

## System Architecture

### 1. Core Layer: `epic-haiku.simulator.ts`

**Purpose:** Main orchestration of the simulation workflow

**Key Classes:**
- `EpicHaikuSimulator` - Primary class managing the complete simulation

**Responsibilities:**
- Session initialization and management
- HTTP request orchestration
- Error handling and retry logic
- Timing and sequencing of events

**Key Methods:**
```typescript
// Workflow steps
beginSession(config)        // Step 1: Initialize session
sendRecordingChunks(n, delay)  // Step 2: Notify about chunks
sendRecordingAvailable(delay)  // Step 3: Signal recording complete
completeSession()           // Step 4: Clean up

// Orchestration
runFullSimulation(config)   // Execute complete workflow
```

**Data Flow:**
```
┌─────────────────────┐
│ SessionConfig       │
│ - userID            │
│ - patientID         │
│ - encounterID       │
│ - totalChunks       │
│ - delays            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  EpicHaikuSimulator │
│  - http requests    │
│  - state tracking   │
│  - timing control   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ API Endpoints       │
│ - AmbientSessionBegin
│ - RecordingChunkAvailable
│ - RecordingAvailable
│ - AmbientSessionComplete
└─────────────────────┘
```

### 2. Scenarios Layer: `scenarios.ts`

**Purpose:** Pre-configured test scenarios for different use cases

**Key Classes:**
- `SimulationScenarios` - Factory for running scenario workflows

**Scenario Types:**
```typescript
enum ScenarioType {
  BASIC = 'basic',              // 3 chunks, normal timing
  MULTIPLE_CHUNKS = 'multiple-chunks',  // 10 chunks, high volume
  QUICK_RECORDING = 'quick-recording',  // 1 chunk, minimal delay
  SLOW_PROCESSING = 'slow-processing',  // 5 chunks, extended delays
}
```

**Architecture:**
```
SimulationScenarios
├── runBasicScenario()
├── runMultipleChunksScenario()
├── runQuickRecordingScenario()
├── runSlowProcessingScenario()
└── runScenario(type)
```

### 3. Utilities Layer: `utils.ts`

**Purpose:** Helper functions and common operations

**Key Features:**

#### Test Data Generation
```typescript
generateTestIds()           // Create realistic test IDs
createTestSessionConfig()   // Generate session configs
```

#### Simulation Execution
```typescript
runSimulation()             // Execute single simulation
runMultipleSimulations()    // Batch execution
runAllScenarios()           // Run all scenario types
```

#### Validation
```typescript
validateSimulatorConfig()   // Config validation
validateSessionConfig()     // Session validation
```

#### Reporting
```typescript
generateReport()            // Generate simulation report
generateScenarioReport()    // Scenario comparison report
printConfig()               // Pretty-print config
```

**Return Types:**
```typescript
interface SimulationResult {
  success: boolean;
  sessionId: string;
  recordingVersion: string;
  duration: number;
  steps: number;
  error?: string;
}
```

### 4. CLI Layer: `cli.ts`

**Purpose:** Command-line interface for running simulations

**Architecture:**
```
User Input
    │
    ▼
parseArgs()          // Parse CLI arguments
    │
    ▼
validateArgs()       // Validate required fields
    │
    ▼
EpicHaikuSimulator   // Execute simulation
    │
    ▼
Console Output       // Display results
```

**Command Structure:**
```
cli.ts [options]

Required Options:
  --customer-id <id>
  --customer-secret <secret>
  --client-id <id>
  --user-id <id>
  --patient-id <id>
  --encounter-id <id>

Optional Options:
  --base-url <url>
  --note-type <type>
  --chunks <number>
  --chunk-delay <ms>
  --recording-delay <ms>
```

### 5. Examples Layer: `examples.ts`

**Purpose:** Demonstrate various usage patterns

**Example Structure:**
```typescript
example1BasicSimulation()          // Single simulation
example2Scenarios()                // Using scenarios
example3AllScenarios()             // Batch scenarios
example4MultipleSimulations()      // Multiple runs with reporting
example5SingleSimulationWithResults()  // Result handling
example6ConfigurationValidation()  // Config validation
example7CustomSessionConfig()      // Custom configuration
example8GeneratedTestIds()        // ID generation
```

## Data Models

### SimulatorConfig
```typescript
interface SimulatorConfig {
  baseUrl: string;          // API endpoint
  customerID: string;       // Epic credentials
  customerSecret: string;   // Epic credentials
  haikuClientId: string;    // Haiku credentials
}
```

### SessionConfig
```typescript
interface SessionConfig {
  userID: string;                              // Practitioner
  patientID: Array<{ID: string, Type: string}>;    // Patient
  encounterID: Array<{ID: string, Type: string}>; // Encounter
  noteType?: string;                          // Clinical note type
  totalChunks?: number;                       // Recording chunks
  chunkDelayMs?: number;                      // Inter-chunk delay
  recordingDelayMs?: number;                  // Pre-available delay
}
```

### SimulationResult
```typescript
interface SimulationResult {
  success: boolean;         // Simulation succeeded
  sessionId: string;        // Generated session ID
  recordingVersion: string; // Generated recording version
  duration: number;         // Total duration (ms)
  steps: number;           // Number of API calls
  error?: string;          // Error message if failed
}
```

## Request/Response Flow

### Complete Workflow Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                    AMBIENT SESSION BEGIN                        │
├─────────────────────────────────────────────────────────────────┤
│ POST /api/v1.0/haiku/AmbientSessionBegin                        │
│                                                                  │
│ Request:                                                         │
│ {                                                                │
│   "sessionID": "sim-...",                                       │
│   "userID": "practitioner-001",                                 │
│   "patientID": [{ID: "patient-001", Type: "FHIR"}],           │
│   "encounterID": [{ID: "encounter-001", Type: "FHIR"}],       │
│   "customerID": "epic-customer-123",                           │
│   "customerSecret": "secret123",                               │
│   "callbackUrl": "http://localhost:3000"                       │
│ }                                                                │
│                                                                  │
│ Response:                                                        │
│ {                                                                │
│   "sessionID": "sim-...",                                       │
│   "userID": "practitioner-001"                                 │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              RECORDING CHUNK AVAILABLE (N times)                │
├─────────────────────────────────────────────────────────────────┤
│ POST /api/v1.0/haiku/RecordingChunkAvailable                   │
│                                                                  │
│ Request (for chunk i):                                          │
│ {                                                                │
│   "sessionID": "sim-...",                                       │
│   "recording": "recording-version-123",                        │
│   "chunk": "i"                                                  │
│ }                                                                │
│                                                                  │
│ Response:                                                        │
│ {                                                                │
│   "message": "Added send recording chunk to queue"              │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RECORDING AVAILABLE                          │
├─────────────────────────────────────────────────────────────────┤
│ POST /api/v1.0/haiku/RecordingAvailable                        │
│                                                                  │
│ Request:                                                         │
│ {                                                                │
│   "sessionID": "sim-...",                                       │
│   "recording": "recording-version-123",                        │
│   "totalChunks": "3",                                          │
│   "lastRecording": 1                                           │
│ }                                                                │
│                                                                  │
│ Response:                                                        │
│ {                                                                │
│   "message": "Added recording available to queue"               │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              AMBIENT SESSION COMPLETE                           │
├─────────────────────────────────────────────────────────────────┤
│ POST /api/v1.0/haiku/AmbientSessionComplete                   │
│                                                                  │
│ Request:                                                         │
│ {                                                                │
│   "sessionID": "sim-..."                                        │
│ }                                                                │
│                                                                  │
│ Response:                                                        │
│ {                                                                │
│   "error": null                                                 │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Queue Integration

The simulator triggers the existing BullMQ worker system:

```
┌──────────────────┐
│ Simulator        │
│ Sends Events     │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│ Haiku Service            │
│ (haiku.service.ts)       │
│                          │
│ - beginSession()         │
│ - recordingChunkAvailable() │
│ - recordingAvailable()   │
│ - completeSession()      │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Queue Service            │
│ (queue.service.ts)       │
│                          │
│ - addRecordingChunk()    │
│ - addRecordingAvailable()│
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ BullMQ Queues            │
│ (bullmq.ts)              │
│                          │
│ - sendRecordingChunk()   │
│ - sendRecordingAvailable()│
└──────────────────────────┘
```

## State Management

### Redis Keys
The simulator integrates with existing Redis state:

```
epic:sessions:${sessionID}
  - userID
  - customerID
  - customerSecret
  - callbackUrl
  - patientID
  - encounterID
  - data

epic:sessions:${sessionID}:chunks_left
  - Counter for pending chunks
```

## Error Handling Strategy

### Levels of Error Handling

1. **Request Level**
   - HTTP status code checking
   - Response validation
   - Timeout handling (30s)

2. **Workflow Level**
   - Step failure tracking
   - Detailed error reporting
   - Step number logging

3. **Configuration Level**
   - Input validation
   - Config schema validation
   - Error messages with fixes

### Error Recovery

The simulator does NOT implement automatic retry (by design):
- Failures are logged with full details
- Step numbers help identify issues
- Detailed error messages guide troubleshooting
- Use BullMQ job retries for production scenarios

## Performance Characteristics

### Timing Model

```
Total Duration = Workflow Time + Chunk Times + Waiting Times

Workflow Time ≈ 200-300ms per HTTP request
Chunk Times = totalChunks * (chunkDelayMs)
Waiting Times = recordingDelayMs + sessionCompleteDelayMs
```

### Example Calculations

**Basic Scenario (3 chunks, 500ms delays):**
- 4 HTTP requests × 200ms = 800ms
- 2 inter-chunk delays × 500ms = 1000ms
- Recording delay = 2000ms
- Total ≈ 3800ms

**Multiple Chunks Scenario (10 chunks, 300ms delays):**
- 12 HTTP requests × 200ms = 2400ms
- 9 inter-chunk delays × 300ms = 2700ms
- Recording delay = 3000ms
- Total ≈ 8100ms

## Extensibility

### Adding New Scenarios

```typescript
// In scenarios.ts
async runCustomScenario(sessionConfig: SessionConfig): Promise<void> {
  const simulator = new EpicHaikuSimulator(this.config);
  
  const enhancedSessionConfig: SessionConfig = {
    ...sessionConfig,
    // Custom configuration
    totalChunks: X,
    chunkDelayMs: Y,
    recordingDelayMs: Z,
  };

  await simulator.runFullSimulation(enhancedSessionConfig);
}
```

### Adding New Utilities

```typescript
// In utils.ts
export function newUtilityFunction(params): ReturnType {
  // Implementation
}
```

### Custom Simulators

```typescript
import { EpicHaikuSimulator } from './epic-haiku.simulator.js';

class CustomSimulator extends EpicHaikuSimulator {
  async customWorkflow(): Promise<void> {
    // Custom workflow implementation
  }
}
```

## Testing Strategy

### Unit Testing
- Validate configuration parsing
- Test ID generation
- Verify report generation

### Integration Testing
- Full workflow execution
- Multiple scenario execution
- Error condition handling

### Load Testing
- Multiple simultaneous simulations
- High chunk counts (20+)
- Realistic timing profiles

## Deployment Considerations

### Development
- Run locally with local API server
- Use generated test IDs
- Monitor console output

### CI/CD
- Set environment variables
- Use specific scenario types
- Assert success conditions
- Log results for analysis

### Production Monitoring
- Use actual Epic credentials
- Monitor simulation results
- Track performance metrics
- Alert on failures

## Future Enhancements

Potential improvements:

1. **Webhook Callbacks**
   - Simulate Epic callbacks
   - Verify payload format

2. **Performance Metrics**
   - Latency measurement
   - Throughput testing
   - Resource usage tracking

3. **Test Data Management**
   - Fixture generation
   - Cleanup procedures
   - State validation

4. **Advanced Scenarios**
   - Error injection
   - Network delays
   - Concurrent sessions
