import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => { req.userId = 'user-1'; next(); },
  requireRole: () => (_req, _res, next) => next(),
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    payment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    course: {
      findMany: vi.fn(),
    },
    community: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { prisma } from '../../lib/prisma.js';
import express from 'express';
import request from 'supertest';
import router from './payment.routes.js';

function buildApp(userId = 'user-1') {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.userId = userId; next(); });
  app.use('/', router);
  return app;
}

beforeEach(() => vi.clearAllMocks());

const PENDING_PAYMENT = {
  id: 'pay-1',
  userId: 'user-1',
  type: 'COURSE',
  referenceId: 'course-1',
  amount: 50,
  currency: 'TND',
  provider: 'FLOUCI',
  status: 'PENDING',
  providerTxId: 'flouci-tx-123',
  createdAt: new Date(),
};

// ── POST /initiate ────────────────────────────────────────
describe('POST /initiate', () => {
  it('returns payment URL when Flouci responds successfully', async () => {
    prisma.payment.create.mockResolvedValue(PENDING_PAYMENT);
    prisma.payment.update.mockResolvedValue({ ...PENDING_PAYMENT, providerTxId: 'flouci-tx-abc' });

    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        result: { success: true, payment_id: 'flouci-tx-abc', link: 'https://app.flouci.com/pay/abc' },
      }),
    });

    const res = await request(buildApp())
      .post('/initiate')
      .send({ type: 'COURSE', referenceId: 'course-1', amount: 50 });

    expect(res.status).toBe(200);
    expect(res.body.paymentUrl).toBe('https://app.flouci.com/pay/abc');
    expect(res.body.paymentId).toBe('pay-1');
  });

  it('returns 400 when Flouci payment creation fails', async () => {
    prisma.payment.create.mockResolvedValue(PENDING_PAYMENT);
    prisma.payment.update.mockResolvedValue({});

    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ result: { success: false } }),
    });

    const res = await request(buildApp())
      .post('/initiate')
      .send({ type: 'COURSE', referenceId: 'course-1', amount: 50 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(buildApp())
      .post('/initiate')
      .send({ type: 'COURSE' }); // missing referenceId and amount

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('sends amount in millimes to Flouci (×1000)', async () => {
    prisma.payment.create.mockResolvedValue(PENDING_PAYMENT);
    prisma.payment.update.mockResolvedValue({});
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ result: { success: true, payment_id: 'x', link: 'url' } }),
    });

    await request(buildApp())
      .post('/initiate')
      .send({ type: 'COURSE', referenceId: 'c1', amount: 25 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.amount).toBe(25000); // 25 TND × 1000 = 25000 millimes
  });
});

// ── POST /verify/:paymentId ───────────────────────────────
describe('POST /verify/:paymentId', () => {
  it('returns COMPLETED immediately if payment is already completed', async () => {
    prisma.payment.findUnique.mockResolvedValue({ ...PENDING_PAYMENT, status: 'COMPLETED' });

    const res = await request(buildApp()).post('/verify/pay-1');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('COMPLETED');
    expect(mockFetch).not.toHaveBeenCalled(); // no Flouci call needed
  });

  it('verifies with Flouci and updates status to COMPLETED', async () => {
    prisma.payment.findUnique.mockResolvedValue(PENDING_PAYMENT);
    prisma.payment.update.mockResolvedValue({ ...PENDING_PAYMENT, status: 'COMPLETED' });

    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ result: { status: 'SUCCESS' } }),
    });

    const res = await request(buildApp()).post('/verify/pay-1');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('COMPLETED');
  });

  it('returns 404 when payment does not belong to user', async () => {
    prisma.payment.findUnique.mockResolvedValue({ ...PENDING_PAYMENT, userId: 'other-user' });

    const res = await request(buildApp('user-1')).post('/verify/pay-1');

    expect(res.status).toBe(404);
  });

  it('returns 404 when payment not found', async () => {
    prisma.payment.findUnique.mockResolvedValue(null);

    const res = await request(buildApp()).post('/verify/unknown');

    expect(res.status).toBe(404);
  });
});

// ── GET /my ───────────────────────────────────────────────
describe('GET /my', () => {
  it('returns list of user payments', async () => {
    prisma.payment.findMany.mockResolvedValue([PENDING_PAYMENT]);

    const res = await request(buildApp()).get('/my');

    expect(res.status).toBe(200);
    expect(res.body.payments).toHaveLength(1);
    expect(res.body.payments[0].id).toBe('pay-1');
  });

  it('returns empty array when user has no payments', async () => {
    prisma.payment.findMany.mockResolvedValue([]);

    const res = await request(buildApp()).get('/my');

    expect(res.status).toBe(200);
    expect(res.body.payments).toEqual([]);
  });
});

// ── GET /earnings/:communityId ────────────────────────────
describe('GET /earnings/:communityId', () => {
  it('returns earnings summary for a community creator', async () => {
    prisma.community.findUnique.mockResolvedValue({
      id: 'com-1',
      creatorId: 'user-1',
    });
    prisma.course.findMany.mockResolvedValue([{ id: 'course-1', title: 'JS Fundamentals' }]);
    prisma.payment.findMany.mockResolvedValue([
      { ...PENDING_PAYMENT, status: 'COMPLETED', amount: 100 },
      { ...PENDING_PAYMENT, id: 'pay-2', status: 'COMPLETED', amount: 50 },
    ]);

    const res = await request(buildApp('user-1')).get('/earnings/com-1');

    expect(res.status).toBe(200);
    expect(res.body.totalEarnings).toBe(150);
    expect(res.body.platformFee).toBe(15); // 10%
    expect(res.body.netEarnings).toBe(135);
  });

  it('returns 403 when user is not the community creator', async () => {
    prisma.community.findUnique.mockResolvedValue({
      id: 'com-1',
      creatorId: 'another-user',
    });

    const res = await request(buildApp('user-1')).get('/earnings/com-1');

    expect(res.status).toBe(403);
  });
});
