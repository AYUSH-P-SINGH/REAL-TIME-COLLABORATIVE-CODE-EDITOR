const docManager = require('../src/sync/document.manager');
const snapshotService = require('../src/sync/snapshot.service');
const walService = require('../src/sync/wal.service');
const crdt = require('../src/sync/crdt');

describe('Write-Ahead Log (WAL) & Crash Recovery Durability Test', () => {
  const testFileId = 'file_crash_test_123';

  beforeEach(() => {
    docManager.inMemoryDocCache.clear();
    docManager.inMemoryDirtyDocs.clear();
    docManager.inMemorySnapshots.clear();
    walService.clearInMemoryWal();
  });

  it('should log every binary update to the WAL and recover full state after simulated server crash', async () => {
    // 1. Initial document creation and initial snapshot
    const initialDocRecord = await docManager.getOrCreateDocument(testFileId);
    crdt.setText(initialDocRecord.doc, 'function main() {}\n');
    await snapshotService.persistDocument(testFileId);

    // 2. Client makes first edit: insert comment
    const clientDoc = crdt.initDocFromState(crdt.encodeState(initialDocRecord.doc));
    let editUpdate1 = null;
    clientDoc.on('update', (u) => { editUpdate1 = u; });
    clientDoc.getText('content').insert(0, '// Author: Antigravity\n');

    const result1 = await docManager.applyClientUpdate(testFileId, editUpdate1, 'user-1');
    expect(result1.seq).toBe(1);

    // 3. Client makes second edit: insert calculation
    let editUpdate2 = null;
    clientDoc.on('update', (u) => { editUpdate2 = u; });
    clientDoc.getText('content').insert(clientDoc.getText('content').length, 'const result = 42;\n');

    const result2 = await docManager.applyClientUpdate(testFileId, editUpdate2, 'user-1');
    expect(result2.seq).toBe(2);

    // Check dirty status
    const dirty = await docManager.getDirtyDocs();
    expect(dirty).toContain(testFileId);

    // 4. Verify WAL has recorded sequence 1 and 2
    const pending = await walService.getPendingUpdates(testFileId, 0);
    expect(pending.length).toBe(2);
    expect(pending[0].seq).toBe(1);
    expect(pending[1].seq).toBe(2);

    // 5. SIMULATE HARD SERVER CRASH: wipe in-memory cache completely
    docManager.evictDocFromMemory(testFileId);
    expect(docManager.inMemoryDocCache.has(testFileId)).toBe(false);

    // 6. Node reboots and reloads document: WAL replayer must restore all updates
    const recoveredRecord = await docManager.getOrCreateDocument(testFileId);
    const recoveredText = crdt.getText(recoveredRecord.doc);

    // 7. Assert that recovered document contains all edits with zero loss
    expect(recoveredText).toContain('// Author: Antigravity\n');
    expect(recoveredText).toContain('function main() {}\n');
    expect(recoveredText).toContain('const result = 42;\n');
    expect(recoveredRecord.lastSeq).toBe(2);
  });

  it('should compact WAL after snapshot persistence to prevent unbounded log growth', async () => {
    // 1. Load document and apply 3 edits
    const docRecord = await docManager.getOrCreateDocument(testFileId);
    crdt.setText(docRecord.doc, 'let count = 0;\n');

    for (let i = 1; i <= 3; i++) {
      const tempDoc = crdt.initDocFromState(crdt.encodeState(docRecord.doc));
      let captured = null;
      tempDoc.on('update', (u) => { captured = u; });
      tempDoc.getText('content').insert(tempDoc.getText('content').length, `count += ${i};\n`);
      await docManager.applyClientUpdate(testFileId, captured, 'user-1');
    }

    // 2. Verify WAL contains 3 entries
    let pending = await walService.getPendingUpdates(testFileId, 0);
    expect(pending.length).toBe(3);

    // 3. Compact log up to sequence 2
    await walService.compactLog(testFileId, 2);

    // 4. Verify earlier entries pruned, only sequence > 2 remains
    pending = await walService.getPendingUpdates(testFileId, 0);
    expect(pending.length).toBe(1);
    expect(pending[0].seq).toBe(3);
  });
});
