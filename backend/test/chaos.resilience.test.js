const request = require('supertest');
const app = require('../src/app');
const crdt = require('../src/sync/crdt');
const authService = require('../src/auth/auth.service');
const { CircuitBreaker } = require('../src/utils/circuitBreaker');
const { checkPreconditions, generateETag } = require('../src/utils/concurrency');
const jwt = require('../src/utils/jwt');

describe('Distributed Systems & API Resilience Test Suite', () => {
  let userToken;
  const mockUser = {
    id: '507f1f77bcf86cd799439099',
    email: 'resilience@codesync.dev',
    name: 'Resilience Tester'
  };

  beforeAll(() => {
    userToken = jwt.generateToken(mockUser);
  });

  describe('1. Delivery Semantics & CRDT Idempotency', () => {
    it('applying duplicate Yjs binary updates should be 100% idempotent and converge identically', () => {
      const docA = crdt.createDoc('Initial text: ');
      const snapshot = crdt.encodeState(docA);
      const docB = crdt.initDocFromState(snapshot);

      // Generate edit on docA
      const yTextA = docA.getText('content');
      let updateBinary = null;
      docA.on('update', (u) => {
        updateBinary = u;
      });

      yTextA.insert(14, 'Distributed CRDT Convergence!');
      expect(updateBinary).not.toBeNull();

      // Apply update to docB once
      crdt.applyUpdate(docB, updateBinary);
      const textAfterFirstApply = crdt.getText(docB);
      expect(textAfterFirstApply).toBe('Initial text: Distributed CRDT Convergence!');

      // Re-apply the EXACT same update 5 times (simulating at-least-once network delivery duplicates)
      for (let i = 0; i < 5; i++) {
        crdt.applyUpdate(docB, updateBinary);
      }

      // Assert zero corruption, zero duplicated characters
      expect(crdt.getText(docB)).toBe('Initial text: Distributed CRDT Convergence!');
      expect(crdt.getText(docB)).toBe(crdt.getText(docA));
    });
  });

  describe('2. Single-Use WebSocket Connection Tickets (Replay Attack Prevention)', () => {
    it('should generate a 30-second ticket and allow exactly one consumption', async () => {
      const ticketInfo = await authService.createWsTicket(mockUser);
      expect(ticketInfo.ticket).toBeDefined();
      expect(ticketInfo.expiresIn).toBe(30);

      // 1st consumption: Valid
      const consumed = await authService.consumeWsTicket(ticketInfo.ticket);
      expect(consumed).not.toBeNull();
      expect(consumed.email).toBe(mockUser.email);

      // 2nd consumption: MUST FAIL (replay protection)
      const replayed = await authService.consumeWsTicket(ticketInfo.ticket);
      expect(replayed).toBeNull();
    });

    it('POST /api/v1/auth/ws-ticket should return a ticket for authenticated users', async () => {
      const res = await request(app)
        .post('/api/v1/auth/ws-ticket')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ticket).toBeDefined();
      expect(res.body.data.expiresIn).toBe(30);
    });
  });

  describe('3. Optimistic Concurrency Control (ETag & If-Match)', () => {
    it('should allow updates when If-Match matches the current ETag', () => {
      const mockDoc = { _id: 'file_123', version: 3, updatedAt: new Date('2026-01-01T00:00:00Z') };
      const currentETag = generateETag(mockDoc);

      const req = {
        headers: { 'if-match': currentETag }
      };

      expect(() => checkPreconditions(req, currentETag)).not.toThrow();
    });

    it('should throw 412 Precondition Failed when If-Match is stale or mismatched', () => {
      const mockDoc = { _id: 'file_123', version: 4, updatedAt: new Date('2026-01-02T00:00:00Z') };
      const currentETag = generateETag(mockDoc);
      const staleETag = 'W/"stale_etag_value_123"';

      const req = {
        headers: { 'if-match': staleETag }
      };

      expect(() => checkPreconditions(req, currentETag)).toThrow();
      try {
        checkPreconditions(req, currentETag);
      } catch (err) {
        expect(err.statusCode).toBe(412);
        expect(err.code).toBe('PRECONDITION_FAILED');
      }
    });
  });

  describe('4. Idempotency Key Deduplication', () => {
    it('should replay cached response on duplicate Idempotency-Key mutations', async () => {
      const idempotencyKey = `idem_test_${Date.now()}`;

      // First request (create project)
      const res1 = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({ name: 'Idempotent Cluster Workspace', description: 'Testing deduplication' });

      expect(res1.status).toBe(201);
      expect(res1.body.success).toBe(true);

      // Second request with IDENTICAL Idempotency-Key
      const res2 = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({ name: 'Different Name Attempt', description: 'Should be ignored' });

      // Should return identical 201 response and Idempotent-Replay header
      expect(res2.status).toBe(201);
      expect(res2.headers['idempotent-replay']).toBe('true');
      expect(res2.body.data.name).toBe('Idempotent Cluster Workspace');
    });
  });

  describe('5. Circuit Breaker Resilience', () => {
    it('should trip to OPEN state after consecutive failures and fail fast', async () => {
      const breaker = new CircuitBreaker({ name: 'ChaosTestService', failureThreshold: 3, resetTimeoutMs: 500 });
      const failingAction = async () => { throw new Error('Database cluster timeout'); };

      // Fail 1 & 2
      await expect(breaker.execute(failingAction)).rejects.toThrow('Database cluster timeout');
      expect(breaker.state).toBe('CLOSED');

      await expect(breaker.execute(failingAction)).rejects.toThrow('Database cluster timeout');
      expect(breaker.state).toBe('CLOSED');

      // Fail 3 -> trips to OPEN
      await expect(breaker.execute(failingAction)).rejects.toThrow('Database cluster timeout');
      expect(breaker.state).toBe('OPEN');

      // Subsequent call should fail fast with 503 CIRCUIT_OPEN without calling failingAction
      let called = false;
      await expect(breaker.execute(async () => { called = true; })).rejects.toThrow(/is OPEN/);
      expect(called).toBe(false);

      // Wait for reset timeout -> transitions to HALF_OPEN
      await new Promise(r => setTimeout(r, 600));
      const recoveredResult = await breaker.execute(async () => 'recovered');
      expect(recoveredResult).toBe('recovered');
      expect(breaker.state).toBe('CLOSED');
    });
  });

  describe('6. Async Long-Running Code Execution (202 Accepted)', () => {
    it('POST /api/v1/executions should return 202 Accepted with pollUrl', async () => {
      const res = await request(app)
        .post('/api/v1/executions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          language: 'javascript',
          code: 'console.log("Async Execution Accepted!");'
        });

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('queued');
      expect(res.body.executionId).toBeDefined();
      expect(res.body.pollUrl).toBeDefined();

      // Poll the job status
      const executionId = res.body.executionId;
      // Wait briefly for background execution
      await new Promise(r => setTimeout(r, 200));

      const pollRes = await request(app)
        .get(`/api/v1/executions/${executionId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(pollRes.status).toBe(200);
      expect(pollRes.body.success).toBe(true);
      expect(['queued', 'running', 'completed']).toContain(pollRes.body.data.status);
    });
  });

  describe('7. OpenAPI Specification Endpoint', () => {
    it('GET /api-docs/openapi.json should serve valid OpenAPI 3.0.3 specification', async () => {
      const res = await request(app).get('/api-docs/openapi.json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.3');
      expect(res.body.paths['/api/v1/auth/ws-ticket']).toBeDefined();
      expect(res.body.paths['/api/v1/executions']).toBeDefined();
    });
  });
});
