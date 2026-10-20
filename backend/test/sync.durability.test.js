const http = require('http');
const { io: Client } = require('socket.io-client');
const app = require('../src/app');
const { setupSockets } = require('../src/socket');
const docManager = require('../src/sync/document.manager');
const snapshotService = require('../src/sync/snapshot.service');
const crdt = require('../src/sync/crdt');
const File = require('../src/files/file.model');
const Project = require('../src/projects/project.model');
const User = require('../src/user/user.model');
const authService = require('../src/auth/auth.service');

const mongoose = require('mongoose');
const jwt = require('../src/utils/jwt');

describe('Document Synchronization & Snapshot Durability', () => {
  let server, ioServer, port, userToken, testProject, testFile;

  beforeAll((done) => {
    server = http.createServer(app);
    ioServer = setupSockets(server);
    server.listen(() => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    ioServer.close();
    server.close(done);
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await Project.deleteMany({});
      await File.deleteMany({});

      const authRes = await authService.register('Dev User', 'dev@test.com', 'SecurePass123!');
      userToken = authRes.token;

      testProject = await Project.create({
        name: 'Sync Project',
        owner: authRes.user.id,
        members: [{ user: authRes.user.id, role: 'editor' }]
      });

      testFile = await File.create({
        name: 'app.js',
        path: 'src/app.js',
        type: 'file',
        project: testProject._id,
        content: 'console.log("initial");',
        version: 1
      });
    } else {
      userToken = jwt.generateToken({
        id: '507f1f77bcf86cd799439011',
        name: 'Dev User',
        email: 'dev@test.com'
      });
      testProject = { _id: '507f1f77bcf86cd799439012' };
      testFile = {
        _id: '507f1f77bcf86cd799439013',
        content: 'console.log("initial");'
      };
      const docRecord = await docManager.getOrCreateDocument(testFile._id.toString());
      crdt.setText(docRecord.doc, 'console.log("initial");');
      await snapshotService.persistDocument(testFile._id.toString());
    }
  });

  it('should track dirty documents on edits and persist them to storage', async () => {
    const fileId = testFile._id.toString();
    const docRecord = await docManager.getOrCreateDocument(fileId);
    
    // Apply client update
    const tempDoc = crdt.initDocFromState(crdt.encodeState(docRecord.doc));
    let binaryUpdate = null;
    tempDoc.on('update', (u) => { binaryUpdate = u; });
    tempDoc.getText('content').insert(tempDoc.getText('content').length, '\n// modified');

    await docManager.applyClientUpdate(fileId, binaryUpdate, 'dev-user');

    // 2. Check dirty docs list
    const dirty = await docManager.getDirtyDocs();
    expect(dirty).toContain(fileId);

    // 3. Flush dirty docs
    const count = await snapshotService.flushAllDirtyDocuments();
    expect(count).toBeGreaterThanOrEqual(1);

    // 4. Verify persisted content
    if (mongoose.connection.readyState === 1) {
      const updated = await File.findById(testFile._id);
      expect(updated.content).toContain('// modified');
    } else {
      const updatedText = await docManager.getDocumentText(fileId);
      expect(updatedText).toContain('// modified');
    }

    // 5. Verify marked clean
    const dirtyAfter = await docManager.getDirtyDocs();
    expect(dirtyAfter).not.toContain(fileId);
  });

  it('should apply valid Yjs updates and broadcast changes over WebSocket', (done) => {
    const socket = Client(`http://localhost:${port}`, {
      auth: { token: userToken },
      transports: ['websocket']
    });

    const fileId = testFile._id.toString();

    socket.on('connect', () => {
      socket.emit('room:join', { fileId });
    });

    socket.on('doc:sync', async (data) => {
      expect(data.content).toBe('console.log("initial");');

      // Create client doc and insert text
      const clientDoc = crdt.initDocFromState(data.state);
      let updatePacket = null;
      clientDoc.on('update', (u) => { updatePacket = u; });
      clientDoc.getText('content').insert(13, 'collaborative ');

      socket.emit('doc:update', {
        fileId,
        update: updatePacket,
        clientTimestamp: Date.now()
      });

      // Allow event loop to process edit
      setTimeout(async () => {
        const docRecord = await docManager.getOrCreateDocument(fileId);
        const text = crdt.getText(docRecord.doc);
        expect(text).toContain('collaborative');

        socket.close();
        done();
      }, 300);
    });
  });
});
