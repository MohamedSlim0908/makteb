import { Router } from 'express';
import { param, parsePagination } from '../../lib/params.js';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { getUserPoints, getLeaderboard } from './gamification.service.js';

const ACTIVITY_FEED_LIMIT = 30;

const router = Router();

function calculateProgressToNextLevel(points, currentLevel, nextLevel) {
  if (!nextLevel) return 100;
  const currentMin = currentLevel?.minPoints || 0;
  return Math.round(((points - currentMin) / (nextLevel.minPoints - currentMin)) * 100);
}

router.get('/leaderboard/:communityId', async (req, res) => {
  const { page, skip, take } = parsePagination(req, 20);
  const { leaderboard, total } = await getLeaderboard(param(req, 'communityId'), { skip, take });
  res.json({ leaderboard, total, page, totalPages: Math.ceil(total / take) });
});

router.get('/points/:communityId', requireAuth, async (req, res) => {
  const communityId = param(req, 'communityId');
  const points = await getUserPoints(req.userId, communityId);

  const levels = await prisma.level.findMany({
    where: { communityId },
    orderBy: { minPoints: 'asc' },
  });

  const currentLevel = [...levels].reverse().find((l) => points >= l.minPoints);
  const nextLevel = levels.find((l) => l.minPoints > points);

  res.json({
    points,
    currentLevel: currentLevel?.name || 'Newcomer',
    nextLevel: nextLevel ? { name: nextLevel.name, minPoints: nextLevel.minPoints } : null,
    progressToNext: calculateProgressToNextLevel(points, currentLevel, nextLevel),
  });
});

router.get('/activity/:communityId', requireAuth, async (req, res) => {
  const entries = await prisma.pointEntry.findMany({
    where: { userId: req.userId, communityId: param(req, 'communityId') },
    orderBy: { createdAt: 'desc' },
    take: ACTIVITY_FEED_LIMIT,
  });
  res.json({ activity: entries });
});

router.get('/levels/:communityId', async (req, res) => {
  const levels = await prisma.level.findMany({
    where: { communityId: param(req, 'communityId') },
    orderBy: { minPoints: 'asc' },
  });
  res.json({ levels });
});

router.post('/levels/:communityId', requireAuth, async (req, res) => {
  const communityId = param(req, 'communityId');
  const membership = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: req.userId, communityId } },
  });
  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const { name, minPoints, unlockDescription, badgeIcon } = req.body;
  const level = await prisma.level.create({
    data: { communityId, name, minPoints, unlockDescription, badgeIcon },
  });
  res.status(201).json({ level });
});

router.put('/levels/:communityId/:levelId', requireAuth, async (req, res) => {
  const communityId = param(req, 'communityId');
  const levelId = param(req, 'levelId');
  const membership = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: req.userId, communityId } },
  });
  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const { name, minPoints, unlockDescription, badgeIcon } = req.body;
  const level = await prisma.level.update({
    where: { id: levelId },
    data: {
      ...(name !== undefined && { name }),
      ...(minPoints !== undefined && { minPoints }),
      ...(unlockDescription !== undefined && { unlockDescription }),
      ...(badgeIcon !== undefined && { badgeIcon }),
    },
  });
  res.json({ level });
});

router.delete('/levels/:communityId/:levelId', requireAuth, async (req, res) => {
  const communityId = param(req, 'communityId');
  const levelId = param(req, 'levelId');
  const membership = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: req.userId, communityId } },
  });
  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  await prisma.level.delete({ where: { id: levelId } });
  res.json({ message: 'Level deleted' });
});

export default router;
