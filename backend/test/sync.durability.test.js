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
  });

  it('should track dirty documents on edits and persist them to MongoDB', async () => {
    // 1. Update doc state
    await docManager.updateDocumentState(testFile._id.toString(), 'console.log("modified");', 2);

    // 2. Check dirty docs list
    const dirty = await docManager.getDirtyDocs();
    expect(dirty).toContain(testFile._id.toString());

    // 3. Flush dirty docs
    const count = await snapshotService.flushAllDirtyDocuments();
    expect(count).toBeGreaterThanOrEqual(1);

    // 4. Verify MongoDB contains updated content
    const updated = await File.findById(testFile._id);
    expect(updated.content).toBe('console.log("modified");');
    expect(updated.version).toBe(2);

    // 5. Verify marked clean
    const dirtyAfter = await docManager.getDirtyDocs();
    expect(dirtyAfter).not.toContain(testFile._id.toString());
  });

  it('should apply valid differential patches and broadcast changes over WebSocket', (done) => {
    const socket = Client(`http://localhost:${port}`, {
      auth: { token: userToken },
      transports: ['websocket']
    });

    const fileId = testFile._id.toString();

    socket.on('connect', () => {
      socket.emit('room:join', { fileId });
    });

    socket.on('code:sync', async (data) => {
      expect(data.content).toBe('console.log("initial");');

      // Create patch: change initial to collaborative
      const patch = crdt.createPatch('console.log("initial");', 'console.log("collaborative");');

      socket.emit('code:edit', {
        fileId,
        change: { patch },
        version: 2
      });

      // Allow event loop to process edit
      setTimeout(async () => {
        const doc = await docManager.getOrCreateDocument(fileId);
        expect(doc.content).toBe('console.log("collaborative");');
        expect(doc.version).toBe(2);

        socket.close();
        done();
      }, 300);
    });
  });
});
