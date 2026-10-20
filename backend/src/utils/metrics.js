const client = require('prom-client');

// Initialize Prometheus registry
const register = new client.Registry();

// Add default OS and Node.js process metrics (CPU, Memory, Event Loop Lag)
client.collectDefaultMetrics({
  register,
  prefix: 'collab_node_'
});

// Real-Time Collaborative Metrics
const activeConnections = new client.Gauge({
  name: 'collab_active_connections',
  help: 'Total number of active WebSocket connections across this Node instance',
  registers: [register]
});

const activeRooms = new client.Gauge({
  name: 'collab_active_rooms',
  help: 'Total number of active document collaboration rooms',
  registers: [register]
});

const updatesTotal = new client.Counter({
  name: 'collab_updates_total',
  help: 'Total number of CRDT binary updates processed by the sync engine',
  labelNames: ['status'],
  registers: [register]
});

const walWritesTotal = new client.Counter({
  name: 'collab_wal_writes_total',
  help: 'Total number of updates appended to the Write-Ahead Log (WAL)',
  registers: [register]
});

const snapshotsTotal = new client.Counter({
  name: 'collab_snapshots_total',
  help: 'Total number of document snapshot compactions flushed to persistent storage',
  registers: [register]
});

const propagationLatency = new client.Histogram({
  name: 'collab_propagation_latency_ms',
  help: 'End-to-end edit propagation latency in milliseconds',
  buckets: [2, 5, 10, 20, 50, 80, 100, 200, 500, 1000],
  registers: [register]
});

const rateLimitHits = new client.Counter({
  name: 'collab_rate_limit_hits_total',
  help: 'Total number of rate limit rejections on sockets or HTTP routes',
  registers: [register]
});

module.exports = {
  register,
  activeConnections,
  activeRooms,
  updatesTotal,
  walWritesTotal,
  snapshotsTotal,
  propagationLatency,
  rateLimitHits
};
