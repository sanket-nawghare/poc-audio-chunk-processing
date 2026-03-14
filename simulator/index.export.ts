/**
 * Epic Haiku Simulator Module - Updated Exports
 *
 * Complete export of all simulator functionality for convenient importing
 */

// Main simulator class
export { EpicHaikuSimulator } from './epic-haiku.simulator.js';
export type { SimulatorConfig, SessionConfig } from './epic-haiku.simulator.js';

// Scenarios
export { SimulationScenarios, ScenarioType } from './scenarios.js';
export type { ScenarioConfig } from './scenarios.js';

// Utilities
export {
  generateTestIds,
  runSimulation,
  runMultipleSimulations,
  runAllScenarios,
  generateReport,
  generateScenarioReport,
  createTestSessionConfig,
  validateSimulatorConfig,
  validateSessionConfig,
  printConfig,
} from './utils.js';
export type { SimulationResult } from './utils.js';

// Re-export examples for easy access
export * from './examples.js';
