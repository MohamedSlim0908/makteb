import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./notification.service.js', () => ({
  getUserNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
}));

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => next(),
}));

import * as notificationService from './notification.service.js';
import express from 'express';
import request from 'supertest';
import router from './notification.routes.js';
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

const NOTIFICATION = {
  id: 'notif-1',
  userId: 'user-1',
  title: 'Test',
  body: 'Body',
  link: '/test',
  read: false,
  createdAt: new Date().toISOString(),
};

describe('GET /', () => {
  it('returns paginated notifications', async () => {
    notificationService.getUserNotifications.mockResolvedValue({
      notifications: [NOTIFICATION],
      total: 1,
      page: 1,
      totalPages: 1,
    });

    const res = await request(buildApp()).get('/');

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.total).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.totalPages).toBe(1);
  });

  it('passes pagination params to service', async () => {
    notificationService.getUserNotifications.mockResolvedValue({
      notifications: [],
      total: 0,
      page: 2,
      totalPages: 0,
    });

    await request(buildApp()).get('/?page=2&limit=10');

    expect(notificationService.getUserNotifications).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ page: 2, limit: 10 })
    );
  });
});

describe('GET /unread-count', () => {
  it('returns unread count', async () => {
    notificationService.getUnreadCount.mockResolvedValue(5);

    const res = await request(buildApp()).get('/unread-count');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(5);
  });
});

describe('PUT /read-all', () => {
  it('marks all notifications as read', async () => {
    notificationService.markAllAsRead.mockResolvedValue(undefined);

    const res = await request(buildApp()).put('/read-all');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('All marked as read');
    expect(notificationService.markAllAsRead).toHaveBeenCalledWith('user-1');
  });
});

describe('PUT /:id/read', () => {
  it('marks a single notification as read', async () => {
    notificationService.markAsRead.mockResolvedValue({ ...NOTIFICATION, read: true });

    const res = await request(buildApp()).put('/notif-1/read');

    expect(res.status).toBe(200);
    expect(res.body.notification.read).toBe(true);
    expect(notificationService.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
  });

  it('returns 404 for non-existent notification', async () => {
    const { AppError } = await import('../../middleware/error-handler.js');
    notificationService.markAsRead.mockRejectedValue(new AppError('Notification not found', 404));

    const res = await request(buildApp()).put('/unknown/read');

    expect(res.status).toBe(404);
  });
});
