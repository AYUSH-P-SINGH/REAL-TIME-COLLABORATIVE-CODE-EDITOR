const crdt = require('../src/sync/crdt');

describe('Yjs CRDT Convergence Test Suite', () => {
  it('should converge 2 clients with concurrent edits at the same index', () => {
    const docA = crdt.createDoc('Hello World');
    const docB = crdt.initDocFromState(crdt.encodeState(docA));

    // Client A inserts " Beautiful" after "Hello"
    const updatesA = [];
    docA.on('update', (update) => updatesA.push(update));
    docA.getText('content').insert(5, ' Beautiful');

    // Client B concurrently inserts " Brave" at index 5
    const updatesB = [];
    docB.on('update', (update) => updatesB.push(update));
    docB.getText('content').insert(5, ' Brave');

    // Cross-apply updates (simulating network transmission)
    updatesA.forEach((u) => crdt.applyUpdate(docB, u));
    updatesB.forEach((u) => crdt.applyUpdate(docA, u));

    // Both clients must arrive at the EXACT same string
    const textA = crdt.getText(docA);
    const textB = crdt.getText(docB);

    expect(textA).toBe(textB);
    expect(textA).toContain('Hello');
    expect(textA).toContain('World');
    expect(textA).toContain('Beautiful');
    expect(textA).toContain('Brave');
  });

  it('should converge 5 clients with chaotic random concurrent edits and reordered network delivery', () => {
    const NUM_CLIENTS = 5;
    const NUM_OPERATIONS = 40;

    // Initialize 5 clients starting with the same seed
    const initialText = 'function computeState(nodes) {\n  return nodes.map(n => n.id);\n}\n';
    const initialDoc = crdt.createDoc(initialText);
    const initialState = crdt.encodeState(initialDoc);

    const clients = Array.from({ length: NUM_CLIENTS }, (_, i) => ({
      id: `client-${i + 1}`,
      doc: crdt.initDocFromState(initialState),
      pendingOutgoing: []
    }));

    // Attach update listeners to capture generated binary updates
    clients.forEach((client) => {
      client.doc.on('update', (update) => {
        client.pendingOutgoing.push(update);
      });
    });

    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789_() {}+=;';

    // Simulate concurrent typing across all clients
    for (let op = 0; op < NUM_OPERATIONS; op++) {
      const clientIndex = Math.floor(Math.random() * NUM_CLIENTS);
      const client = clients[clientIndex];
      const yText = client.doc.getText('content');
      const currentLen = yText.length;

      const action = Math.random() > 0.35 ? 'insert' : 'delete';

      if (action === 'insert' || currentLen === 0) {
        const insertPos = Math.floor(Math.random() * (currentLen + 1));
        const insertChar = characters[Math.floor(Math.random() * characters.length)];
        yText.insert(insertPos, insertChar);
      } else {
        const deletePos = Math.floor(Math.random() * currentLen);
        const deleteLen = Math.min(Math.floor(Math.random() * 3) + 1, currentLen - deletePos);
        yText.delete(deletePos, deleteLen);
      }
    }

    // Collect all generated network packets
    const networkPackets = [];
    clients.forEach((client, senderIdx) => {
      client.pendingOutgoing.forEach((update) => {
        networkPackets.push({ senderIdx, update });
      });
    });

    // Shuffle packets randomly to simulate arbitrary network reordering and delay
    for (let i = networkPackets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [networkPackets[i], networkPackets[j]] = [networkPackets[j], networkPackets[i]];
    }

    // Deliver all packets to all other clients
    networkPackets.forEach(({ senderIdx, update }) => {
      clients.forEach((recipient, recipientIdx) => {
        if (senderIdx !== recipientIdx) {
          crdt.applyUpdate(recipient.doc, update);
        }
      });
    });

    // Verify all 5 documents converged to the EXACT same text
    const finalTexts = clients.map((c) => crdt.getText(c.doc));
    const firstText = finalTexts[0];

    for (let i = 1; i < NUM_CLIENTS; i++) {
      expect(finalTexts[i]).toBe(firstText);
    }

    // Verify all 5 documents have matching state vectors
    const firstVector = crdt.encodeStateVector(clients[0].doc);
    for (let i = 1; i < NUM_CLIENTS; i++) {
      const vector = crdt.encodeStateVector(clients[i].doc);
      expect(Buffer.from(vector).equals(Buffer.from(firstVector))).toBe(true);
    }
  });

  it('should handle offline editing and seamless reconnection without data loss', () => {
    // 1. Initial synced state
    const serverDoc = crdt.createDoc('const x = 10;\n');
    const clientDoc = crdt.initDocFromState(crdt.encodeState(serverDoc));

    // 2. Client goes offline: edits independently
    const clientOfflineUpdates = [];
    clientDoc.on('update', (u) => clientOfflineUpdates.push(u));
    clientDoc.getText('content').insert(14, 'const y = 20;\n');

    // 3. Meanwhile, server / other peers edit concurrently
    const serverUpdates = [];
    serverDoc.on('update', (u) => serverUpdates.push(u));
    serverDoc.getText('content').insert(0, '// Config Header\n');

    // 4. Client reconnects: exchange delta updates using state vectors
    const clientVector = crdt.encodeStateVector(clientDoc);
    const serverVector = crdt.encodeStateVector(serverDoc);

    const missingOnClient = crdt.diffState(serverDoc, clientVector);
    const missingOnServer = crdt.diffState(clientDoc, serverVector);

    crdt.applyUpdate(clientDoc, missingOnClient);
    crdt.applyUpdate(serverDoc, missingOnServer);

    // 5. Assert convergence
    expect(crdt.getText(clientDoc)).toBe(crdt.getText(serverDoc));
    expect(crdt.getText(clientDoc)).toContain('// Config Header\n');
    expect(crdt.getText(clientDoc)).toContain('const x = 10;\n');
    expect(crdt.getText(clientDoc)).toContain('const y = 20;\n');
  });

  it('should efficiently serialize binary updates (Uint8Array) with minimal byte size', () => {
    const doc = crdt.createDoc('Initial state');
    let capturedUpdate = null;
    doc.on('update', (u) => {
      capturedUpdate = u;
    });

    doc.getText('content').insert(13, '!');

    expect(capturedUpdate).toBeInstanceOf(Uint8Array);
    // Binary update for a single keystroke is typically less than 40 bytes in Yjs
    expect(capturedUpdate.length).toBeLessThan(50);
  });
});
