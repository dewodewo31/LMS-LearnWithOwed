const { request, app, createUser, loginAs } = require('./helpers');

describe('Authentication', () => {
  test('register student → 201, user returned, no password leak', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ name: 'New Student', email: 'new@test.dev', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('new@test.dev');
    expect(res.body.data.user.role).toBe('student');
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('register duplicate email → 409', async () => {
    await createUser({ email: 'dup@test.dev' });
    const res = await request(app).post('/api/v1/auth/register').send({ name: 'Dup', email: 'dup@test.dev', password: 'password123' });
    expect(res.status).toBe(409);
  });

  test('register with short password → 422 field error', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ name: 'Shorty', email: 'short@test.dev', password: 'short' });
    expect(res.status).toBe(422);
    expect(res.body.errors.password).toMatch(/8 characters/);
  });

  test('login valid → 200 + cookies set + lastLoginAt recorded', async () => {
    const { agent, user } = await loginAs({ email: 'loginer@test.dev' });
    const User = require('../src/models/User');
    const fresh = await User.findById(user._id);
    expect(fresh.lastLoginAt).toBeTruthy();
    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(user.email);
  });

  test('login invalid password → 401 (docs TESTING.md)', async () => {
    const user = await createUser({ email: 'badpass@test.dev' });
    const res = await request(app).post('/api/v1/auth/login').send({ email: user.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  test('expired/invalid token → protected endpoint rejects with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  test('no auth → protected endpoint rejects (PRD §80)', async () => {
    const res = await request(app).get('/api/v1/courses');
    expect(res.status).toBe(401);
  });

  test('refresh rotates access token', async () => {
    const { agent } = await loginAs({ email: 'refresh@test.dev' });
    const res = await agent.post('/api/v1/auth/refresh');
    expect(res.status).toBe(200);
    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(200);
  });

  test('logout clears session', async () => {
    const { agent } = await loginAs({ email: 'logout@test.dev' });
    await agent.post('/api/v1/auth/logout');
    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(401);
  });

  test('unauthorized role → 403 (PRD §80)', async () => {
    const { agent } = await loginAs({ role: 'student', email: 'roleless@test.dev' });
    const res = await agent.post('/api/v1/courses').send({ title: 'X Course', level: 'beginner' });
    expect(res.status).toBe(403);
  });
});
