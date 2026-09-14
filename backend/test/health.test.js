const { request, app } = require('./setup');

describe('Health Endpoints', () => {
  it('GET /health should return 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /health/ready should return readiness payload with service status', async () => {
    const res = await request(app).get('/health/ready');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('services');
    expect(res.body.services).toHaveProperty('mongodb');
    expect(res.body.services).toHaveProperty('redisPub');
    expect(res.body.services).toHaveProperty('redisCache');
  });
});
