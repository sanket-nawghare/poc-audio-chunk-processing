# Epic Haiku Simulator - Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js/TypeScript environment
- Running API server on `http://localhost:3000`
- Epic integration credentials

### Step 1: Basic CLI Usage

```bash
# Run a single simulation with required parameters
npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id your-customer-id \
  --customer-secret your-secret \
  --client-id your-client-id \
  --user-id practitioner123 \
  --patient-id patient456 \
  --encounter-id encounter789
```

### Step 2: With Custom Timing

```bash
# Run with 5 chunks, 300ms delays between chunks
npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id your-customer-id \
  --customer-secret your-secret \
  --client-id your-client-id \
  --user-id practitioner123 \
  --patient-id patient456 \
  --encounter-id encounter789 \
  --chunks 5 \
  --chunk-delay 300 \
  --recording-delay 2000
```

### Step 3: In Your Code

```typescript
import { EpicHaikuSimulator } from 'src/common/simulator';

const simulator = new EpicHaikuSimulator({
  baseUrl: 'http://localhost:3000',
  customerID: 'your-customer-id',
  customerSecret: 'your-secret',
  haikuClientId: 'your-client-id',
});

await simulator.runFullSimulation({
  userID: 'practitioner123',
  patientID: [{ ID: 'patient456', Type: 'FHIR' }],
  encounterID: [{ ID: 'encounter789', Type: 'FHIR' }],
});
```

## Common Scenarios

### Test with Simulated Audio (Default)
```bash
npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id your-customer-id \
  --customer-secret your-secret \
  --client-id your-client-id \
  --user-id practitioner123 \
  --patient-id patient456 \
  --encounter-id encounter789 \
  --chunks 3
```

### Test with Real Audio File
```bash
# Uses actual audio chunks from a file (AAC format recommended)
npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id your-customer-id \
  --customer-secret your-secret \
  --client-id your-client-id \
  --user-id practitioner123 \
  --patient-id patient456 \
  --encounter-id encounter789 \
  --audio-file ./recordings/patient-voice.aac \
  --chunks 5
```

### Test Load Handling
```bash
npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id your-customer-id \
  --customer-secret your-secret \
  --client-id your-client-id \
  --user-id practitioner123 \
  --patient-id patient456 \
  --encounter-id encounter789 \
  --chunks 20 \
  --chunk-delay 100
```

### Test Slow Network
```bash
npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id your-customer-id \
  --customer-secret your-secret \
  --client-id your-client-id \
  --user-id practitioner123 \
  --patient-id patient456 \
  --encounter-id encounter789 \
  --chunk-delay 2000 \
  --recording-delay 5000
```

### Test Quick Recording
```bash
npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id your-customer-id \
  --customer-secret your-secret \
  --client-id your-client-id \
  --user-id practitioner123 \
  --patient-id patient456 \
  --encounter-id encounter789 \
  --chunks 1 \
  --chunk-delay 0 \
  --recording-delay 500
```

## Environment Variables

Set these to avoid passing them on every CLI call:

```bash
export SIMULATOR_CUSTOMER_ID="your-customer-id"
export SIMULATOR_CUSTOMER_SECRET="your-secret"
export SIMULATOR_HAIKU_CLIENT_ID="your-client-id"
export SIMULATOR_BASE_URL="http://localhost:3000"
```

Then use:

```bash
npx ts-node apps/api/src/common/simulator/cli.ts \
  --user-id practitioner123 \
  --patient-id patient456 \
  --encounter-id encounter789
```

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solution:** Ensure API server is running on http://localhost:3000

### Authentication Failed
```
✗ Error (401): Unauthorized
```
**Solution:** Verify customerID, customerSecret, and haikuClientId are correct

### Timeout
```
Error: timeout of 30000ms exceeded
```
**Solution:** API may be slow or network issues. Check API logs.

## Next Steps

- Read full documentation in [README.md](./README.md)
- Explore [examples.ts](./examples.ts) for advanced usage
- Check API logs for webhook calls and queue jobs
- Monitor Redis for session data and chunk counters

## Directory Structure

```
src/common/simulator/
├── epic-haiku.simulator.ts    # Main class
├── scenarios.ts               # Test scenarios
├── utils.ts                   # Helper functions
├── cli.ts                     # Command-line tool
├── examples.ts                # Usage examples
├── index.ts                   # Exports
├── QUICKSTART.md             # This file
└── README.md                 # Full documentation
```

## Support

For issues or questions:
1. Check API server logs
2. Verify Redis is running
3. Review the full [README.md](./README.md)
4. Check [examples.ts](./examples.ts) for similar use cases
