import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './app.e2e-setup';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let createdId: number;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /users – create', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Alice', email: 'alice@example.com' })
      .expect(201);
    expect(res.body.id).toBeDefined();
    createdId = res.body.id;
  });

  it('GET /users – list all', async () => {
    const res = await request(app.getHttpServer()).get('/users').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /users/:id – find one', async () => {
    const res = await request(app.getHttpServer()).get(`/users/${createdId}`).expect(200);
    expect(res.body.id).toBe(createdId);
  });

  it('PATCH /users/:id – update', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${createdId}`)
      .send({ name: 'Alice Updated' })
      .expect(200);
    expect(res.body.name).toBe('Alice Updated');
  });

  it('GET /users/:id – 404 if not found', async () => {
    await request(app.getHttpServer()).get('/users/999999').expect(404);
  });

  it('DELETE /users/:id – remove', async () => {
    await request(app.getHttpServer()).delete(`/users/${createdId}`).expect(200);
  });

  it('GET /users/:id – 404 after delete', async () => {
    await request(app.getHttpServer()).get(`/users/${createdId}`).expect(404);
  });
});
