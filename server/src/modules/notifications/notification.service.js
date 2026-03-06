import { prisma } from '../../lib/prisma.js';
import { getIO } from '../../lib/socket.js';
import { AppError } from '../../middleware/error-handler.js';

export async function createNotification(userId, { title, body, link }) {
  return prisma.notification.create({
    data: { userId, title, body, link: link || null },
  });
}

export async function getUserNotifications(userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return { notifications, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getUnreadCount(userId) {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function markAsRead(notificationId, userId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification || notification.userId !== userId) {
    throw new AppError('Notification not found', 404);
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function sendNotification(userId, { title, body, link }) {
  const notification = await createNotification(userId, { title, body, link });

  try {
    getIO().to(`user:${userId}`).emit('notification:new', notification);
  } catch {
    // Socket may not be initialized in tests
  }

  return notification;
}
