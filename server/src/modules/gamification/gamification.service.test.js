import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserPoints, getLeaderboard, awardPoints } from './gamification.service.js';

// Mock prisma
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    pointEntry: {
      create: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    level: {
      findMany: vi.fn(),
    },
  },
}));

// Mock socket (may not be initialized in tests)
vi.mock('../../lib/socket.js', () => ({
  getIO: vi.fn(() => {
    throw new Error('Socket not initialized');
  }),
}));

import { prisma } from '../../lib/prisma.js';

const COMMUNITY_ID = 'community-1';
const USER_ID = 'user-1';

// Sorted desc (as the service queries them with orderBy: minPoints desc)
const LEVELS = [
  { id: 'l3', name: 'Expert', minPoints: 150, order: 3 },
  { id: 'l2', name: 'Active', minPoints: 50, order: 2 },
  { id: 'l1', name: 'Newcomer', minPoints: 0, order: 1 },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ── getUserPoints ────────────────────────────────────────────
describe('getUserPoints()', () => {
  it('returns the sum of points for a user in a community', async () => {
    prisma.pointEntry.aggregate.mockResolvedValue({ _sum: { amount: 120 } });

    const result = await getUserPoints(USER_ID, COMMUNITY_ID);

    expect(result).toBe(120);
    expect(prisma.pointEntry.aggregate).toHaveBeenCalledWith({
      where: { userId: USER_ID, communityId: COMMUNITY_ID },
      _sum: { amount: true },
    });
  });

  it('returns 0 when user has no points', async () => {
    prisma.pointEntry.aggregate.mockResolvedValue({ _sum: { amount: null } });

    const result = await getUserPoints(USER_ID, COMMUNITY_ID);

    expect(result).toBe(0);
  });

  it('returns 0 when aggregate returns undefined sum', async () => {
    prisma.pointEntry.aggregate.mockResolvedValue({ _sum: {} });

    const result = await getUserPoints(USER_ID, COMMUNITY_ID);

    expect(result).toBe(0);
  });
});

// ── awardPoints ──────────────────────────────────────────────
describe('awardPoints()', () => {
  it('creates a point entry and returns totalPoints + currentLevel', async () => {
    const mockEntry = { id: 'pe1', userId: USER_ID, communityId: COMMUNITY_ID, amount: 5, reason: 'Post' };

    prisma.pointEntry.create.mockResolvedValue(mockEntry);
    prisma.pointEntry.aggregate.mockResolvedValue({ _sum: { amount: 55 } }); // 55 total
    prisma.level.findMany.mockResolvedValue(LEVELS);

    const result = await awardPoints(USER_ID, COMMUNITY_ID, 5, 'Post');

    expect(prisma.pointEntry.create).toHaveBeenCalledWith({
      data: { userId: USER_ID, communityId: COMMUNITY_ID, amount: 5, reason: 'Post' },
    });
    expect(result.totalPoints).toBe(55);
    expect(result.level.name).toBe('Active'); // 55 >= 50
  });

  it('returns Newcomer level when points < 50', async () => {
    prisma.pointEntry.create.mockResolvedValue({});
    prisma.pointEntry.aggregate.mockResolvedValue({ _sum: { amount: 10 } });
    prisma.level.findMany.mockResolvedValue(LEVELS);

    const result = await awardPoints(USER_ID, COMMUNITY_ID, 10, 'Comment');

    expect(result.level.name).toBe('Newcomer'); // 10 < 50
  });

  it('does not throw when socket is not initialized', async () => {
    prisma.pointEntry.create.mockResolvedValue({});
    prisma.pointEntry.aggregate.mockResolvedValue({ _sum: { amount: 5 } });
    prisma.level.findMany.mockResolvedValue(LEVELS);

    // Should not throw even though socket throws
    await expect(awardPoints(USER_ID, COMMUNITY_ID, 5, 'Test')).resolves.toBeDefined();
  });
});

// ── getLeaderboard ───────────────────────────────────────────
describe('getLeaderboard()', () => {
  const mockEntries = [
    { userId: 'u1', _sum: { amount: 200 } },
    { userId: 'u2', _sum: { amount: 80 } },
    { userId: 'u3', _sum: { amount: 30 } },
  ];

  const mockUsers = [
    { id: 'u1', name: 'Ali Ben Salah', avatar: null },
    { id: 'u2', name: 'Sara Khalil', avatar: null },
    { id: 'u3', name: 'Mohamed Slim', avatar: null },
  ];

  it('returns ranked leaderboard with levels', async () => {
    // First groupBy call is for total count, second is for paginated results
    prisma.pointEntry.groupBy
      .mockResolvedValueOnce(mockEntries) // total count
      .mockResolvedValueOnce(mockEntries); // paginated
    prisma.user.findMany.mockResolvedValue(mockUsers);
    prisma.level.findMany.mockResolvedValue(LEVELS);

    const result = await getLeaderboard(COMMUNITY_ID);

    expect(result.leaderboard).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.leaderboard[0].rank).toBe(1);
    expect(result.leaderboard[0].user.name).toBe('Ali Ben Salah');
    expect(result.leaderboard[0].points).toBe(200);
    expect(result.leaderboard[0].level).toBe('Expert'); // 200 >= 150
  });

  it('assigns correct levels based on points', async () => {
    prisma.pointEntry.groupBy
      .mockResolvedValueOnce(mockEntries)
      .mockResolvedValueOnce(mockEntries);
    prisma.user.findMany.mockResolvedValue(mockUsers);
    prisma.level.findMany.mockResolvedValue(LEVELS);

    const result = await getLeaderboard(COMMUNITY_ID);

    expect(result.leaderboard[1].level).toBe('Active');  // 80 >= 50
    expect(result.leaderboard[2].level).toBe('Newcomer'); // 30 < 50
  });

  it('returns empty leaderboard when no entries', async () => {
    prisma.pointEntry.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prisma.user.findMany.mockResolvedValue([]);
    prisma.level.findMany.mockResolvedValue(LEVELS);

    const result = await getLeaderboard(COMMUNITY_ID);

    expect(result.leaderboard).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('defaults to skip 0 and take 20', async () => {
    prisma.pointEntry.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prisma.user.findMany.mockResolvedValue([]);
    prisma.level.findMany.mockResolvedValue(LEVELS);

    await getLeaderboard(COMMUNITY_ID);

    expect(prisma.pointEntry.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 })
    );
  });

  it('respects custom skip and take', async () => {
    prisma.pointEntry.groupBy
      .mockResolvedValueOnce(mockEntries) // total
      .mockResolvedValueOnce([]); // paginated (page 2 empty)
    prisma.user.findMany.mockResolvedValue([]);
    prisma.level.findMany.mockResolvedValue(LEVELS);

    await getLeaderboard(COMMUNITY_ID, { skip: 20, take: 5 });

    expect(prisma.pointEntry.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 5 })
    );
  });

  it('computes correct ranks with skip offset', async () => {
    const page2Entries = [
      { userId: 'u4', _sum: { amount: 20 } },
    ];
    prisma.pointEntry.groupBy
      .mockResolvedValueOnce([...mockEntries, ...page2Entries]) // total
      .mockResolvedValueOnce(page2Entries); // paginated
    prisma.user.findMany.mockResolvedValue([{ id: 'u4', name: 'User 4', avatar: null }]);
    prisma.level.findMany.mockResolvedValue(LEVELS);

    const result = await getLeaderboard(COMMUNITY_ID, { skip: 3, take: 5 });

    expect(result.leaderboard[0].rank).toBe(4); // skip=3, index=0 → rank 4
  });
});
