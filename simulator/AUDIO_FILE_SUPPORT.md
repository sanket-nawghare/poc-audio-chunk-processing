# Audio File Support for Epic Haiku Simulator

## Overview

The Epic Haiku Simulator now supports sending **actual audio file chunks** instead of simulated audio data. This allows for more realistic testing with real voice recordings.

## How It Works

### With Simulated Audio (Default)
If no audio file is provided, the simulator generates mock audio data:
- Each chunk: 10KB - 50KB of pseudo-random audio data
- Simulates AAC format structure
- Useful for quick testing without audio files

### With Real Audio Files
When you provide an audio file:
- The file is split into N chunks (where N = `--chunks` parameter)
- Each chunk is Base64 encoded and sent in the request
- Chunks are sent sequentially with configurable delays
- Supports any audio format (AAC recommended)

## Usage

### CLI Example with Audio File

```bash
# Basic usage with audio file
npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id your-customer-id \
  --customer-secret your-secret \
  --client-id your-client-id \
  --user-id practitioner123 \
  --patient-id patient456 \
  --encounter-id encounter789 \
  --audio-file ./recordings/patient-voice.aac

# With 10 chunks and custom timing
npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id your-customer-id \
  --customer-secret your-secret \
  --client-id your-client-id \
  --user-id practitioner123 \
  --patient-id patient456 \
  --encounter-id encounter789 \
  --audio-file ./recordings/long-recording.aac \
  --chunks 10 \
  --chunk-delay 300 \
  --recording-delay 3000
```

### Programmatic Usage

```typescript
import { EpicHaikuSimulator } from 'src/common/simulator';
import * as fs from 'fs/promises';

const simulator = new EpicHaikuSimulator({
  baseUrl: 'http://localhost:3000',
  customerID: 'your-customer-id',
  customerSecret: 'your-secret',
  haikuClientId: 'your-client-id',
});

// Method 1: Using file path
await simulator.runFullSimulation({
  userID: 'practitioner123',
  patientID: [{ ID: 'patient456', Type: 'FHIR' }],
  encounterID: [{ ID: 'encounter789', Type: 'FHIR' }],
  audioFilePath: './recordings/patient-voice.aac',
  totalChunks: 5,
});

// Method 2: Using Buffer directly
const audioBuffer = await fs.readFile('./recordings/patient-voice.aac');
await simulator.runFullSimulation({
  userID: 'practitioner123',
  patientID: [{ ID: 'patient456', Type: 'FHIR' }],
  encounterID: [{ ID: 'encounter789', Type: 'FHIR' }],
  audioData: audioBuffer,
  totalChunks: 5,
});
```

## Data Format

### Request Payload with Audio

```json
{
  "sessionID": "sim-1702097845000-xyz123abc",
  "recording": "457123",
  "chunk": "1",
  "chunkData": "//NExAAAAANIAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV...",
  "chunkSize": 12345,
  "contentType": "audio/aac"
}
```

**Fields:**
- `sessionID` - Unique session identifier
- `recording` - Recording version number
- `chunk` - Chunk number (1-based)
- `chunkData` - Base64-encoded audio chunk
- `chunkSize` - Size of chunk in bytes
- `contentType` - MIME type of audio (audio/aac)

## Chunk Distribution

When splitting a file into N chunks, the simulator:
1. Calculates: `chunkSize = fileSize / totalChunks`
2. Chunk 1: bytes [0, chunkSize)
3. Chunk 2: bytes [chunkSize, 2*chunkSize)
4. Chunk N: bytes [(N-1)*chunkSize, fileSize]

**Example:**
- File size: 100KB
- Chunks: 5
- Chunk size: 20KB
- Chunk 1: 0-20KB
- Chunk 2: 20-40KB
- Chunk 3: 40-60KB
- Chunk 4: 60-80KB
- Chunk 5: 80-100KB

## Audio Format Recommendations

### Best Formats
- **AAC** (.aac) - Native Epic format, recommended
- **MP3** (.mp3) - Good compression
- **WAV** (.wav) - Uncompressed, simple

### Recording Specifications
- **Sample Rate:** 16kHz - 48kHz
- **Channels:** Mono (1 channel)
- **Bit Depth:** 16-bit
- **Duration:** Any length (will be split into chunks)

### Recommended Recording Tools

```bash
# Record with ffmpeg
ffmpeg -f alsa -i default -acodec aac -ab 128k output.aac

# Convert to AAC
ffmpeg -i input.wav -codec:a aac -b:a 128k output.aac

# Record with sox
sox -d -r 16000 -c 1 recording.aac
```

## Error Handling

### Missing Audio File
```
⚠ Could not load audio file: ENOENT: no such file or directory, open './recordings/missing.aac'
  Using simulated audio chunks instead
```

If the file cannot be loaded, the simulator automatically falls back to simulated audio.

### File Read Errors
```
⚠ Could not load audio file: Permission denied
  Using simulated audio chunks instead
```

### Supported Errors
- File not found
- Permission denied
- Read errors
- Any file system issue

## Chunk Size Limits

**Recommendations:**
- **Minimum chunk:** 100 bytes
- **Typical chunk:** 10KB - 50KB
- **Maximum chunk:** No hard limit (depends on API)
- **Max total file:** Depends on available memory

**Note:** Large files (>100MB) may need memory optimization.

## Performance Considerations

### Timing with Real Audio
```
Total Time = HTTP Overhead + File Loading + Chunk Delays

HTTP Overhead per request ≈ 200ms
File Loading ≈ 50ms - 500ms (depends on file size)
Chunk Delays = (chunks - 1) * chunkDelayMs
Recording Delay = recordingDelayMs
```

### Example Calculations
**100KB file, 5 chunks, 500ms delays:**
- HTTP requests: 5 × 200ms = 1000ms
- File loading: 50ms
- Chunk delays: 4 × 500ms = 2000ms
- Recording delay: 2000ms
- **Total: ~5050ms**

## Integration with Workers

The audio chunks are processed by the existing `sendRecordingChunk` worker:

1. Simulator sends chunk with `chunkData`
2. `sendRecordingChunk` worker:
   - Extracts chunk data from request
   - Fetches from Epic's API (or receives from simulator)
   - Transcribes the audio
   - Updates chunk counter
3. When all chunks processed, `sendRecordingAvailable` triggers
4. Note generation and finalization proceeds

## Testing Scenarios

### Scenario 1: Quick Voice Note
```bash
# 30 second recording, split into 3 chunks
ffmpeg -f lavfi -i sine=f=440:d=30 -acodec aac quick-note.aac

npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id test \
  --customer-secret test \
  --client-id test \
  --user-id doctor1 \
  --patient-id patient1 \
  --encounter-id visit1 \
  --audio-file ./quick-note.aac \
  --chunks 3
```

### Scenario 2: Extended Dictation
```bash
# 2 minute dictation, split into 10 chunks for stress testing
npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id test \
  --customer-secret test \
  --client-id test \
  --user-id doctor1 \
  --patient-id patient1 \
  --encounter-id visit1 \
  --audio-file ./long-dictation.aac \
  --chunks 10 \
  --chunk-delay 200
```

### Scenario 3: Slow Network Simulation
```bash
# Simulate slow network with large delays between chunks
npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id test \
  --customer-secret test \
  --client-id test \
  --user-id doctor1 \
  --patient-id patient1 \
  --encounter-id visit1 \
  --audio-file ./recording.aac \
  --chunks 5 \
  --chunk-delay 3000 \
  --recording-delay 5000
```

## Troubleshooting

### Audio File Not Found
```
Error: ENOENT: no such file or directory
Solution: Verify the file path is correct and relative to your working directory
```

### Permission Denied
```
Error: EACCES: permission denied
Solution: Check file permissions: chmod +r ./recordings/file.aac
```

### Audio Format Issues
```
⚠ Could not load audio file
Solution: Ensure file is in a supported format or convertible binary format
```

### Memory Issues with Large Files
```
Error: Cannot allocate memory
Solution: Reduce file size or chunk size; process smaller files
```

## Advanced Usage

### Custom Chunk Processing

```typescript
import { EpicHaikuSimulator } from 'src/common/simulator';
import * as fs from 'fs/promises';

class CustomAudioSimulator extends EpicHaikuSimulator {
  async sendRecordingChunks(
    totalChunks: number,
    chunkDelayMs: number,
    audioData?: Buffer
  ) {
    // Custom implementation with additional processing
    if (audioData) {
      console.log(`Processing ${audioData.length} bytes of audio`);
      // Custom processing...
    }
    
    await super.sendRecordingChunks(totalChunks, chunkDelayMs, audioData);
  }
}
```

### Batch Processing with Audio Files

```typescript
import { runMultipleSimulations } from 'src/common/simulator/utils';
import * as fs from 'fs/promises';
import * as path from 'path';

async function testMultipleRecordings() {
  const recordingsDir = './test-recordings';
  const files = await fs.readdir(recordingsDir);
  
  const configs = await Promise.all(
    files.map(async (file) => {
      const audioData = await fs.readFile(path.join(recordingsDir, file));
      return {
        userID: `doctor-${Math.random()}`,
        patientID: [{ ID: `patient-${Math.random()}`, Type: 'FHIR' }],
        encounterID: [{ ID: `visit-${Math.random()}`, Type: 'FHIR' }],
        audioData,
        totalChunks: 5,
      };
    })
  );

  const results = await runMultipleSimulations(simulatorConfig, configs);
  console.log(generateReport(results));
}
```

## Summary

The audio file support enables:
- ✅ Realistic testing with actual voice recordings
- ✅ Multiple audio format support
- ✅ Flexible chunk distribution
- ✅ Fallback to simulated audio on errors
- ✅ Full integration with existing workers
- ✅ Batch processing capabilities

Start with simulated audio for quick testing, then use real audio files for comprehensive validation!
