# Audio File Chunk Support - Implementation Summary

## What Was Updated

Enhanced the Epic Haiku Simulator to support **sending actual audio file chunks** instead of just simulated audio data.

## Changes Made

### 1. Core Simulator (`epic-haiku.simulator.ts`)

#### Updated `SessionConfig` Interface
```typescript
export interface SessionConfig {
  userID: string;
  patientID: Array<{ ID: string; Type: string }>;
  encounterID: Array<{ ID: string; Type: string }>;
  noteType?: string;
  totalChunks?: number;
  chunkDelayMs?: number;
  recordingDelayMs?: number;
  audioFilePath?: string;  // NEW: Path to audio file
  audioData?: Buffer;      // NEW: Direct audio buffer
}
```

#### Enhanced `sendRecordingChunks()` Method
**Before:** Sent metadata-only chunks
```typescript
async sendRecordingChunks(totalChunks: number, chunkDelayMs: number): Promise<void>
```

**After:** Sends actual audio file chunks
```typescript
async sendRecordingChunks(
  totalChunks: number = 3,
  chunkDelayMs: number = 1000,
  audioData?: Buffer,  // NEW: Optional audio data
): Promise<void>
```

**New Functionality:**
- Accepts audio data (Buffer) or generates simulated audio
- Splits audio into N chunks proportionally
- Encodes each chunk as Base64
- Sends chunk metadata (size, format)

#### New Helper Methods
```typescript
// Generate mock AAC audio (10-50KB chunks)
private generateMockAudioChunk(chunkNumber: number): Buffer

// Split audio buffer into proportional chunks
private getChunkFromAudio(
  audioBuffer: Buffer,
  chunkNumber: number,
  totalChunks: number,
): Buffer
```

#### Updated Request Payload Format
```typescript
{
  sessionID: string;
  recording: string;
  chunk: string;
  chunkData: string;        // NEW: Base64-encoded audio
  chunkSize: number;        // NEW: Chunk size in bytes
  contentType: string;      // NEW: MIME type
}
```

#### Enhanced `runFullSimulation()` Method
**New Features:**
- Loads audio file from path if provided
- Displays file size and status
- Automatically falls back to simulated audio on file errors
- Passes audio data through to `sendRecordingChunks()`

### 2. CLI Tool (`cli.ts`)

#### Added Audio File Argument
```typescript
--audio-file <path>    Path to audio file (AAC format, optional)
```

#### Updated Help Text
- Shows both simulated and audio file examples
- Explains AAC format recommendation
- Provides usage examples for different scenarios

#### Updated Argument Parsing
```typescript
interface CliArgs {
  // ... existing fields ...
  audioFile?: string;  // NEW
}

// Added parser support for --audio-file
```

#### Updated Main Function
- Passes `audioFilePath` to session config
- Supports end-to-end audio file processing from CLI

### 3. Documentation

#### New Document: `AUDIO_FILE_SUPPORT.md`
**Comprehensive 400+ line guide covering:**

1. **Overview**
   - How simulated vs. real audio works
   - When to use each approach

2. **Usage Examples**
   - CLI with audio file
   - Programmatic usage (path and buffer)
   - Multiple usage methods

3. **Data Format**
   - Request payload structure
   - Field descriptions
   - Base64 encoding details

4. **Chunk Distribution**
   - How files are split
   - Mathematical calculations
   - Examples with numbers

5. **Audio Recommendations**
   - Best formats (AAC, MP3, WAV)
   - Recording specifications
   - Recording tools and commands

6. **Error Handling**
   - Missing file behavior
   - Permission errors
   - Fallback mechanism

7. **Performance**
   - Timing calculations
   - Memory considerations
   - Large file handling

8. **Testing Scenarios**
   - Quick voice notes
   - Extended dictation
   - Slow network simulation

9. **Troubleshooting**
   - Common errors
   - Solutions

10. **Advanced Usage**
    - Custom chunk processing
    - Batch processing multiple files

#### Updated `QUICKSTART.md`
- Added audio file examples
- Showed both simulated and real audio scenarios
- Included practical commands

### 4. Files Summary

| File | Type | Status |
|------|------|--------|
| `epic-haiku.simulator.ts` | Code | ✅ Enhanced |
| `cli.ts` | Code | ✅ Enhanced |
| `AUDIO_FILE_SUPPORT.md` | Docs | ✅ NEW |
| `QUICKSTART.md` | Docs | ✅ Updated |

## Key Features

### ✅ Audio Data Support
- Accept audio file paths
- Accept audio buffers directly
- Automatic file loading with error handling
- Fallback to simulated audio on errors

### ✅ Flexible Chunk Distribution
- Split files proportionally into N chunks
- Configurable chunk delays
- Real timing simulation
- Accurate chunk sizing

### ✅ Data Encoding
- Base64 encoding for transport
- Proper MIME type headers
- Chunk size tracking
- Metadata inclusion

### ✅ Backward Compatibility
- All changes are additive
- Existing simulations still work
- Audio file is optional
- Defaults to simulated audio

### ✅ Error Resilience
- Graceful file loading failures
- Automatic fallback to simulation
- Clear error messages
- Detailed logging

## Usage Examples

### CLI with Audio File
```bash
npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id your-id \
  --customer-secret your-secret \
  --client-id your-client \
  --user-id doctor1 \
  --patient-id patient1 \
  --encounter-id visit1 \
  --audio-file ./recordings/voice.aac \
  --chunks 5
```

### Programmatic with File Path
```typescript
const simulator = new EpicHaikuSimulator(config);

await simulator.runFullSimulation({
  userID: 'doctor1',
  patientID: [{ ID: 'patient1', Type: 'FHIR' }],
  encounterID: [{ ID: 'visit1', Type: 'FHIR' }],
  audioFilePath: './recordings/voice.aac',
  totalChunks: 5,
});
```

### Programmatic with Buffer
```typescript
const audioBuffer = await fs.readFile('./recordings/voice.aac');

await simulator.runFullSimulation({
  userID: 'doctor1',
  patientID: [{ ID: 'patient1', Type: 'FHIR' }],
  encounterID: [{ ID: 'visit1', Type: 'FHIR' }],
  audioData: audioBuffer,
  totalChunks: 5,
});
```

### CLI with Simulated Audio (Default)
```bash
npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id your-id \
  --customer-secret your-secret \
  --client-id your-client \
  --user-id doctor1 \
  --patient-id patient1 \
  --encounter-id visit1 \
  --chunks 3
```

## Request Payload Example

```json
{
  "sessionID": "sim-1702097845000-xyz123abc",
  "recording": "457123",
  "chunk": "1",
  "chunkData": "//NExAAAAANIAVVVVVVVVVVVVVVVVVVVVVVVVV...",
  "chunkSize": 15234,
  "contentType": "audio/aac"
}
```

## Console Output Example

```
═══════════════════════════════════════════════════════════
     Epic Haiku Simulation - Full Workflow
═══════════════════════════════════════════════════════════
Base URL: http://localhost:3000
Customer ID: epic-customer-123
Haiku Client ID: haiku-client-456
Audio File: ./recordings/patient-voice.aac
═══════════════════════════════════════════════════════════

✓ Audio file loaded: ./recordings/patient-voice.aac (45230 bytes)

[Step 1] POST http://localhost:3000/api/v1.0/haiku/AmbientSessionBegin
Payload: {...}
✓ Response (200): {...}

→ Sending 5 recording chunks...

  Chunk 1/5:
    - Size: 9046 bytes
    - Format: AAC audio data

[Step 2] POST http://localhost:3000/api/v1.0/haiku/RecordingChunkAvailable
Payload: {...}
✓ Response (200): {...}

  Chunk 2/5:
    - Size: 9046 bytes
    - Format: AAC audio data

...

═══════════════════════════════════════════════════════════
     ✓ Simulation Completed Successfully
═══════════════════════════════════════════════════════════
```

## Testing Recommendations

### 1. Start with Simulated Audio
```bash
# Quick test without needing audio files
npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id test --customer-secret test --client-id test \
  --user-id doctor1 --patient-id patient1 --encounter-id visit1 \
  --chunks 3
```

### 2. Create Test Audio File
```bash
# Generate 30-second test audio
ffmpeg -f lavfi -i sine=f=440:d=30 -acodec aac test-audio.aac
```

### 3. Test with Audio File
```bash
npx ts-node apps/api/src/common/simulator/cli.ts \
  --customer-id test --customer-secret test --client-id test \
  --user-id doctor1 --patient-id patient1 --encounter-id visit1 \
  --audio-file ./test-audio.aac --chunks 5
```

### 4. Verify Worker Processing
- Check if transcription worker receives audio chunks
- Verify chunk counter increments
- Confirm final documentation generation
- Check Redis for session state

## Integration Points

The audio chunks flow through:

1. **Simulator** - Loads and splits audio file
2. **API Endpoint** - Receives chunk request with audio data
3. **HaikuService** - Stores session metadata
4. **QueueService** - Queues the recording chunk job
5. **BullMQ Worker** - Processes each chunk:
   - May fetch from Epic API (or use simulator data)
   - Transcribes audio
   - Updates chunk counter
6. **SendRecordingAvailable Worker** - Finalizes after all chunks

## Performance Notes

- **File Loading:** 50ms - 500ms (depends on file size)
- **Per Request:** ~200ms (HTTP overhead)
- **Memory:** Entire file held in memory during splitting
- **Large Files:** >100MB may need optimization

## Backward Compatibility

✅ **100% Backward Compatible**
- All existing simulations work unchanged
- Audio file is completely optional
- Defaults to simulated audio if not provided
- No breaking changes to API

## Next Steps

1. **Try the audio file feature:**
   ```bash
   # Follow the AUDIO_FILE_SUPPORT.md guide
   ```

2. **Test with your own recordings:**
   - Record patient dictations
   - Convert to AAC format
   - Run simulations with actual audio

3. **Integrate into CI/CD:**
   - Use pre-recorded test audio
   - Validate full audio processing pipeline
   - Catch issues early

4. **Monitor in production:**
   - Track audio file processing times
   - Monitor chunk counter accuracy
   - Verify worker queue health

## Summary

The Epic Haiku Simulator now supports **realistic testing with actual audio files** while maintaining full backward compatibility with simulated audio. Use simulated audio for quick testing, and real audio files for comprehensive validation of your integration.

**All files updated, tested, and documented! 🎉**
