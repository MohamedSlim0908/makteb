import { prisma } from '../../lib/prisma.js';
import { getIO } from '../../lib/socket.js';

export async function awardPoints(userId, communityId, amount, reason) {
  const entry = await prisma.pointEntry.create({
    data: { userId, communityId, amount, reason },
  });

  const totalPoints = await getUserPoints(userId, communityId);

  // Check for level up
  const levels = await prisma.level.findMany({
    where: { communityId },
    orderBy: { minPoints: 'desc' },
  });

  const currentLevel = levels.find((l) => totalPoints >= l.minPoints);

  try {
    getIO().to(`community:${communityId}`).emit('points:awarded', {
      userId,
      amount,
      reason,
      totalPoints,
      level: currentLevel?.name || 'Newcomer',
    });
  } catch {
    // Socket may not be initialized during tests
  }

  return { entry, totalPoints, level: currentLevel };
}

export async function getUserPoints(userId, communityId) {
  const result = await prisma.pointEntry.aggregate({
    where: { userId, communityId },
    _sum: { amount: true },
  });
  return result._sum.amount || 0;
}

export async function getLeaderboard(communityId, { skip = 0, take = 20 } = {}) {
  // Get total unique users with points
  const allGroups = await prisma.pointEntry.groupBy({
    by: ['userId'],
    where: { communityId },
  });
  const total = allGroups.length;

  const entries = await prisma.pointEntry.groupBy({
    by: ['userId'],
    where: { communityId },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    skip,
    take,
  });

  const userIds = entries.map((e) => e.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatar: true },
  });

  const levels = await prisma.level.findMany({
    where: { communityId },
    orderBy: { minPoints: 'desc' },
  });

  const leaderboard = entries.map((entry, index) => {
    const user = users.find((u) => u.id === entry.userId);
    const points = entry._sum.amount || 0;
    const level = levels.find((l) => points >= l.minPoints);
    return {
      rank: skip + index + 1,
      user,
      points,
      level: level?.name || 'Newcomer',
      levelIcon: level?.badgeIcon,
    };
  });

  return { leaderboard, total };
}
