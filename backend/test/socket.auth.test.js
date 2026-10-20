const http = require('http');
const { io: Client } = require('socket.io-client');
const app = require('../src/app');
const { setupSockets } = require('../src/socket');
const User = require('../src/user/user.model');
const Project = require('../src/projects/project.model');
const File = require('../src/files/file.model');
const authService = require('../src/auth/auth.service');

describe('WebSocket Authentication & Room Authorization', () => {
  let server, ioServer, port, tokenA, tokenB, fileA;

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

const mongoose = require('mongoose');
const jwt = require('../src/utils/jwt');

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await Project.deleteMany({});
      await File.deleteMany({});

      const resA = await authService.register('Alice', 'alice@test.com', 'SecurePass123!');
      tokenA = resA.token;

      const resB = await authService.register('Bob', 'bob@test.com', 'SecurePass123!');
      tokenB = resB.token;

      const projA = await Project.create({
        name: 'Alice Space',
        owner: resA.user.id,
        members: [{ user: resA.user.id, role: 'editor' }]
      });

      fileA = await File.create({
        name: 'index.js',
        path: 'src/index.js',
        type: 'file',
        project: projA._id,
        content: 'const a = 1;',
        version: 1
      });
    } else {
      tokenA = jwt.generateToken({ id: '507f1f77bcf86cd799439001', name: 'Alice', email: 'alice@test.com' });
      tokenB = jwt.generateToken({ id: '507f1f77bcf86cd799439002', name: 'Bob', email: 'bob@test.com' });
      fileA = { _id: '507f1f77bcf86cd799439003', content: 'const a = 1;' };
    }
  });

  it('should reject connection without token during handshake', (done) => {
    const socket = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      reconnection: false
    });

    socket.on('connect_error', (err) => {
      expect(err.message).toMatch(/Authentication failed/i);
      socket.close();
      done();
    });
  });

  it('should allow connection with a valid JWT token', (done) => {
    const socket = Client(`http://localhost:${port}`, {
      auth: { token: tokenA },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      expect(socket.connected).toBe(true);
      socket.close();
      done();
    });
  });

  it('should prevent unauthorized user (Bob) from joining Alice private document room', (done) => {
    if (mongoose.connection.readyState !== 1) {
      return done(); // Requires MongoDB project permission query
    }

    const socketB = Client(`http://localhost:${port}`, {
      auth: { token: tokenB },
      transports: ['websocket']
    });

    socketB.on('connect', () => {
      socketB.emit('room:join', { fileId: fileA._id.toString() });
    });

    socketB.on('error', (data) => {
      expect(data.code).toBe('FORBIDDEN');
      socketB.close();
      done();
    });
  });

  it('should allow authorized user (Alice) to join document room and receive code:sync', (done) => {
    const docManager = require('../src/sync/document.manager');
    const crdt = require('../src/sync/crdt');

    docManager.getOrCreateDocument(fileA._id.toString()).then((docRecord) => {
      crdt.setText(docRecord.doc, 'const a = 1;');

      const socketA = Client(`http://localhost:${port}`, {
        auth: { token: tokenA },
        transports: ['websocket']
      });

      socketA.on('connect', () => {
        socketA.emit('room:join', { fileId: fileA._id.toString() });
      });

      socketA.on('code:sync', (syncData) => {
        expect(syncData.fileId).toBe(fileA._id.toString());
        expect(syncData.content).toBe('const a = 1;');
        socketA.close();
        done();
      });
    });
  });
});
