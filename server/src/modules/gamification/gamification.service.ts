import { prisma } from '../../lib/prisma';
import { getIO } from '../../lib/socket';

export async function awardPoints(
  userId: string,
  communityId: string,
  amount: number,
  reason: string
) {
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

export async function getUserPoints(userId: string, communityId: string): Promise<number> {
  const result = await prisma.pointEntry.aggregate({
    where: { userId, communityId },
    _sum: { amount: true },
  });
  return result._sum.amount || 0;
}

export async function getLeaderboard(communityId: string, limit = 20) {
  const entries = await prisma.pointEntry.groupBy({
    by: ['userId'],
    where: { communityId },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: limit,
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

  return entries.map((entry, index) => {
    const user = users.find((u) => u.id === entry.userId);
    const points = entry._sum.amount || 0;
    const level = levels.find((l) => points >= l.minPoints);
    return {
      rank: index + 1,
      user,
      points,
      level: level?.name || 'Newcomer',
      levelIcon: level?.badgeIcon,
    };
  });
}
