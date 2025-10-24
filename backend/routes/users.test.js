// users.test.js

const request = require('supertest');
const app = require('../server');

jest.mock('../db', () => ({
  query: jest.fn(),
}));

const pool = require('../db');

describe('Users API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/users: creates user on first login', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .post('/api/users')
      .send({
        id: 'auth0|123',
        email: 'test@example.com',
      });

    expect(res.statusCode).toBe(204);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT'),
      ['auth0|123', 'test@example.com']
    );
  });

  test('POST /api/users: handles duplicate user gracefully (ON CONFLICT)', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .post('/api/users')
      .send({
        id: 'auth0|123',
        email: 'test@example.com',
      });

    expect(res.statusCode).toBe(204); // Still succeeds
  });

  test('POST /api/users: handles database errors', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB Error'));

    const res = await request(app)
      .post('/api/users')
      .send({
        id: 'auth0|123',
        email: 'test@example.com',
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});