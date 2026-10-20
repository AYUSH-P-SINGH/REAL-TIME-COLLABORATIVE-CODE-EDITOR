/**
 * k6 Distributed WebSocket Load Test for CodeSync CRDT Engine
 * 
 * Simulates:
 * - 1,000 concurrent Virtual Users (VUs)
 * - 20 active collaborative rooms (50 users per room)
 * - Binary Yjs edit streaming & presence updates
 * - Measures p50, p95, p99 edit round-trip latencies
 * 
 * Run with:
 *   k6 run load-tests/websocket-load-test.js
 */

import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// Custom Prometheus-compatible metrics
const editLatency = new Trend('crdt_edit_latency_ms');
const editsReceived = new Counter('crdt_edits_received_total');
const connectionErrors = new Counter('crdt_connection_errors');

export const options = {
  stages: [
    { duration: '30s', target: 200 },   // Warm-up to 200 users
    { duration: '1m', target: 500 },    // Ramp up to 500 users
    { duration: '2m', target: 1000 },   // Peak sustained 1,000 concurrent users
    { duration: '30s', target: 0 }      // Graceful cooldown
  ],
  thresholds: {
    crdt_edit_latency_ms: ['p(95)<80', 'p(99)<150'], // Target: p95 < 80ms, p99 < 150ms
    crdt_connection_errors: ['count<10']
  }
};

const BASE_URL = __ENV.TARGET_URL || 'ws://localhost:5000/socket.io/?EIO=4&transport=websocket';
const NUM_ROOMS = 20;

export default function () {
  const vuId = __VU;
  const roomIndex = (vuId % NUM_ROOMS) + 1;
  const fileId = `507f1f77bcf86cd7994390${String(roomIndex).padStart(2, '0')}`;

  const res = ws.connect(BASE_URL, {}, function (socket) {
    socket.on('open', () => {
      // 1. Socket.IO connection handshake
      socket.send('40'); // Socket.IO connect packet

      // 2. Join Document Room
      const joinPayload = `42["room:join",{"fileId":"${fileId}"}]`;
      socket.send(joinPayload);

      // 3. Periodic typing loop: emit edit every 1.5 seconds
      socket.setInterval(() => {
        const sendTime = Date.now();
        const updatePayload = `42["doc:update",{"fileId":"${fileId}","update":[1,2,3,4],"clientTimestamp":${sendTime}}]`;
        socket.send(updatePayload);
      }, 1500);

      // 4. Cursor awareness updates
      socket.setInterval(() => {
        const cursorPayload = `42["cursor:move",{"fileId":"${fileId}","cursor":{"line":1,"ch":${Math.floor(Math.random() * 80)}}}]`;
        socket.send(cursorPayload);
      }, 500);
    });

    socket.on('message', (data) => {
      if (typeof data === 'string' && data.startsWith('42["doc:update"')) {
        editsReceived.add(1);
        try {
          const jsonStr = data.substring(2);
          const parsed = JSON.parse(jsonStr);
          const payload = parsed[1];
          if (payload && payload.clientTimestamp) {
            const latency = Date.now() - payload.clientTimestamp;
            editLatency.add(latency);
          }
        } catch (e) {}
      }

      // Handle Socket.io ping/pong heartbeat
      if (data === '2') {
        socket.send('3'); // Pong
      }
    });

    socket.on('error', (e) => {
      connectionErrors.add(1);
    });

    // Run test iteration for 45 seconds per VU
    socket.setTimeout(() => {
      socket.close();
    }, 45000);
  });

  check(res, { 'WebSocket handshake successful': (r) => r && r.status === 101 });
  sleep(1);
}
