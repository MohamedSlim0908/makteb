import { Router } from 'express';
import { z } from 'zod';
import { param } from '../../lib/params.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as paymentService from './payment.service.js';

const router = Router();

const initiatePaymentSchema = z.object({
  type: z.enum(['COMMUNITY', 'COURSE']),
  referenceId: z.string().min(1),
  amount: z.number().positive(),
});

router.post('/initiate', requireAuth, validate(initiatePaymentSchema), async (req, res) => {
  const result = await paymentService.initiatePayment(req.userId, req.body);
  res.json(result);
});

router.post('/verify/:paymentId', requireAuth, async (req, res) => {
  const result = await paymentService.verifyPayment(req.userId, param(req, 'paymentId'));
  res.json(result);
});

router.get('/my', requireAuth, async (req, res) => {
  const payments = await paymentService.getUserPayments(req.userId);
  res.json({ payments });
});

router.get('/earnings/:communityId', requireAuth, async (req, res) => {
  const result = await paymentService.getCommunityEarnings(req.userId, param(req, 'communityId'));
  res.json(result);
});

export default router;
