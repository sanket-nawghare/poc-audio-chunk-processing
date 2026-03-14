# Epic Haiku Simulator - Complete File Index

## Overview

Complete Epic Haiku simulation framework for testing the Haiku voice assistant integration locally.

**Location:** `/apps/api/src/common/simulator/`

**Total Files:** 11
**Code Files:** 6 (TypeScript)
**Documentation:** 5 (Markdown)

---

## Code Files

### 1. `epic-haiku.simulator.ts` (430 lines)
**Core simulator class** - Main orchestration of the Epic Haiku workflow

**Key Class:** `EpicHaikuSimulator`

**Key Methods:**
- `constructor(config: SimulatorConfig)`
- `beginSession(sessionConfig: SessionConfig): Promise<void>`
- `sendRecordingChunks(totalChunks?: number, chunkDelayMs?: number): Promise<void>`
- `sendRecordingAvailable(recordingDelayMs?: number): Promise<void>`
- `completeSession(): Promise<void>`
- `runFullSimulation(sessionConfig: SessionConfig): Promise<void>`
- `getSessionId(): string`
- `getRecordingVersion(): string`

**Interfaces:**
- `SimulatorConfig` - Simulator configuration
- `SessionConfig` - Session configuration
- `SimulationStep` - Internal step definition

**Usage:**
```typescript
const simulator = new EpicHaikuSimulator(config);
await simulator.runFullSimulation(sessionConfig);
```

---

### 2. `scenarios.ts` (200+ lines)
**Pre-configured test scenarios** - Factory for running different test workflows

**Key Class:** `SimulationScenarios`

**Key Methods:**
- `constructor(config: SimulatorConfig)`
- `runBasicScenario(sessionConfig: SessionConfig): Promise<void>`
- `runMultipleChunksScenario(sessionConfig: SessionConfig): Promise<void>`
- `runQuickRecordingScenario(sessionConfig: SessionConfig): Promise<void>`
- `runSlowProcessingScenario(sessionConfig: SessionConfig): Promise<void>`
- `runScenario(type: ScenarioType, sessionConfig: SessionConfig): Promise<void>`
- `runAllScenarios(sessionConfig: SessionConfig): Promise<void>`

**Enums:**
- `ScenarioType` - BASIC, MULTIPLE_CHUNKS, QUICK_RECORDING, SLOW_PROCESSING

**Interfaces:**
- `ScenarioConfig` - Extends SimulatorConfig with scenario type

**Scenario Details:**
| Scenario | Chunks | Chunk Delay | Recording Delay | Use Case |
|----------|--------|------------|-----------------|----------|
| BASIC | 3 | 500ms | 2000ms | Standard testing |
| MULTIPLE_CHUNKS | 10 | 300ms | 3000ms | Load testing |
| QUICK_RECORDING | 1 | 0ms | 500ms | Edge cases |
| SLOW_PROCESSING | 5 | 2000ms | 5000ms | Resilience |

---

### 3. `utils.ts` (430+ lines)
**Helper utilities and functions** - Common operations and helpers

**Key Functions:**

**Test Data Generation:**
- `generateTestIds()` - Generate realistic test IDs
- `createTestSessionConfig(overrides?)` - Create test session config

**Simulation Execution:**
- `runSimulation(config, sessionConfig): Promise<SimulationResult>`
- `runMultipleSimulations(config, sessionConfigs, delayBetweenMs): Promise<SimulationResult[]>`
- `runAllScenarios(config, sessionConfig): Promise<Map<ScenarioType, SimulationResult>>`

**Validation:**
- `validateSimulatorConfig(config): string[]` - Validate simulator config
- `validateSessionConfig(config): string[]` - Validate session config

**Reporting:**
- `generateReport(results: SimulationResult[]): string` - Generate summary report
- `generateScenarioReport(results): string` - Generate scenario comparison report
- `printConfig(simulatorConfig, sessionConfig): void` - Pretty print config

**Types:**
- `SimulationResult` - Result of simulation execution

---

### 4. `cli.ts` (270 lines)
**Command-line interface** - Run simulations from terminal

**Main Function:** `main()`

**Features:**
- Argument parsing with `parseArgs()`
- Help display with `showHelp()`
- Required argument validation
- Environment variable support

**CLI Options:**
```
--base-url <url>           API base URL (default: http://localhost:3000)
--customer-id <id>         Customer ID (required)
--customer-secret <secret> Customer secret (required)
--client-id <id>           Client ID (required)
--user-id <id>             User ID (required)
--patient-id <id>          Patient ID (required)
--encounter-id <id>        Encounter ID (required)
--note-type <type>         Note type (default: Clinic Note)
--chunks <number>          Chunk count (default: 3)
--chunk-delay <ms>         Inter-chunk delay (default: 500)
--recording-delay <ms>     Pre-available delay (default: 2000)
--help                     Show help
```

**Usage:**
```bash
npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id your-id \
  --customer-secret your-secret \
  --client-id your-client \
  --user-id doctor1 \
  --patient-id patient1 \
  --encounter-id visit1
```

---

### 5. `examples.ts` (350+ lines)
**Usage examples** - 8 complete working examples

**Example Functions:**
1. `example1BasicSimulation()` - Single simulation
2. `example2Scenarios()` - Using scenarios
3. `example3AllScenarios()` - Running all scenarios
4. `example4MultipleSimulations()` - Multiple runs with reporting
5. `example5SingleSimulationWithResults()` - Result handling
6. `example6ConfigurationValidation()` - Config validation
7. `example7CustomSessionConfig()` - Custom configuration
8. `example8GeneratedTestIds()` - ID generation

**Main Export:** `runAllExamples()`

**Usage:**
```typescript
import { runAllExamples } from 'src/common/simulator/examples';
await runAllExamples();
```

---

### 6. `index.ts` & `index.export.ts`
**Module exports** - Convenient imports

**Exports from `index.ts`:**
- `EpicHaikuSimulator`
- `SimulatorConfig`, `SessionConfig`
- `SimulationScenarios`, `ScenarioType`
- `ScenarioConfig`

**Exports from `index.export.ts`:**
- All of the above plus
- All utilities from `utils.ts`
- `SimulationResult` type
- All examples

**Usage:**
```typescript
import { EpicHaikuSimulator, SimulationScenarios } from 'src/common/simulator';
```

---

## Documentation Files

### 1. `README.md` (500+ lines)
**Complete reference documentation**

**Sections:**
- Overview
- Architecture explanation
- Core components (EpicHaikuSimulator, SimulationScenarios, utils)
- Workflow diagram
- Configuration reference (SimulatorConfig, SessionConfig interfaces)
- Usage examples (code-based)
- Output examples
- Testing scenarios (detailed explanation)
- Integration with worker queues
- Error handling strategies
- Best practices
- Troubleshooting guide
- File structure

**When to Read:** For comprehensive understanding of the system

---

### 2. `QUICKSTART.md` (150+ lines)
**Quick reference and quick start**

**Sections:**
- 5-minute setup
- Basic CLI usage
- Custom timing examples
- Common scenarios (load, slow network, quick recording)
- Environment variables
- Troubleshooting (connection, auth, timeout)
- Next steps

**When to Read:** To get started quickly

---

### 3. `ARCHITECTURE.md` (400+ lines)
**System design and architecture**

**Sections:**
- Overview
- System architecture layers (Core, Scenarios, Utilities, CLI, Examples)
- Component responsibilities
- Data models
- Request/response flow
- Queue integration
- State management (Redis keys)
- Error handling strategy
- Performance characteristics
- Extensibility guide
- Testing strategy
- Deployment considerations
- Future enhancements

**When to Read:** To understand design decisions and extend the system

---

### 4. `IMPLEMENTATION_SUMMARY.md` (250+ lines)
**High-level implementation summary**

**Sections:**
- What was created
- File structure overview
- Core components summary
- Simulation workflow
- Key features checklist
- Integration points
- Usage quick start (3 modes)
- Documentation overview
- Testing prerequisites
- Advanced usage examples
- Files reference table
- Next steps
- Support

**When to Read:** For a comprehensive overview of everything created

---

### 5. `INDEX.md` (This File)
**Complete file index and cross-reference**

---

## Quick Navigation

### By Task

**I want to run a simulation:**
1. Read `QUICKSTART.md`
2. Use `cli.ts` or review examples in `examples.ts`

**I want to understand the system:**
1. Read `README.md` - Overview to Workflow sections
2. Read `ARCHITECTURE.md` - System Architecture section

**I want to extend functionality:**
1. Read `ARCHITECTURE.md` - Extensibility section
2. Review `examples.ts` for patterns
3. Modify `scenarios.ts` to add new scenarios

**I need to troubleshoot:**
1. Check `README.md` - Troubleshooting section
2. Check `QUICKSTART.md` - Troubleshooting section
3. Review error messages in console output

**I want to integrate into CI/CD:**
1. Read `QUICKSTART.md` - Basic CLI usage
2. Review `IMPLEMENTATION_SUMMARY.md` - Advanced usage
3. Check `examples.ts` - Batch execution example

### By Audience

**Developers:**
- Start: `QUICKSTART.md`
- Then: `README.md`
- Deep dive: `ARCHITECTURE.md`
- Reference: `examples.ts`

**DevOps/CI-CD:**
- Start: `QUICKSTART.md` - CLI section
- Reference: `cli.ts` - Arguments
- Integration: `examples.ts` - runMultipleSimulations()

**Architects/Tech Leads:**
- Start: `IMPLEMENTATION_SUMMARY.md`
- Reference: `ARCHITECTURE.md`
- Review: `README.md` - Integration section

---

## Configuration & Usage Quick Reference

### Minimal CLI Usage
```bash
npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id your-id \
  --customer-secret your-secret \
  --client-id your-client \
  --user-id doctor1 \
  --patient-id patient1 \
  --encounter-id visit1
```

### Minimal Code Usage
```typescript
import { EpicHaikuSimulator } from 'src/common/simulator';

const simulator = new EpicHaikuSimulator({
  baseUrl: 'http://localhost:3000',
  customerID: 'your-id',
  customerSecret: 'your-secret',
  haikuClientId: 'your-client',
});

await simulator.runFullSimulation({
  userID: 'doctor1',
  patientID: [{ ID: 'patient1', Type: 'FHIR' }],
  encounterID: [{ ID: 'visit1', Type: 'FHIR' }],
});
```

### Interface Quick Reference

```typescript
// Main config
interface SimulatorConfig {
  baseUrl: string;
  customerID: string;
  customerSecret: string;
  haikuClientId: string;
}

// Session config
interface SessionConfig {
  userID: string;
  patientID: Array<{ ID: string; Type: string }>;
  encounterID: Array<{ ID: string; Type: string }>;
  noteType?: string;
  totalChunks?: number;
  chunkDelayMs?: number;
  recordingDelayMs?: number;
}

// Simulation result
interface SimulationResult {
  success: boolean;
  sessionId: string;
  recordingVersion: string;
  duration: number;
  steps: number;
  error?: string;
}
```

---

## File Dependencies

```
epic-haiku.simulator.ts
├── axios (HTTP client)
└── No internal dependencies

scenarios.ts
├── epic-haiku.simulator.ts
└── No other simulator dependencies

utils.ts
├── epic-haiku.simulator.ts
└── scenarios.ts

cli.ts
├── epic-haiku.simulator.ts
├── axios

examples.ts
├── epic-haiku.simulator.ts
├── scenarios.ts
└── utils.ts

index.ts & index.export.ts
├── epic-haiku.simulator.ts
├── scenarios.ts
└── utils.ts
```

---

## Checklist for Getting Started

- [ ] Read `QUICKSTART.md` (5 minutes)
- [ ] Run example CLI command (1 minute)
- [ ] Review `examples.ts` (10 minutes)
- [ ] Read `README.md` - Usage section (10 minutes)
- [ ] Run a custom simulation (5 minutes)
- [ ] Read `ARCHITECTURE.md` for deep understanding (optional)

---

## Version & Status

**Created:** December 8, 2025
**Status:** Complete & Production-Ready
**Language:** TypeScript
**Framework:** NestJS, BullMQ, Axios

---

## Support

For questions or issues:
1. Check relevant documentation file
2. Review examples in `examples.ts`
3. Check `README.md` Troubleshooting section
4. Review error messages in console output
