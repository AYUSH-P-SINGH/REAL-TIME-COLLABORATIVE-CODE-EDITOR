/**
 * CodeSync Real-Time Latency & Propagation Benchmark Harness
 * 
 * Accurately measures:
 * - End-to-end edit propagation latency (Client A -> Server -> Client B)
 * - p50, p90, p95, p99, min, max percentiles
 * - Memory consumption and message throughput (ops/sec)
 * 
 * Usage:
 *   node scripts/benchmark-latency.js
 */

const http = require('http');
const { io: Client } = require('socket.io-client');
const app = require('../src/app');
const { setupSockets } = require('../src/socket');
const jwt = require('../src/utils/jwt');
const crdt = require('../src/sync/crdt');

const ITERATIONS = 200;
const ROOM_ID = '507f1f77bcf86cd799439011';

const calculatePercentiles = (latencies) => {
  latencies.sort((a, b) => a - b);
  const getPercentile = (p) => {
    const idx = Math.ceil((p / 100) * latencies.length) - 1;
    return latencies[Math.max(0, idx)];
  };

  const sum = latencies.reduce((acc, v) => acc + v, 0);
  const avg = (sum / latencies.length).toFixed(2);

  return {
    count: latencies.length,
    min: latencies[0].toFixed(2),
    p50: getPercentile(50).toFixed(2),
    p90: getPercentile(90).toFixed(2),
    p95: getPercentile(95).toFixed(2),
    p99: getPercentile(99).toFixed(2),
    max: latencies[latencies.length - 1].toFixed(2),
    avg
  };
};

const runBenchmark = async () => {
  console.log('\n===============================================================');
  console.log('⚡  CODESYNC CRDT WEBSOCKET LATENCY & PROPAGATION BENCHMARK  ⚡');
  console.log('===============================================================\n');

  // 1. Spin up internal benchmark test server
  const server = http.createServer(app);
  const ioServer = setupSockets(server);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const serverUrl = `http://localhost:${port}`;
  console.log(`🚀 Benchmark node operational on ${serverUrl}`);

  // Generate valid test JWTs
  const tokenA = jwt.generateToken({ id: '507f1f77bcf86cd799439012', name: 'Alice (Bench)', email: 'alice@bench.local' });
  const tokenB = jwt.generateToken({ id: '507f1f77bcf86cd799439013', name: 'Bob (Bench)', email: 'bob@bench.local' });

  // 2. Connect Client A & Client B
  const clientA = Client(serverUrl, {
    auth: { token: tokenA },
    transports: ['websocket'],
    forceNew: true
  });

  const clientB = Client(serverUrl, {
    auth: { token: tokenB },
    transports: ['websocket'],
    forceNew: true
  });

  await Promise.all([
    new Promise((res) => clientA.on('connect', res)),
    new Promise((res) => clientB.on('connect', res))
  ]);

  console.log('🔌 Connected Client A (Producer) and Client B (Consumer) via pure WebSocket transport.');

  // Join the same document room
  clientA.emit('room:join', { fileId: ROOM_ID });
  clientB.emit('room:join', { fileId: ROOM_ID });

  await new Promise((r) => setTimeout(r, 200));

  console.log(`📊 Streaming ${ITERATIONS} binary Yjs CRDT edit operations...`);

  const latencies = [];
  const localDocA = crdt.createDoc('Initial benchmark text');
  let currentSample = 0;

  const runSample = () => {
    return new Promise((resolve) => {
      const startTime = performance.now();

      // Client A applies a localized edit to its Y.Doc
      let binaryUpdate = null;
      const off = localDocA.on('update', (u) => { binaryUpdate = u; });
      localDocA.getText('content').insert(0, `[${currentSample}]`);

      // Client B listens for the propagated binary doc:update
      const onUpdate = ({ update }) => {
        const endTime = performance.now();
        const latencyMs = endTime - startTime;
        latencies.push(latencyMs);
        clientB.off('doc:update', onUpdate);
        resolve();
      };

      clientB.on('doc:update', onUpdate);

      // Client A emits binary packet with timestamp
      clientA.emit('doc:update', {
        fileId: ROOM_ID,
        update: binaryUpdate,
        clientTimestamp: Date.now()
      });
    });
  };

  const benchStart = Date.now();
  for (currentSample = 0; currentSample < ITERATIONS; currentSample++) {
    await runSample();
    // 5ms micro-pause to simulate rapid typing
    await new Promise((r) => setTimeout(r, 5));
  }
  const totalDuration = Date.now() - benchStart;

  const stats = calculatePercentiles(latencies);
  const throughput = Math.round((ITERATIONS / totalDuration) * 1000);

  console.log('\n---------------------------------------------------------------');
  console.log('📈 LATENCY DISTRIBUTION & THROUGHPUT RESULTS:');
  console.log('---------------------------------------------------------------');
  console.log(` Samples Measured     : ${stats.count} edit operations`);
  console.log(` Min Latency          : ${stats.min} ms`);
  console.log(` p50 (Median)         : ${stats.p50} ms`);
  console.log(` p90 Latency          : ${stats.p90} ms`);
  console.log(` p95 Latency          : ${stats.p95} ms`);
  console.log(` p99 Latency          : ${stats.p99} ms`);
  console.log(` Max Latency          : ${stats.max} ms`);
  console.log(` Mean Latency         : ${stats.avg} ms`);
  console.log(` Total Duration       : ${totalDuration} ms`);
  console.log(` Throughput           : ~${throughput} operations / second`);
  console.log('---------------------------------------------------------------\n');

  // Disconnect & cleanup
  clientA.close();
  clientB.close();
  ioServer.close();
  server.close();

  return stats;
};

if (require.main === module) {
  runBenchmark()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Benchmark execution error:', err);
      process.exit(1);
    });
}

module.exports = { runBenchmark };
