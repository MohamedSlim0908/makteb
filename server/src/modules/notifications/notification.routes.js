import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { parsePagination } from '../../lib/params.js';
import * as notificationService from './notification.service.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { page, take } = parsePagination(req, 20);
  const result = await notificationService.getUserNotifications(req.userId, { page, limit: take });
  res.json(result);
});

router.get('/unread-count', requireAuth, async (req, res) => {
  const count = await notificationService.getUnreadCount(req.userId);
  res.json({ count });
});

router.put('/read-all', requireAuth, async (req, res) => {
  await notificationService.markAllAsRead(req.userId);
  res.json({ message: 'All marked as read' });
});

router.put('/:id/read', requireAuth, async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.userId);
  res.json({ notification });
});

export default router;
