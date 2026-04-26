import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './app.e2e-setup';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let createdId: number;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /products – create', async () => {
    const res = await request(app.getHttpServer())
      .post('/products')
      .send({ name: 'Laptop', price: 999.99, stock: 10 })
      .expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Laptop');
    createdId = res.body.id;
  });

  it('GET /products – list all', async () => {
    const res = await request(app.getHttpServer()).get('/products').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /products/:id – find one', async () => {
    const res = await request(app.getHttpServer()).get(`/products/${createdId}`).expect(200);
    expect(res.body.id).toBe(createdId);
  });

  it('PATCH /products/:id – update', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/products/${createdId}`)
      .send({ price: 899.99 })
      .expect(200);
    expect(Number(res.body.price)).toBe(899.99);
  });

  it('GET /products/:id – 404 if not found', async () => {
    await request(app.getHttpServer()).get('/products/999999').expect(404);
  });

  it('DELETE /products/:id – remove', async () => {
    await request(app.getHttpServer()).delete(`/products/${createdId}`).expect(200);
  });

  it('GET /products/:id – 404 after delete', async () => {
    await request(app.getHttpServer()).get(`/products/${createdId}`).expect(404);
  });
});
