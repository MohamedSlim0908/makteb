import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => { req.userId = 'user-1'; next(); },
  requireRole: () => (_req, _res, next) => next(),
}));

vi.mock('./gamification.service.js', () => ({
  getLeaderboard: vi.fn(),
  getUserPoints: vi.fn(),
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    level: {
      findMany: vi.fn(),
    },
    pointEntry: {
      findMany: vi.fn(),
    },
  },
}));

import { getLeaderboard, getUserPoints } from './gamification.service.js';
import { prisma } from '../../lib/prisma.js';
import express from 'express';
import request from 'supertest';
import router from './gamification.routes.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.userId = 'user-1'; next(); });
  app.use('/', router);
  return app;
}

beforeEach(() => vi.clearAllMocks());

const LEVELS = [
  { id: 'l1', name: 'Newcomer', minPoints: 0, order: 1 },
  { id: 'l2', name: 'Active', minPoints: 50, order: 2 },
  { id: 'l3', name: 'Expert', minPoints: 150, order: 3 },
];

// ── GET /leaderboard/:communityId ─────────────────────────
describe('GET /leaderboard/:communityId', () => {
  it('returns the leaderboard for a community', async () => {
    const mockLeaderboard = [
      { rank: 1, user: { id: 'u1', name: 'Ali', avatar: null }, points: 200, level: 'Expert' },
      { rank: 2, user: { id: 'u2', name: 'Sara', avatar: null }, points: 80, level: 'Active' },
    ];
    getLeaderboard.mockResolvedValue(mockLeaderboard);

    const res = await request(buildApp()).get('/leaderboard/com-1');

    expect(res.status).toBe(200);
    expect(res.body.leaderboard).toHaveLength(2);
    expect(res.body.leaderboard[0].rank).toBe(1);
    expect(res.body.leaderboard[0].points).toBe(200);
  });

  it('calls getLeaderboard with the correct communityId', async () => {
    getLeaderboard.mockResolvedValue([]);

    await request(buildApp()).get('/leaderboard/com-xyz');

    expect(getLeaderboard).toHaveBeenCalledWith('com-xyz');
  });

  it('returns an empty leaderboard when no entries', async () => {
    getLeaderboard.mockResolvedValue([]);

    const res = await request(buildApp()).get('/leaderboard/empty-com');

    expect(res.status).toBe(200);
    expect(res.body.leaderboard).toEqual([]);
  });
});

// ── GET /points/:communityId ──────────────────────────────
describe('GET /points/:communityId', () => {
  it('returns points, level and next level for authenticated user', async () => {
    getUserPoints.mockResolvedValue(75);
    prisma.level.findMany.mockResolvedValue(LEVELS);

    const res = await request(buildApp()).get('/points/com-1');

    expect(res.status).toBe(200);
    expect(res.body.points).toBe(75);
    expect(res.body.currentLevel).toBe('Active'); // 75 >= 50
    expect(res.body.nextLevel).toMatchObject({ name: 'Expert', minPoints: 150 });
  });

  it('returns Newcomer when user has 0 points', async () => {
    getUserPoints.mockResolvedValue(0);
    prisma.level.findMany.mockResolvedValue(LEVELS);

    const res = await request(buildApp()).get('/points/com-1');

    expect(res.status).toBe(200);
    expect(res.body.currentLevel).toBe('Newcomer');
  });

  it('returns 100% progress when at max level', async () => {
    getUserPoints.mockResolvedValue(500);
    prisma.level.findMany.mockResolvedValue(LEVELS);

    const res = await request(buildApp()).get('/points/com-1');

    expect(res.status).toBe(200);
    expect(res.body.nextLevel).toBeNull(); // no level above Expert
    expect(res.body.progressToNext).toBe(100);
  });

  it('calculates progress to next level correctly', async () => {
    getUserPoints.mockResolvedValue(100); // halfway between Active(50) and Expert(150)
    prisma.level.findMany.mockResolvedValue(LEVELS);

    const res = await request(buildApp()).get('/points/com-1');

    // (100 - 50) / (150 - 50) = 50/100 = 50%
    expect(res.body.progressToNext).toBe(50);
  });
});

// ── GET /activity/:communityId ────────────────────────────
describe('GET /activity/:communityId', () => {
  it('returns recent point activity for the user', async () => {
    const mockActivity = [
      { id: 'pe1', amount: 5, reason: 'Created a post', createdAt: new Date() },
      { id: 'pe2', amount: 2, reason: 'Commented on a post', createdAt: new Date() },
    ];
    prisma.pointEntry.findMany.mockResolvedValue(mockActivity);

    const res = await request(buildApp()).get('/activity/com-1');

    expect(res.status).toBe(200);
    expect(res.body.activity).toHaveLength(2);
    expect(res.body.activity[0].reason).toBe('Created a post');
  });

  it('returns empty array when no activity', async () => {
    prisma.pointEntry.findMany.mockResolvedValue([]);

    const res = await request(buildApp()).get('/activity/com-1');

    expect(res.status).toBe(200);
    expect(res.body.activity).toEqual([]);
  });
});

// ── GET /levels/:communityId ──────────────────────────────
describe('GET /levels/:communityId', () => {
  it('returns all levels for a community', async () => {
    prisma.level.findMany.mockResolvedValue(LEVELS);

    const res = await request(buildApp()).get('/levels/com-1');

    expect(res.status).toBe(200);
    expect(res.body.levels).toHaveLength(3);
    expect(res.body.levels[0].name).toBe('Newcomer');
    expect(res.body.levels[2].name).toBe('Expert');
  });

  it('queries levels ordered by minPoints ascending', async () => {
    prisma.level.findMany.mockResolvedValue(LEVELS);

    await request(buildApp()).get('/levels/com-1');

    expect(prisma.level.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { minPoints: 'asc' },
      })
    );
  });
});
