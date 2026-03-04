import { Router } from 'express';
import { param, query } from '../../lib/params.js';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { env } from '../../config/env.js';

const router = Router();

// Initiate payment (Flouci)
router.post('/initiate', requireAuth, async (req, res) => {
  try {
    const { type, referenceId, amount } = req.body;
    if (!type || !referenceId || !amount) {
      res.status(400).json({ error: 'type, referenceId, and amount are required' });
      return;
    }

    const payment = await prisma.payment.create({
      data: {
        userId: req.userId,
        type,
        referenceId,
        amount,
        provider: 'FLOUCI',
        status: 'PENDING',
      },
    });

    // Call Flouci API to create payment session
    const flouciResponse = await fetch('https://developers.flouci.com/api/generate_payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_token: env.flouci.appToken,
        app_secret: env.flouci.appSecret,
        amount: Math.round(Number(amount) * 1000), // Flouci expects millimes
        accept_card: 'true',
        session_timeout_secs: 1200,
        success_link: `${env.clientUrl}/payment/success?paymentId=${payment.id}`,
        fail_link: `${env.clientUrl}/payment/fail?paymentId=${payment.id}`,
        developer_tracking_id: payment.id,
      }),
    });

    const flouciData = await flouciResponse.json();

    if (flouciData.result?.success) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { providerTxId: flouciData.result.payment_id },
      });
      res.json({ paymentUrl: flouciData.result.link, paymentId: payment.id });
    } else {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      res.status(400).json({ error: 'Failed to initiate payment' });
    }
  } catch (err) {
    console.error('Payment initiation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify payment (called after redirect back)
router.post('/verify/:paymentId', requireAuth, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: param(req, 'paymentId') } });
    if (!payment || payment.userId !== req.userId) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    if (payment.status === 'COMPLETED') {
      res.json({ status: 'COMPLETED', payment });
      return;
    }

    // Verify with Flouci
    const verifyResponse = await fetch(
      `https://developers.flouci.com/api/verify_payment/${payment.providerTxId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          apppublic: env.flouci.appToken,
          appsecret: env.flouci.appSecret,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (verifyData.result?.status === 'SUCCESS') {
      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' },
      });
      res.json({ status: 'COMPLETED', payment: updated });
    } else {
      res.json({ status: payment.status, payment });
    }
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my payments
router.get('/my', requireAuth, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ payments });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Creator earnings dashboard
router.get('/earnings/:communityId', requireAuth, async (req, res) => {
  try {
    const community = await prisma.community.findUnique({ where: { id: param(req, 'communityId') } });
    if (!community || community.creatorId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    // Get course payments for this community
    const courses = await prisma.course.findMany({
      where: { communityId: param(req, 'communityId') },
      select: { id: true, title: true },
    });
    const courseIds = courses.map((c) => c.id);

    const payments = await prisma.payment.findMany({
      where: {
        referenceId: { in: [...courseIds, param(req, 'communityId')] },
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalEarnings = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const platformFee = totalEarnings * 0.1; // 10% commission

    res.json({
      totalEarnings,
      platformFee,
      netEarnings: totalEarnings - platformFee,
      payments,
      courses,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
