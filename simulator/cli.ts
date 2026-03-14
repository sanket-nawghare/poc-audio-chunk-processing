#!/usr/bin/env node

/**
 * Epic Haiku Simulator CLI
 *
 * Simulates single or multiple recordings per session.
 *
 * Each recording in a session is assigned a sequential recording number (1, 2, 3, ...)
 * which is sent as the `recording` field in RecordingChunkAvailable and RecordingAvailable
 * requests. The last recording sets lastRecording=1 to signal session completion.
 *
 * Usage:
 *   npx ts-node ./simulator/cli.ts [options]
 */

import { EpicHaikuSimulator } from './epic-haiku.simulator';
import startExpressSimulator from './express-simulator';
import startPocBridge from './poc-bridge';

interface CliArgs {
  baseUrl: string;
  customerId: string;
  customerSecret: string;
  clientId: string;
  userId: string;
  patientId: string;
  encounterId: string;
  noteType?: string;
  chunks?: number;
  chunkSize?: number;
  chunkDelay: number;
  recordingDelay: number;
  audioFiles: string[];
  port?: string;
  pocBaseUrl?: string;
  pocBridgePort?: string;
  duplicateProbability: number;
  concurrentBatch: number;
  instances: number;
  betweenRecordingsDelay: number;
  recordings: number;
}

type SessionConfigInput = {
  userID: string;
  patientID: Array<{ ID: string; Type: string }>;
  encounterID: Array<{ ID: string; Type: string }>;
  noteType?: string;
  totalChunks?: number;
  chunkSizeBytes?: number;
  chunkDelayMs: number;
  recordingDelayMs: number;
  betweenRecordingsDelayMs: number;
  duplicateChunkProbability: number;
  concurrentChunkBatchSize: number;
  recordings?: Array<{ audioFilePath?: string }>;
  audioFilePath?: string;
};

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const audioFiles: string[] = [];
  const parsed: Partial<CliArgs> = {
    baseUrl: 'http://localhost:8000',
    chunkDelay: 500,
    recordingDelay: 2000,
    duplicateProbability: 0,
    concurrentBatch: 0,
    instances: 1,
    betweenRecordingsDelay: 1000,
    recordings: 0,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help') {
      showHelp();
      process.exit(0);
    }

    if (arg === '--base-url') {
      parsed.baseUrl = args[++i];
    } else if (arg === '--customer-id') {
      parsed.customerId = args[++i];
    } else if (arg === '--customer-secret') {
      parsed.customerSecret = args[++i];
    } else if (arg === '--client-id') {
      parsed.clientId = args[++i];
    } else if (arg === '--user-id') {
      parsed.userId = args[++i];
    } else if (arg === '--patient-id') {
      parsed.patientId = args[++i];
    } else if (arg === '--encounter-id') {
      parsed.encounterId = args[++i];
    } else if (arg === '--note-type') {
      parsed.noteType = args[++i];
    } else if (arg === '--chunks') {
      parsed.chunks = parseInt(args[++i], 10);
    } else if (arg === '--chunk-size') {
      parsed.chunkSize = parseInt(args[++i], 10) * 1024;
    } else if (arg === '--chunk-delay') {
      parsed.chunkDelay = parseInt(args[++i], 10);
    } else if (arg === '--recording-delay') {
      parsed.recordingDelay = parseInt(args[++i], 10);
    } else if (arg === '--audio-file') {
      audioFiles.push(args[++i]);
    } else if (arg === '--port') {
      parsed.port = args[++i];
    } else if (arg === '--poc-base-url') {
      parsed.pocBaseUrl = args[++i];
    } else if (arg === '--poc-bridge-port') {
      parsed.pocBridgePort = args[++i];
    } else if (arg === '--duplicate-probability') {
      parsed.duplicateProbability = parseFloat(args[++i]);
    } else if (arg === '--concurrent-batch') {
      parsed.concurrentBatch = parseInt(args[++i], 10);
    } else if (arg === '--instances') {
      parsed.instances = parseInt(args[++i], 10);
    } else if (arg === '--between-recordings-delay') {
      parsed.betweenRecordingsDelay = parseInt(args[++i], 10);
    } else if (arg === '--recordings') {
      parsed.recordings = parseInt(args[++i], 10);
    }
  }

  parsed.audioFiles = audioFiles;

  const required = ['customerId', 'customerSecret', 'clientId', 'userId', 'patientId', 'encounterId'];
  for (const field of required) {
    if (!parsed[field as keyof CliArgs]) {
      console.error(`\nError: Missing required argument --${field.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
      showHelp();
      process.exit(1);
    }
  }

  if (parsed.chunks !== undefined && parsed.chunkSize !== undefined) {
    console.error('\nError: --chunks and --chunk-size are mutually exclusive. Use only one.');
    showHelp();
    process.exit(1);
  }

  return parsed as CliArgs;
}

function showHelp(): void {
  console.log(`
Epic Haiku Simulator CLI

Usage:
  npx ts-node ./simulator/cli.ts [options]

Options:
  --base-url <url>              API base URL (default: http://localhost:8000)
  --customer-id <id>            Customer ID for Epic integration (required)
  --customer-secret <secret>    Customer secret for Epic integration (required)
  --client-id <id>              Haiku client ID (required)
  --user-id <id>                User/Practitioner ID (required)
  --patient-id <id>             Patient ID (required)
  --encounter-id <id>           Encounter ID (required)
  --note-type <type>            Note type (default: Clinic Note)
  --chunks <number>             Number of chunks per recording (mutually exclusive with --chunk-size)
  --chunk-size <kb>             Chunk size in KB; derives total chunks from audio length
                                (mutually exclusive with --chunks; default: 100)
  --chunk-delay <ms>            Delay between chunks in ms (default: 500)
  --recording-delay <ms>        Delay before recording available in ms (default: 2000)
  --audio-file <path>           Path to audio file (can be specified multiple times for multiple recordings)
  --recordings <number>         Total number of recordings in session (default: 1, or count of --audio-file)
  --between-recordings-delay <ms>  Delay between recordings in ms (default: 1000)
  --poc-base-url <url>          Optional POC backend URL; starts a local Epic->POC bridge
  --poc-bridge-port <port>      Local bridge port when --poc-base-url is set (default: 3334)
  --duplicate-probability <0-1> Probability of duplicating chunks (default: 0, range: 0.0-1.0)
  --concurrent-batch <number>   Concurrent chunk batch size (default: 0, 0=sequential)
  --instances <number>          Number of concurrent test instances to run (default: 1)
  --help                        Show this help message

Example without audio file (mock chunks, fixed count):
  npx ts-node ./simulator/cli.ts \\
    --customer-id epic-customer-123 \\
    --customer-secret secret123 \\
    --client-id haiku-client-456 \\
    --user-id practitioner-001 \\
    --patient-id patient-001 \\
    --encounter-id encounter-001 \\
    --chunks 3

Example with audio file, fixed chunk count:
  npx ts-node ./simulator/cli.ts \\
    --customer-id epic-customer-123 \\
    --customer-secret secret123 \\
    --client-id haiku-client-456 \\
    --user-id practitioner-001 \\
    --patient-id patient-001 \\
    --encounter-id encounter-001 \\
    --audio-file ./recordings/test.aac \\
    --chunks 5

Example against the POC backend via bridge:
  npx ts-node ./simulator/cli.ts \\
    --poc-base-url http://localhost:8080 \\
    --customer-id epic-customer-123 \\
    --customer-secret secret123 \\
    --client-id haiku-client-456 \\
    --user-id practitioner-001 \\
    --patient-id patient-001 \\
    --encounter-id encounter-001 \\
    --audio-file ./recordings/test.aac
`);
}

function buildRecordingsConfig(args: CliArgs): Array<{ audioFilePath?: string }> {
  const recordings: Array<{ audioFilePath?: string }> = [];

  if (args.audioFiles.length > 0) {
    for (const file of args.audioFiles) {
      recordings.push({ audioFilePath: file });
    }
  }

  const mockRecordingsCount = args.recordings - recordings.length;
  if (mockRecordingsCount > 0) {
    for (let i = 0; i < mockRecordingsCount; i++) {
      recordings.push({});
    }
  }

  return recordings;
}

function buildSessionConfig(args: CliArgs): SessionConfigInput {
  const recordings = buildRecordingsConfig(args);

  return {
    userID: args.userId,
    patientID: [{ ID: args.patientId, Type: 'FHIR' }],
    encounterID: [{ ID: args.encounterId, Type: 'FHIR' }],
    noteType: args.noteType,
    ...(args.chunks !== undefined ? { totalChunks: args.chunks } : {}),
    ...(args.chunkSize !== undefined ? { chunkSizeBytes: args.chunkSize } : {}),
    chunkDelayMs: args.chunkDelay,
    recordingDelayMs: args.recordingDelay,
    betweenRecordingsDelayMs: args.betweenRecordingsDelay,
    duplicateChunkProbability: args.duplicateProbability,
    concurrentChunkBatchSize: args.concurrentBatch,
    ...(recordings.length > 1
      ? { recordings }
      : { audioFilePath: recordings[0]?.audioFilePath }),
  };
}

async function runSingleInstance(
  args: CliArgs,
  instanceNumber: number,
  baseUrl: string,
  callbackUrl: string,
): Promise<void> {
  const simulator = new EpicHaikuSimulator({
    baseUrl,
    customerID: args.customerId,
    customerSecret: args.customerSecret,
    haikuClientId: args.clientId,
    callbackUrl,
  });

  const sessionConfig = buildSessionConfig(args);

  console.log(`\n[Instance ${instanceNumber}] Starting simulation...`);

  try {
    await simulator.runFullSimulation(sessionConfig);
    console.log(`\n[Instance ${instanceNumber}] ✓ Completed successfully`);
  } catch (error) {
    console.error(`\n[Instance ${instanceNumber}] ✗ Failed:`, error);
    throw error;
  }
}

async function main(): Promise<void> {
  const args = parseArgs();
  const instances = args.instances || 1;

  let simulationBaseUrl = args.baseUrl;
  let callbackUrl = args.baseUrl;
  let stop: undefined | (() => Promise<void>);

  if (args.pocBaseUrl) {
    const bridgePort = Number(args.pocBridgePort || process.env.SIMULATOR_POC_BRIDGE_PORT || 3334);
    const bridge = await startPocBridge(args.pocBaseUrl, bridgePort);
    simulationBaseUrl = bridge.url;
    callbackUrl = bridge.url;
    // stop = bridge.stop;
  } else {
    const expressPort = Number(args.port || process.env.SIMULATOR_PORT || 3333);
    const expressSimulator = await startExpressSimulator(expressPort);
    callbackUrl = expressSimulator.url;
    stop = expressSimulator.stop;
  }

  try {
    if (instances === 1) {
      const simulator = new EpicHaikuSimulator({
        baseUrl: simulationBaseUrl,
        customerID: args.customerId,
        customerSecret: args.customerSecret,
        haikuClientId: args.clientId,
        callbackUrl,
      });

      const sessionConfig = buildSessionConfig(args);

      try {
        await simulator.runFullSimulation(sessionConfig);
      } catch (error) {
        console.log(error);
        process.exit(1);
      }

      return;
    }

    const audioFilesDisplay = args.audioFiles.length > 0
      ? args.audioFiles.join(', ')
      : 'Simulated audio';
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║  Running ${instances} concurrent test instances`);
    console.log(`║  Audio file(s): ${audioFilesDisplay}`);
    console.log(`╚════════════════════════════════════════════════════════════╝\n`);

    const startTime = Date.now();

    try {
      const promises = Array.from({ length: instances }, (_, i) =>
        runSingleInstance(args, i + 1, simulationBaseUrl, callbackUrl)
      );

      await Promise.all(promises);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`\n╔════════════════════════════════════════════════════════════╗`);
      console.log(`║  ✓ All ${instances} instances completed successfully`);
      console.log(`║  Total time: ${duration}s`);
      console.log(`╚════════════════════════════════════════════════════════════╝\n`);
    } catch (error) {
      console.error(`\n╔════════════════════════════════════════════════════════════╗`);
      console.error(`║  ✗ One or more instances failed`);
      console.error(`╚════════════════════════════════════════════════════════════╝\n`);
      console.log(error);
      process.exit(1);
    }
  } finally {
    if (stop) {
      await stop();
    }
  }
}

main();
