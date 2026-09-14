const { request, app } = require('./setup');
const User = require('../src/user/user.model');
const Project = require('../src/projects/project.model');
const File = require('../src/files/file.model');
const authService = require('../src/auth/auth.service');

describe('Project & File Authorization Tests', () => {
  let userA, userB, tokenA, tokenB, projectA, fileA;

  beforeEach(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
    await File.deleteMany({});

    // Register User A
    const resA = await authService.register('Alice', 'alice@test.com', 'SecurePass123!');
    userA = resA.user;
    tokenA = resA.token;

    // Register User B
    const resB = await authService.register('Bob', 'bob@test.com', 'SecurePass123!');
    userB = resB.user;
    tokenB = resB.token;

    // User A creates Project A
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Alice Project', description: 'Private Workspace' });
    projectA = projRes.body.data;

    // User A creates File A in Project A
    const fileRes = await request(app)
      .post('/api/files')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        project: projectA._id,
        name: 'index.js',
        path: 'src/index.js',
        type: 'file',
        content: 'console.log("hello alice");'
      });
    fileA = fileRes.body.data;
  });

  it('should prevent User B from viewing Project A files without permission (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/files?projectId=${projectA._id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should prevent User B from reading File A content directly (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/files/${fileA._id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should prevent User B from creating files in Project A (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/files')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        project: projectA._id,
        name: 'hacked.js',
        path: 'src/hacked.js',
        type: 'file',
        content: 'malicious code'
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow User B to access files once added as a collaborator', async () => {
    // User A invites User B to Project A
    const inviteRes = await request(app)
      .post(`/api/projects/${projectA._id}/members`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ email: 'bob@test.com', role: 'editor' });

    expect(inviteRes.statusCode).toBe(200);

    // User B fetches files now
    const filesRes = await request(app)
      .get(`/api/files?projectId=${projectA._id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(filesRes.statusCode).toBe(200);
    expect(filesRes.body.success).toBe(true);
    expect(filesRes.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
