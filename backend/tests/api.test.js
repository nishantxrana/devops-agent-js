import request from 'supertest';
import { app, startServer } from '../main.js';

let server;

beforeAll(async () => {
  server = await startServer();
});

afterAll((done) => {
  server.close(done);
});

describe('API Endpoints', () => {
  it('should return health status on GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
  });
});
