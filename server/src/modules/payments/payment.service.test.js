import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    payment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    community: {
      findUnique: vi.fn(),
    },
    course: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('./flouci.client.js', () => ({
  createSession: vi.fn(),
  verifySession: vi.fn(),
}));

import { prisma } from '../../lib/prisma.js';
import * as flouciClient from './flouci.client.js';
import {
  initiatePayment,
  verifyPayment,
  getUserPayments,
  getCommunityEarnings,
} from './payment.service.js';

beforeEach(() => vi.clearAllMocks());

const PAYMENT = {
  id: 'pay-1',
  userId: 'user-1',
  type: 'COURSE',
  referenceId: 'course-1',
  amount: 50,
  provider: 'FLOUCI',
  status: 'PENDING',
  providerTxId: null,
  createdAt: new Date(),
};

// ── initiatePayment ─────────────────────────────────────────
describe('initiatePayment()', () => {
  it('creates payment and returns Flouci URL', async () => {
    prisma.payment.create.mockResolvedValue(PAYMENT);
    flouciClient.createSession.mockResolvedValue({
      paymentId: 'flouci-tx-123',
      link: 'https://app.flouci.com/pay/abc',
    });
    prisma.payment.update.mockResolvedValue({ ...PAYMENT, providerTxId: 'flouci-tx-123' });

    const result = await initiatePayment('user-1', { type: 'COURSE', referenceId: 'course-1', amount: 50 });

    expect(result.paymentUrl).toBe('https://app.flouci.com/pay/abc');
    expect(result.paymentId).toBe('pay-1');
    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', type: 'COURSE', referenceId: 'course-1', amount: 50, provider: 'FLOUCI', status: 'PENDING' },
    });
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay-1' },
      data: { providerTxId: 'flouci-tx-123' },
    });
  });

  it('marks payment as FAILED when Flouci throws', async () => {
    prisma.payment.create.mockResolvedValue(PAYMENT);
    flouciClient.createSession.mockRejectedValue(new Error('Flouci error'));
    prisma.payment.update.mockResolvedValue({});

    await expect(initiatePayment('user-1', { type: 'COURSE', referenceId: 'c1', amount: 50 }))
      .rejects.toThrow('Flouci error');

    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay-1' },
      data: { status: 'FAILED' },
    });
  });
});

// ── verifyPayment ───────────────────────────────────────────
describe('verifyPayment()', () => {
  it('returns COMPLETED when already completed', async () => {
    const completedPayment = { ...PAYMENT, status: 'COMPLETED' };
    prisma.payment.findUnique.mockResolvedValue(completedPayment);

    const result = await verifyPayment('user-1', 'pay-1');

    expect(result.status).toBe('COMPLETED');
    expect(flouciClient.verifySession).not.toHaveBeenCalled();
  });

  it('verifies with Flouci and updates to COMPLETED on success', async () => {
    prisma.payment.findUnique.mockResolvedValue({ ...PAYMENT, providerTxId: 'flouci-tx-123' });
    flouciClient.verifySession.mockResolvedValue({ success: true });
    prisma.payment.update.mockResolvedValue({ ...PAYMENT, status: 'COMPLETED' });

    const result = await verifyPayment('user-1', 'pay-1');

    expect(result.status).toBe('COMPLETED');
    expect(flouciClient.verifySession).toHaveBeenCalledWith('flouci-tx-123');
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay-1' },
      data: { status: 'COMPLETED' },
    });
  });

  it('returns current status when Flouci verification fails', async () => {
    prisma.payment.findUnique.mockResolvedValue({ ...PAYMENT, providerTxId: 'flouci-tx-123' });
    flouciClient.verifySession.mockResolvedValue({ success: false });

    const result = await verifyPayment('user-1', 'pay-1');

    expect(result.status).toBe('PENDING');
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  it('throws 404 when payment not found', async () => {
    prisma.payment.findUnique.mockResolvedValue(null);

    await expect(verifyPayment('user-1', 'unknown')).rejects.toThrow('Payment not found');
  });

  it('throws 404 when payment belongs to another user', async () => {
    prisma.payment.findUnique.mockResolvedValue({ ...PAYMENT, userId: 'other-user' });

    await expect(verifyPayment('user-1', 'pay-1')).rejects.toThrow('Payment not found');
  });
});

// ── getUserPayments ─────────────────────────────────────────
describe('getUserPayments()', () => {
  it('returns user payments ordered by createdAt desc', async () => {
    prisma.payment.findMany.mockResolvedValue([PAYMENT]);

    const result = await getUserPayments('user-1');

    expect(result).toHaveLength(1);
    expect(prisma.payment.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('returns empty array when no payments', async () => {
    prisma.payment.findMany.mockResolvedValue([]);

    const result = await getUserPayments('user-1');

    expect(result).toEqual([]);
  });
});

// ── getCommunityEarnings ────────────────────────────────────
describe('getCommunityEarnings()', () => {
  it('returns earnings with 10% platform fee', async () => {
    prisma.community.findUnique.mockResolvedValue({ id: 'com-1', creatorId: 'creator-1' });
    prisma.course.findMany.mockResolvedValue([{ id: 'course-1', title: 'JS' }]);
    prisma.payment.findMany.mockResolvedValue([
      { id: 'p1', amount: 100, status: 'COMPLETED' },
      { id: 'p2', amount: 50, status: 'COMPLETED' },
    ]);

    const result = await getCommunityEarnings('creator-1', 'com-1');

    expect(result.totalEarnings).toBe(150);
    expect(result.platformFee).toBe(15); // 10%
    expect(result.netEarnings).toBe(135);
    expect(result.payments).toHaveLength(2);
    expect(result.courses).toHaveLength(1);
  });

  it('throws 403 when user is not the community creator', async () => {
    prisma.community.findUnique.mockResolvedValue({ id: 'com-1', creatorId: 'other-user' });

    await expect(getCommunityEarnings('user-1', 'com-1')).rejects.toThrow('Not authorized');
  });

  it('throws 403 when community not found', async () => {
    prisma.community.findUnique.mockResolvedValue(null);

    await expect(getCommunityEarnings('user-1', 'unknown')).rejects.toThrow('Not authorized');
  });

  it('returns 0 earnings when no payments', async () => {
    prisma.community.findUnique.mockResolvedValue({ id: 'com-1', creatorId: 'creator-1' });
    prisma.course.findMany.mockResolvedValue([]);
    prisma.payment.findMany.mockResolvedValue([]);

    const result = await getCommunityEarnings('creator-1', 'com-1');

    expect(result.totalEarnings).toBe(0);
    expect(result.platformFee).toBe(0);
    expect(result.netEarnings).toBe(0);
  });
});
