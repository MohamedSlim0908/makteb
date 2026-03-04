import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./payment.service.js', () => ({
  initiatePayment: vi.fn(),
  verifyPayment: vi.fn(),
  getUserPayments: vi.fn(),
  getCommunityEarnings: vi.fn(),
}));

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => { req.userId = 'user-1'; next(); },
  requireRole: () => (_req, _res, next) => next(),
}));

import * as paymentService from './payment.service.js';
import express from 'express';
import request from 'supertest';
import router from './payment.routes.js';
import { errorHandler } from '../../middleware/error-handler.js';

function buildApp(userId = 'user-1') {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.userId = userId; next(); });
  app.use('/', router);
  app.use(errorHandler);
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

describe('POST /initiate', () => {
  it('returns payment URL when Flouci responds successfully', async () => {
    paymentService.initiatePayment.mockResolvedValue({
      paymentUrl: 'https://app.flouci.com/pay/abc',
      paymentId: 'pay-1',
    });

    const res = await request(buildApp())
      .post('/initiate')
      .send({ type: 'COURSE', referenceId: 'course-1', amount: 50 });

    expect(res.status).toBe(200);
    expect(res.body.paymentUrl).toBe('https://app.flouci.com/pay/abc');
    expect(res.body.paymentId).toBe('pay-1');
  });

  it('returns 400 when Flouci payment creation fails', async () => {
    const { AppError } = await import('../../middleware/error-handler.js');
    paymentService.initiatePayment.mockRejectedValue(
      new AppError('Failed to initiate payment', 400)
    );

    const res = await request(buildApp())
      .post('/initiate')
      .send({ type: 'COURSE', referenceId: 'course-1', amount: 50 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(buildApp())
      .post('/initiate')
      .send({ type: 'COURSE' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('passes correct payload to payment service', async () => {
    paymentService.initiatePayment.mockResolvedValue({ paymentUrl: 'url', paymentId: 'p1' });

    await request(buildApp())
      .post('/initiate')
      .send({ type: 'COURSE', referenceId: 'c1', amount: 25 });

    expect(paymentService.initiatePayment).toHaveBeenCalledWith(
      'user-1',
      { type: 'COURSE', referenceId: 'c1', amount: 25 }
    );
  });
});

describe('POST /verify/:paymentId', () => {
  it('returns COMPLETED immediately if payment is already completed', async () => {
    paymentService.verifyPayment.mockResolvedValue({
      status: 'COMPLETED',
      payment: { ...PENDING_PAYMENT, status: 'COMPLETED' },
    });

    const res = await request(buildApp()).post('/verify/pay-1');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('COMPLETED');
  });

  it('verifies with Flouci and updates status to COMPLETED', async () => {
    paymentService.verifyPayment.mockResolvedValue({
      status: 'COMPLETED',
      payment: { ...PENDING_PAYMENT, status: 'COMPLETED' },
    });

    const res = await request(buildApp()).post('/verify/pay-1');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('COMPLETED');
  });

  it('returns 404 when payment does not belong to user', async () => {
    const { AppError } = await import('../../middleware/error-handler.js');
    paymentService.verifyPayment.mockRejectedValue(new AppError('Payment not found', 404));

    const res = await request(buildApp('user-1')).post('/verify/pay-1');

    expect(res.status).toBe(404);
  });

  it('returns 404 when payment not found', async () => {
    const { AppError } = await import('../../middleware/error-handler.js');
    paymentService.verifyPayment.mockRejectedValue(new AppError('Payment not found', 404));

    const res = await request(buildApp()).post('/verify/unknown');

    expect(res.status).toBe(404);
  });
});

describe('GET /my', () => {
  it('returns list of user payments', async () => {
    paymentService.getUserPayments.mockResolvedValue([PENDING_PAYMENT]);

    const res = await request(buildApp()).get('/my');

    expect(res.status).toBe(200);
    expect(res.body.payments).toHaveLength(1);
    expect(res.body.payments[0].id).toBe('pay-1');
  });

  it('returns empty array when user has no payments', async () => {
    paymentService.getUserPayments.mockResolvedValue([]);

    const res = await request(buildApp()).get('/my');

    expect(res.status).toBe(200);
    expect(res.body.payments).toEqual([]);
  });
});

describe('GET /earnings/:communityId', () => {
  it('returns earnings summary for a community creator', async () => {
    paymentService.getCommunityEarnings.mockResolvedValue({
      totalEarnings: 150,
      platformFee: 15,
      netEarnings: 135,
      payments: [],
      courses: [],
    });

    const res = await request(buildApp('user-1')).get('/earnings/com-1');

    expect(res.status).toBe(200);
    expect(res.body.totalEarnings).toBe(150);
    expect(res.body.platformFee).toBe(15);
    expect(res.body.netEarnings).toBe(135);
  });

  it('returns 403 when user is not the community creator', async () => {
    const { AppError } = await import('../../middleware/error-handler.js');
    paymentService.getCommunityEarnings.mockRejectedValue(new AppError('Not authorized', 403));

    const res = await request(buildApp('user-1')).get('/earnings/com-1');

    expect(res.status).toBe(403);
  });
});
