import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error-handler.js';
import * as flouciClient from './flouci.client.js';

const PLATFORM_FEE_RATE = 0.1;

export async function initiatePayment(userId, { type, referenceId, amount }) {
  const payment = await prisma.payment.create({
    data: { userId, type, referenceId, amount, provider: 'FLOUCI', status: 'PENDING' },
  });

  try {
    const session = await flouciClient.createSession(payment);
    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerTxId: session.paymentId },
    });
    return { paymentUrl: session.link, paymentId: payment.id };
  } catch (err) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
    throw err;
  }
}

export async function verifyPayment(userId, paymentId) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.userId !== userId) throw new AppError('Payment not found', 404);

  if (payment.status === 'COMPLETED') return { status: 'COMPLETED', payment };

  const { success } = await flouciClient.verifySession(payment.providerTxId);
  if (success) {
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' },
    });
    return { status: 'COMPLETED', payment: updated };
  }

  return { status: payment.status, payment };
}

export async function getUserPayments(userId) {
  return prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCommunityEarnings(userId, communityId) {
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community || community.creatorId !== userId) throw new AppError('Not authorized', 403);

  const courses = await prisma.course.findMany({
    where: { communityId },
    select: { id: true, title: true },
  });
  const courseIds = courses.map((c) => c.id);

  const payments = await prisma.payment.findMany({
    where: {
      referenceId: { in: [...courseIds, communityId] },
      status: 'COMPLETED',
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalEarnings = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const platformFee = totalEarnings * PLATFORM_FEE_RATE;

  return {
    totalEarnings,
    platformFee,
    netEarnings: totalEarnings - platformFee,
    payments,
    courses,
  };
}
