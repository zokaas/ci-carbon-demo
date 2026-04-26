import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './app.e2e-setup';

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let userId: number;
  let productId: number;
  let orderId: number;

  beforeAll(async () => {
    app = await createTestApp();

    const userRes = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Bob', email: 'bob@example.com' });
    userId = userRes.body.id;

    const productRes = await request(app.getHttpServer())
      .post('/products')
      .send({ name: 'Phone', price: 599, stock: 20 });
    productId = productRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /orders – create', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({ userId, productId, quantity: 1 })
      .expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('pending');
    orderId = res.body.id;
  });

  it('GET /orders – list all', async () => {
    const res = await request(app.getHttpServer()).get('/orders').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /orders/:id – find one', async () => {
    const res = await request(app.getHttpServer()).get(`/orders/${orderId}`).expect(200);
    expect(res.body.id).toBe(orderId);
  });

  it('PATCH /orders/:id – update status', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/orders/${orderId}`)
      .send({ status: 'confirmed' })
      .expect(200);
    expect(res.body.status).toBe('confirmed');
  });

  it('GET /orders/:id – 404 if not found', async () => {
    await request(app.getHttpServer()).get('/orders/999999').expect(404);
  });

  it('DELETE /orders/:id – remove', async () => {
    await request(app.getHttpServer()).delete(`/orders/${orderId}`).expect(200);
  });

  it('GET /orders/:id – 404 after delete', async () => {
    await request(app.getHttpServer()).get(`/orders/${orderId}`).expect(404);
  });
});
