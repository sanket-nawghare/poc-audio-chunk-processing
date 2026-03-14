/**
 * Epic Haiku Simulator Utilities
 *
 * Helper functions and utilities for running simulations and analyzing results
 */

import { EpicHaikuSimulator, SessionConfig, SimulatorConfig } from './epic-haiku.simulator.js';
import { SimulationScenarios, ScenarioType } from './scenarios.js';

export interface SimulationResult {
  success: boolean;
  sessionId: string;
  recordingVersion: string;
  duration: number; // milliseconds
  steps: number;
  error?: string;
}

/**
 * Generate random test IDs
 */
export function generateTestIds(): {
  userId: string;
  patientId: string;
  encounterId: string;
} {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);

  return {
    userId: `practitioner-${timestamp}`,
    patientId: `patient-${timestamp}`,
    encounterId: `encounter-${timestamp}`,
  };
}

/**
 * Run a single simulation and return results
 */
export async function runSimulation(
  config: SimulatorConfig,
  sessionConfig: SessionConfig,
): Promise<SimulationResult> {
  const startTime = Date.now();
  const simulator = new EpicHaikuSimulator(config);

  try {
    await simulator.runFullSimulation(sessionConfig);

    return {
      success: true,
      sessionId: simulator.getSessionId(),
      recordingVersion: simulator.getRecordingVersion(),
      duration: Date.now() - startTime,
      steps: 4 + (sessionConfig.totalChunks || 3) + 1,
    };
  } catch (error) {
    return {
      success: false,
      sessionId: simulator.getSessionId(),
      recordingVersion: simulator.getRecordingVersion(),
      duration: Date.now() - startTime,
      steps: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run multiple simulations sequentially
 */
export async function runMultipleSimulations(
  config: SimulatorConfig,
  sessionConfigs: SessionConfig[],
  delayBetweenMs: number = 1000,
): Promise<SimulationResult[]> {
  const results: SimulationResult[] = [];

  for (let i = 0; i < sessionConfigs.length; i++) {
    console.log(`\n[${i + 1}/${sessionConfigs.length}] Running simulation...\n`);

    const result = await runSimulation(config, sessionConfigs[i]);
    results.push(result);

    if (i < sessionConfigs.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
    }
  }

  return results;
}

/**
 * Run all scenario types with the same session config
 */
export async function runAllScenarios(
  config: SimulatorConfig,
  sessionConfig: SessionConfig,
): Promise<Map<ScenarioType, SimulationResult>> {
  const scenarios = new SimulationScenarios(config);
  const results = new Map<ScenarioType, SimulationResult>();

  const scenarioTypes = [
    ScenarioType.BASIC,
    ScenarioType.MULTIPLE_CHUNKS,
    ScenarioType.QUICK_RECORDING,
    ScenarioType.SLOW_PROCESSING,
  ];

  for (const scenarioType of scenarioTypes) {
    const startTime = Date.now();
    const simulator = new EpicHaikuSimulator(config);

    try {
      await scenarios.runScenario(scenarioType, sessionConfig);

      results.set(scenarioType, {
        success: true,
        sessionId: simulator.getSessionId(),
        recordingVersion: simulator.getRecordingVersion(),
        duration: Date.now() - startTime,
        steps: 0,
      });
    } catch (error) {
      results.set(scenarioType, {
        success: false,
        sessionId: simulator.getSessionId(),
        recordingVersion: simulator.getRecordingVersion(),
        duration: Date.now() - startTime,
        steps: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Generate a summary report of simulation results
 */
export function generateReport(results: SimulationResult[]): string {
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const averageDuration = totalDuration / results.length;

  let report = '\n═══════════════════════════════════════════════════════════\n';
  report += '                    Simulation Report\n';
  report += '═══════════════════════════════════════════════════════════\n';
  report += `\nTotal Simulations: ${results.length}\n`;
  report += `✓ Successful: ${successful}\n`;
  report += `✗ Failed: ${failed}\n`;
  report += `\nTiming:\n`;
  report += `  Total Duration: ${totalDuration}ms\n`;
  report += `  Average Duration: ${averageDuration.toFixed(2)}ms\n`;
  report += `  Min Duration: ${Math.min(...results.map((r) => r.duration))}ms\n`;
  report += `  Max Duration: ${Math.max(...results.map((r) => r.duration))}ms\n`;

  if (failed > 0) {
    report += '\nFailed Simulations:\n';
    results.forEach((result, index) => {
      if (!result.success) {
        report += `  ${index + 1}. Session ${result.sessionId}\n`;
        report += `     Error: ${result.error}\n`;
      }
    });
  }

  report += '\n═══════════════════════════════════════════════════════════\n';

  return report;
}

/**
 * Generate scenario comparison report
 */
export function generateScenarioReport(results: Map<ScenarioType, SimulationResult>): string {
  let report = '\n═══════════════════════════════════════════════════════════\n';
  report += '               Scenario Comparison Report\n';
  report += '═══════════════════════════════════════════════════════════\n';

  results.forEach((result, scenarioType) => {
    report += `\n${scenarioType.toUpperCase()}\n`;
    report += '─────────────────────────────────────────────────────────\n';
    report += `Status: ${result.success ? '✓ Success' : '✗ Failed'}\n`;
    report += `Duration: ${result.duration}ms\n`;
    report += `Session ID: ${result.sessionId}\n`;

    if (!result.success) {
      report += `Error: ${result.error}\n`;
    }
  });

  report += '\n═══════════════════════════════════════════════════════════\n';

  return report;
}

/**
 * Create a test session config with generated IDs
 */
export function createTestSessionConfig(overrides?: Partial<SessionConfig>): SessionConfig {
  const testIds = generateTestIds();

  return {
    userID: testIds.userId,
    patientID: [{ ID: testIds.patientId, Type: 'FHIR' }],
    encounterID: [{ ID: testIds.encounterId, Type: 'FHIR' }],
    totalChunks: 3,
    chunkDelayMs: 500,
    recordingDelayMs: 2000,
    ...overrides,
  };
}

/**
 * Validate simulator configuration
 */
export function validateSimulatorConfig(config: Partial<SimulatorConfig>): string[] {
  const errors: string[] = [];

  if (!config.baseUrl) {
    errors.push('baseUrl is required');
  } else if (!/^https?:\/\/.+/.test(config.baseUrl)) {
    errors.push('baseUrl must be a valid URL');
  }

  if (!config.customerID) {
    errors.push('customerID is required');
  }

  if (!config.customerSecret) {
    errors.push('customerSecret is required');
  }

  if (!config.haikuClientId) {
    errors.push('haikuClientId is required');
  }

  return errors;
}

/**
 * Validate session configuration
 */
export function validateSessionConfig(config: Partial<SessionConfig>): string[] {
  const errors: string[] = [];

  if (!config.userID) {
    errors.push('userID is required');
  }

  if (!config.patientID || config.patientID.length === 0) {
    errors.push('patientID is required and must have at least one entry');
  }

  if (!config.encounterID || config.encounterID.length === 0) {
    errors.push('encounterID is required and must have at least one entry');
  }

  if (config.totalChunks && config.totalChunks < 1) {
    errors.push('totalChunks must be at least 1');
  }

  if (config.chunkDelayMs && config.chunkDelayMs < 0) {
    errors.push('chunkDelayMs cannot be negative');
  }

  if (config.recordingDelayMs && config.recordingDelayMs < 0) {
    errors.push('recordingDelayMs cannot be negative');
  }

  return errors;
}

/**
 * Pretty print a configuration
 */
export function printConfig(
  simulatorConfig: SimulatorConfig,
  sessionConfig: SessionConfig,
): void {
  console.log('\nConfiguration:\n');
  console.log('Simulator:');
  console.log(`  Base URL: ${simulatorConfig.baseUrl}`);
  console.log(`  Customer ID: ${simulatorConfig.customerID}`);
  console.log(`  Haiku Client ID: ${simulatorConfig.haikuClientId}`);
  console.log('\nSession:');
  console.log(`  User ID: ${sessionConfig.userID}`);
  console.log(`  Patient ID: ${sessionConfig.patientID[0]?.ID}`);
  console.log(`  Encounter ID: ${sessionConfig.encounterID[0]?.ID}`);
  console.log(`  Total Chunks: ${sessionConfig.totalChunks || 'default'}`);
  console.log(`  Chunk Delay: ${sessionConfig.chunkDelayMs || 'default'}ms`);
  console.log(`  Recording Delay: ${sessionConfig.recordingDelayMs || 'default'}ms`);
  console.log();
}
