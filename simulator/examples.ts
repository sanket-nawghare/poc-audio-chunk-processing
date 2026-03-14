/**
 * Epic Haiku Simulator - Usage Examples
 *
 * This file demonstrates various ways to use the Epic Haiku Simulator
 */

import {
  EpicHaikuSimulator,
  SimulationScenarios,
  ScenarioType,
} from './index.js';
import {
  runSimulation,
  runMultipleSimulations,
  runAllScenarios,
  generateReport,
  generateScenarioReport,
  createTestSessionConfig,
  validateSimulatorConfig,
  validateSessionConfig,
  printConfig,
  generateTestIds,
} from './utils.js';

// ============================================================================
// Example 1: Basic Single Simulation
// ============================================================================
export async function example1BasicSimulation(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('     Example 1: Basic Single Simulation');
  console.log('═══════════════════════════════════════════════════════════\n');

  const simulator = new EpicHaikuSimulator({
    baseUrl: 'http://localhost:3000',
    customerID: 'epic-customer-123',
    customerSecret: 'secret123',
    haikuClientId: 'haiku-client-456',
  });

  const sessionConfig = {
    userID: 'practitioner-001',
    patientID: [{ ID: 'patient-001', Type: 'FHIR' }],
    encounterID: [{ ID: 'encounter-001', Type: 'FHIR' }],
  };

  try {
    await simulator.runFullSimulation(sessionConfig);
    console.log('\n✓ Example 1 completed successfully\n');
  } catch (error) {
    console.error('\n✗ Example 1 failed:', error, '\n');
  }
}

// ============================================================================
// Example 2: Using Scenarios
// ============================================================================
export async function example2Scenarios(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('     Example 2: Using Pre-configured Scenarios');
  console.log('═══════════════════════════════════════════════════════════\n');

  const config = {
    baseUrl: 'http://localhost:3000',
    customerID: 'epic-customer-123',
    customerSecret: 'secret123',
    haikuClientId: 'haiku-client-456',
  };

  const scenarios = new SimulationScenarios(config);
  const sessionConfig = createTestSessionConfig();

  try {
    // Run a specific scenario
    await scenarios.runScenario(ScenarioType.MULTIPLE_CHUNKS, sessionConfig);
    console.log('\n✓ Example 2 completed successfully\n');
  } catch (error) {
    console.error('\n✗ Example 2 failed:', error, '\n');
  }
}

// ============================================================================
// Example 3: Running All Scenarios
// ============================================================================
export async function example3AllScenarios(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('     Example 3: Running All Scenarios');
  console.log('═══════════════════════════════════════════════════════════\n');

  const config = {
    baseUrl: 'http://localhost:3000',
    customerID: 'epic-customer-123',
    customerSecret: 'secret123',
    haikuClientId: 'haiku-client-456',
  };

  const scenarios = new SimulationScenarios(config);
  const sessionConfig = createTestSessionConfig();

  try {
    await scenarios.runAllScenarios(sessionConfig);
    console.log('\n✓ Example 3 completed successfully\n');
  } catch (error) {
    console.error('\n✗ Example 3 failed:', error, '\n');
  }
}

// ============================================================================
// Example 4: Multiple Simulations with Results
// ============================================================================
export async function example4MultipleSimulations(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('     Example 4: Multiple Simulations with Report');
  console.log('═══════════════════════════════════════════════════════════\n');

  const config = {
    baseUrl: 'http://localhost:3000',
    customerID: 'epic-customer-123',
    customerSecret: 'secret123',
    haikuClientId: 'haiku-client-456',
  };

  // Create 3 different test sessions
  const sessionConfigs = [
    createTestSessionConfig({ totalChunks: 3 }),
    createTestSessionConfig({ totalChunks: 5 }),
    createTestSessionConfig({ totalChunks: 1 }),
  ];

  try {
    const results = await runMultipleSimulations(config, sessionConfigs, 2000);
    console.log(generateReport(results));
    console.log('\n✓ Example 4 completed successfully\n');
  } catch (error) {
    console.error('\n✗ Example 4 failed:', error, '\n');
  }
}

// ============================================================================
// Example 5: Single Simulation with Result Handling
// ============================================================================
export async function example5SingleSimulationWithResults(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('     Example 5: Single Simulation with Result Handling');
  console.log('═══════════════════════════════════════════════════════════\n');

  const config = {
    baseUrl: 'http://localhost:3000',
    customerID: 'epic-customer-123',
    customerSecret: 'secret123',
    haikuClientId: 'haiku-client-456',
  };

  const sessionConfig = createTestSessionConfig();

  try {
    const result = await runSimulation(config, sessionConfig);

    console.log('\nSimulation Result:');
    console.log(`  Success: ${result.success ? '✓' : '✗'}`);
    console.log(`  Session ID: ${result.sessionId}`);
    console.log(`  Recording Version: ${result.recordingVersion}`);
    console.log(`  Duration: ${result.duration}ms`);
    console.log(`  Steps: ${result.steps}`);

    if (!result.success) {
      console.log(`  Error: ${result.error}`);
    }

    console.log('\n✓ Example 5 completed successfully\n');
  } catch (error) {
    console.error('\n✗ Example 5 failed:', error, '\n');
  }
}

// ============================================================================
// Example 6: Configuration Validation
// ============================================================================
export async function example6ConfigurationValidation(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('     Example 6: Configuration Validation');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Valid simulator config
  const validSimulatorConfig = {
    baseUrl: 'http://localhost:3000',
    customerID: 'customer123',
    customerSecret: 'secret123',
    haikuClientId: 'client456',
  };

  // Invalid simulator config
  const invalidSimulatorConfig = {
    baseUrl: 'not-a-url',
    customerID: 'customer123',
  };

  // Valid session config
  const validSessionConfig = createTestSessionConfig();

  // Invalid session config
  const invalidSessionConfig = {
    userID: 'doctor123',
    // missing patientID and encounterID
  };

  console.log('Validating valid simulator config:');
  let errors = validateSimulatorConfig(validSimulatorConfig);
  console.log(errors.length === 0 ? '✓ Valid\n' : `✗ Errors: ${errors.join(', ')}\n`);

  console.log('Validating invalid simulator config:');
  errors = validateSimulatorConfig(invalidSimulatorConfig);
  console.log(`✗ Errors:\n  ${errors.join('\n  ')}\n`);

  console.log('Validating valid session config:');
  errors = validateSessionConfig(validSessionConfig);
  console.log(errors.length === 0 ? '✓ Valid\n' : `✗ Errors: ${errors.join(', ')}\n`);

  console.log('Validating invalid session config:');
  errors = validateSessionConfig(invalidSessionConfig);
  console.log(`✗ Errors:\n  ${errors.join('\n  ')}\n`);

  console.log('✓ Example 6 completed successfully\n');
}

// ============================================================================
// Example 7: Custom Session Configuration
// ============================================================================
export async function example7CustomSessionConfig(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('     Example 7: Custom Session Configuration');
  console.log('═══════════════════════════════════════════════════════════\n');

  const config = {
    baseUrl: 'http://localhost:3000',
    customerID: 'epic-customer-123',
    customerSecret: 'secret123',
    haikuClientId: 'haiku-client-456',
  };

  // Custom session with specific IDs and timing
  const customSessionConfig = {
    userID: 'dr-smith-001',
    patientID: [{ ID: 'john-doe-12345', Type: 'FHIR' }],
    encounterID: [{ ID: 'visit-2024-12-08', Type: 'FHIR' }],
    noteType: 'Progress Note',
    totalChunks: 5,
    chunkDelayMs: 1000,
    recordingDelayMs: 3000,
  };

  printConfig(config, customSessionConfig);

  const simulator = new EpicHaikuSimulator(config);

  try {
    await simulator.runFullSimulation(customSessionConfig);
    console.log('\n✓ Example 7 completed successfully\n');
  } catch (error) {
    console.error('\n✗ Example 7 failed:', error, '\n');
  }
}

// ============================================================================
// Example 8: Generated Test IDs
// ============================================================================
export async function example8GeneratedTestIds(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('     Example 8: Generating Test IDs');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Generate multiple sets of test IDs
  console.log('Generated Test IDs:\n');

  for (let i = 0; i < 3; i++) {
    const ids = generateTestIds();
    console.log(`Set ${i + 1}:`);
    console.log(`  User ID: ${ids.userId}`);
    console.log(`  Patient ID: ${ids.patientId}`);
    console.log(`  Encounter ID: ${ids.encounterId}`);
    console.log();
  }

  console.log('✓ Example 8 completed successfully\n');
}

// ============================================================================
// Run All Examples
// ============================================================================
async function runAllExamples(): Promise<void> {
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     Epic Haiku Simulator - Usage Examples                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Note: Comment out examples that require a running API server
  // await example1BasicSimulation();
  // await example2Scenarios();
  // await example3AllScenarios();
  // await example4MultipleSimulations();
  // await example5SingleSimulationWithResults();
  // await example7CustomSessionConfig();

  // These examples don't require a running API server
  await example6ConfigurationValidation();
  await example8GeneratedTestIds();

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     All Examples Complete                                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
}

export { runAllExamples };
