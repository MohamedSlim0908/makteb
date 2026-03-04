import { Router } from 'express';
import { param, query } from '../../lib/params.js';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { getUserPoints, getLeaderboard } from './gamification.service.js';

const router = Router();

// Get leaderboard for a community
router.get('/leaderboard/:communityId', async (req, res) => {
  try {
    const leaderboard = await getLeaderboard(param(req, 'communityId'));
    res.json({ leaderboard });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my points in a community
router.get('/points/:communityId', requireAuth, async (req, res) => {
  try {
    const points = await getUserPoints(req.userId, param(req, 'communityId'));

    const levels = await prisma.level.findMany({
      where: { communityId: param(req, 'communityId') },
      orderBy: { minPoints: 'asc' },
    });

    const currentLevel = [...levels].reverse().find((l) => points >= l.minPoints);
    const nextLevel = levels.find((l) => l.minPoints > points);

    res.json({
      points,
      currentLevel: currentLevel?.name || 'Newcomer',
      nextLevel: nextLevel ? { name: nextLevel.name, minPoints: nextLevel.minPoints } : null,
      progressToNext: nextLevel
        ? Math.round(((points - (currentLevel?.minPoints || 0)) / (nextLevel.minPoints - (currentLevel?.minPoints || 0))) * 100)
        : 100,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent activity (point history)
router.get('/activity/:communityId', requireAuth, async (req, res) => {
  try {
    const entries = await prisma.pointEntry.findMany({
      where: { userId: req.userId, communityId: param(req, 'communityId') },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json({ activity: entries });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get levels for a community
router.get('/levels/:communityId', async (req, res) => {
  try {
    const levels = await prisma.level.findMany({
      where: { communityId: param(req, 'communityId') },
      orderBy: { minPoints: 'asc' },
    });
    res.json({ levels });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
