/**
 * Epic Haiku Simulation Scenarios
 *
 * This module provides pre-configured scenarios for testing different
 * Epic Haiku workflows and edge cases.
 */

import { EpicHaikuSimulator, SessionConfig, SimulatorConfig } from './epic-haiku.simulator.js';

export enum ScenarioType {
  BASIC = 'basic',
  MULTIPLE_CHUNKS = 'multiple-chunks',
  QUICK_RECORDING = 'quick-recording',
  SLOW_PROCESSING = 'slow-processing',
}

export interface ScenarioConfig extends SimulatorConfig {
  scenario: ScenarioType;
  sessionConfig: SessionConfig;
}

export class SimulationScenarios {
  private config: SimulatorConfig;

  constructor(config: SimulatorConfig) {
    this.config = config;
  }

  /**
   * Scenario 1: Basic workflow
   * Standard Epic Haiku flow with 3 chunks and normal processing time
   */
  async runBasicScenario(sessionConfig: SessionConfig): Promise<void> {
    console.log('\n📋 Running: Basic Workflow Scenario\n');
    const simulator = new EpicHaikuSimulator(this.config);

    const enhancedSessionConfig: SessionConfig = {
      ...sessionConfig,
      totalChunks: 3,
      chunkDelayMs: 500,
      recordingDelayMs: 2000,
    };

    await simulator.runFullSimulation(enhancedSessionConfig);
  }

  /**
   * Scenario 2: Multiple chunks
   * Simulates a longer recording with many chunks (real-world scenario)
   */
  async runMultipleChunksScenario(sessionConfig: SessionConfig): Promise<void> {
    console.log('\n🔊 Running: Multiple Chunks Scenario (Long Recording)\n');
    const simulator = new EpicHaikuSimulator(this.config);

    const enhancedSessionConfig: SessionConfig = {
      ...sessionConfig,
      totalChunks: 10,
      chunkDelayMs: 300,
      recordingDelayMs: 3000,
    };

    await simulator.runFullSimulation(enhancedSessionConfig);
  }

  /**
   * Scenario 3: Quick recording
   * Simulates a short recording with minimal chunks
   */
  async runQuickRecordingScenario(sessionConfig: SessionConfig): Promise<void> {
    console.log('\n⚡ Running: Quick Recording Scenario\n');
    const simulator = new EpicHaikuSimulator(this.config);

    const enhancedSessionConfig: SessionConfig = {
      ...sessionConfig,
      totalChunks: 1,
      chunkDelayMs: 0,
      recordingDelayMs: 500,
    };

    await simulator.runFullSimulation(enhancedSessionConfig);
  }

  /**
   * Scenario 4: Slow processing
   * Simulates slow network or processing with larger delays between events
   */
  async runSlowProcessingScenario(sessionConfig: SessionConfig): Promise<void> {
    console.log('\n🐢 Running: Slow Processing Scenario\n');
    const simulator = new EpicHaikuSimulator(this.config);

    const enhancedSessionConfig: SessionConfig = {
      ...sessionConfig,
      totalChunks: 5,
      chunkDelayMs: 2000,
      recordingDelayMs: 5000,
    };

    await simulator.runFullSimulation(enhancedSessionConfig);
  }

  /**
   * Run a scenario by type
   */
  async runScenario(
    scenarioType: ScenarioType,
    sessionConfig: SessionConfig,
  ): Promise<void> {
    switch (scenarioType) {
      case ScenarioType.BASIC:
        await this.runBasicScenario(sessionConfig);
        break;
      case ScenarioType.MULTIPLE_CHUNKS:
        await this.runMultipleChunksScenario(sessionConfig);
        break;
      case ScenarioType.QUICK_RECORDING:
        await this.runQuickRecordingScenario(sessionConfig);
        break;
      case ScenarioType.SLOW_PROCESSING:
        await this.runSlowProcessingScenario(sessionConfig);
        break;
      default:
        throw new Error(`Unknown scenario type: ${scenarioType}`);
    }
  }

  /**
   * Run all scenarios in sequence
   */
  async runAllScenarios(sessionConfig: SessionConfig): Promise<void> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('     Running All Epic Haiku Simulation Scenarios');
    console.log('═══════════════════════════════════════════════════════════\n');

    const scenarios = [
      ScenarioType.BASIC,
      ScenarioType.MULTIPLE_CHUNKS,
      ScenarioType.QUICK_RECORDING,
      ScenarioType.SLOW_PROCESSING,
    ];

    for (let i = 0; i < scenarios.length; i++) {
      console.log(`\n[${i + 1}/${scenarios.length}]`);
      try {
        await this.runScenario(scenarios[i], sessionConfig);
        console.log(`✓ ${scenarios[i]} completed successfully\n`);
      } catch (error) {
        console.error(`✗ ${scenarios[i]} failed\n`);
        // Continue to next scenario even if one fails
      }

      // Wait between scenarios
      if (i < scenarios.length - 1) {
        console.log('Waiting 2 seconds before next scenario...\n');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('     All Scenarios Complete');
    console.log('═══════════════════════════════════════════════════════════\n');
  }
}
