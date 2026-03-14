import test from "node:test";
import assert from "node:assert/strict";
import { sessionAggregationService } from "../../src/services/session-aggregation.service";

test("detects duplicate and out-of-order chunks", async () => {
  const base = {
    sessionId: "s-1",
    recordingId: "r-1",
    patientId: "p-1",
    encounterId: "e-1",
    totalChunks: 3,
    audioRef: "s3://x",
  };

  await sessionAggregationService.processChunk({
    ...base,
    chunkIndex: 1,
    timestamp: "2026-03-09T10:00:02.000Z",
  });

  const second = await sessionAggregationService.processChunk({
    ...base,
    chunkIndex: 0,
    timestamp: "2026-03-09T10:00:01.000Z",
  });

  const third = await sessionAggregationService.processChunk({
    ...base,
    chunkIndex: 0,
    timestamp: "2026-03-09T10:00:01.000Z",
  });

  assert.equal(second.outOfOrderCount, 1);
  assert.equal(third.duplicateChunkIndexes.has(0), true);
});
