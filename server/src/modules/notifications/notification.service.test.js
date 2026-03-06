import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('../../lib/socket.js', () => ({
  getIO: vi.fn(() => ({
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
  })),
}));

import { prisma } from '../../lib/prisma.js';
import {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  sendNotification,
} from './notification.service.js';
import { getIO } from '../../lib/socket.js';

beforeEach(() => vi.clearAllMocks());

const NOTIFICATION = {
  id: 'notif-1',
  userId: 'user-1',
  title: 'Test Notification',
  body: 'Test body',
  link: '/test',
  read: false,
  createdAt: new Date().toISOString(),
};

// ── createNotification ─────────────────────────────────────
describe('createNotification()', () => {
  it('creates a notification in the database', async () => {
    prisma.notification.create.mockResolvedValue(NOTIFICATION);

    const result = await createNotification('user-1', {
      title: 'Test Notification',
      body: 'Test body',
      link: '/test',
    });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        title: 'Test Notification',
        body: 'Test body',
        link: '/test',
      },
    });
    expect(result).toEqual(NOTIFICATION);
  });

  it('sets link to null when not provided', async () => {
    prisma.notification.create.mockResolvedValue({ ...NOTIFICATION, link: null });

    await createNotification('user-1', { title: 'Test', body: 'Body' });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ link: null }),
    });
  });
});

// ── getUserNotifications ───────────────────────────────────
describe('getUserNotifications()', () => {
  it('returns paginated notifications newest first', async () => {
    prisma.notification.findMany.mockResolvedValue([NOTIFICATION]);
    prisma.notification.count.mockResolvedValue(1);

    const result = await getUserNotifications('user-1', { page: 1, limit: 20 });

    expect(result.notifications).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      })
    );
  });

  it('calculates correct skip for page 2', async () => {
    prisma.notification.findMany.mockResolvedValue([]);
    prisma.notification.count.mockResolvedValue(25);

    const result = await getUserNotifications('user-1', { page: 2, limit: 10 });

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
    expect(result.totalPages).toBe(3);
  });
});

// ── getUnreadCount ─────────────────────────────────────────
describe('getUnreadCount()', () => {
  it('returns count of unread notifications', async () => {
    prisma.notification.count.mockResolvedValue(5);

    const result = await getUnreadCount('user-1');

    expect(result).toBe(5);
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: 'user-1', read: false },
    });
  });
});

// ── markAsRead ─────────────────────────────────────────────
describe('markAsRead()', () => {
  it('marks notification as read when user owns it', async () => {
    prisma.notification.findUnique.mockResolvedValue(NOTIFICATION);
    prisma.notification.update.mockResolvedValue({ ...NOTIFICATION, read: true });

    const result = await markAsRead('notif-1', 'user-1');

    expect(result.read).toBe(true);
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: { read: true },
    });
  });

  it('throws 404 when notification not found', async () => {
    prisma.notification.findUnique.mockResolvedValue(null);

    await expect(markAsRead('unknown', 'user-1')).rejects.toThrow('Notification not found');
  });

  it('throws 404 when user does not own notification', async () => {
    prisma.notification.findUnique.mockResolvedValue({ ...NOTIFICATION, userId: 'other-user' });

    await expect(markAsRead('notif-1', 'user-1')).rejects.toThrow('Notification not found');
  });
});

// ── markAllAsRead ──────────────────────────────────────────
describe('markAllAsRead()', () => {
  it('updates all unread notifications for user', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 3 });

    await markAllAsRead('user-1');

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', read: false },
      data: { read: true },
    });
  });
});

// ── sendNotification ───────────────────────────────────────
describe('sendNotification()', () => {
  it('creates notification and emits socket event', async () => {
    prisma.notification.create.mockResolvedValue(NOTIFICATION);
    const mockEmit = vi.fn();
    const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    getIO.mockReturnValue({ to: mockTo });

    const result = await sendNotification('user-1', {
      title: 'Test Notification',
      body: 'Test body',
      link: '/test',
    });

    expect(result).toEqual(NOTIFICATION);
    expect(mockTo).toHaveBeenCalledWith('user:user-1');
    expect(mockEmit).toHaveBeenCalledWith('notification:new', NOTIFICATION);
  });
});
