import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    community: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    communityMember: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    payment: {
      findFirst: vi.fn(),
    },
    course: {
      findMany: vi.fn(),
    },
    enrollment: {
      createMany: vi.fn(),
    },
  },
}));

vi.mock('../../lib/db-selects.js', () => ({
  USER_PUBLIC_SELECT: { id: true, name: true, avatar: true },
  MODERATOR_ROLES: ['OWNER', 'ADMIN', 'MODERATOR'],
}));

vi.mock('slug', () => ({
  default: vi.fn((str) => str.toLowerCase().replace(/\s+/g, '-')),
}));

vi.mock('../notifications/notification.service.js', () => ({
  sendNotification: vi.fn().mockResolvedValue({}),
}));

import { prisma } from '../../lib/prisma.js';
import {
  listCommunities,
  getCommunityBySlug,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityMembers,
  getMembershipStatus,
  removeMember,
  updateMemberRole,
} from './community.service.js';

beforeEach(() => vi.clearAllMocks());

const COMMUNITY = {
  id: 'com-1',
  name: 'Makteb Academy',
  slug: 'makteb-academy',
  description: 'Learn together',
  visibility: 'PUBLIC',
  price: null,
  creatorId: 'creator-1',
  creator: { id: 'creator-1', name: 'Ali', avatar: null },
  _count: { members: 10, courses: 2 },
};

// ── listCommunities ────────────────────────────────────────
describe('listCommunities()', () => {
  it('returns paginated list of communities', async () => {
    prisma.community.findMany.mockResolvedValue([COMMUNITY]);
    prisma.community.count.mockResolvedValue(1);

    const result = await listCommunities({ skip: 0, take: 12, page: 1 });

    expect(result.communities).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('applies search filter', async () => {
    prisma.community.findMany.mockResolvedValue([]);
    prisma.community.count.mockResolvedValue(0);

    await listCommunities({ search: 'coding', skip: 0, take: 12, page: 1 });

    expect(prisma.community.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: expect.objectContaining({ contains: 'coding' }) }),
          ]),
        }),
      })
    );
  });

  it('applies category filter', async () => {
    prisma.community.findMany.mockResolvedValue([]);
    prisma.community.count.mockResolvedValue(0);

    await listCommunities({ category: 'tech', skip: 0, take: 12, page: 1 });

    expect(prisma.community.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: 'tech',
        }),
      })
    );
  });

  it('returns empty when no communities found', async () => {
    prisma.community.findMany.mockResolvedValue([]);
    prisma.community.count.mockResolvedValue(0);

    const result = await listCommunities({ skip: 0, take: 12, page: 1 });

    expect(result.communities).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});

// ── getCommunityBySlug ─────────────────────────────────────
describe('getCommunityBySlug()', () => {
  it('returns community when found', async () => {
    prisma.community.findUnique.mockResolvedValue(COMMUNITY);

    const result = await getCommunityBySlug('makteb-academy');

    expect(result).toEqual(COMMUNITY);
    expect(prisma.community.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'makteb-academy' } })
    );
  });

  it('throws 404 when community not found', async () => {
    prisma.community.findUnique.mockResolvedValue(null);

    await expect(getCommunityBySlug('not-exists')).rejects.toThrow('Community not found');
  });
});

// ── createCommunity ────────────────────────────────────────
describe('createCommunity()', () => {
  it('creates community with auto-slug and default levels', async () => {
    prisma.community.findUnique.mockResolvedValue(null); // slug not taken
    prisma.community.create.mockResolvedValue(COMMUNITY);
    prisma.user.update.mockResolvedValue({});

    const result = await createCommunity('creator-1', {
      name: 'Makteb Academy',
      description: 'Learn together',
    });

    expect(prisma.community.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Makteb Academy',
          slug: 'makteb-academy',
          creatorId: 'creator-1',
          members: { create: { userId: 'creator-1', role: 'OWNER' } },
          levels: { createMany: { data: expect.any(Array) } },
        }),
      })
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'creator-1' },
      data: { role: 'CREATOR' },
    });
    expect(result).toEqual(COMMUNITY);
  });

  it('appends suffix when slug already exists', async () => {
    prisma.community.findUnique.mockResolvedValue(COMMUNITY); // slug taken
    prisma.community.create.mockResolvedValue(COMMUNITY);
    prisma.user.update.mockResolvedValue({});

    await createCommunity('creator-1', { name: 'Makteb Academy', description: 'Desc' });

    const createCall = prisma.community.create.mock.calls[0][0];
    expect(createCall.data.slug).toMatch(/^makteb-academy-/);
  });
});

// ── updateCommunity ────────────────────────────────────────
describe('updateCommunity()', () => {
  it('updates community when user is creator', async () => {
    prisma.community.findUnique.mockResolvedValue({ id: 'com-1', creatorId: 'creator-1' });
    prisma.community.update.mockResolvedValue({ ...COMMUNITY, name: 'Updated' });

    const result = await updateCommunity('creator-1', 'com-1', { name: 'Updated' });

    expect(result.name).toBe('Updated');
  });

  it('throws 403 when user is not creator', async () => {
    prisma.community.findUnique.mockResolvedValue({ id: 'com-1', creatorId: 'creator-1' });

    await expect(updateCommunity('other-user', 'com-1', { name: 'Hack' }))
      .rejects.toThrow('Not authorized');
  });

  it('throws 403 when community not found', async () => {
    prisma.community.findUnique.mockResolvedValue(null);

    await expect(updateCommunity('user-1', 'not-exists', {}))
      .rejects.toThrow('Not authorized');
  });
});

// ── deleteCommunity ────────────────────────────────────────
describe('deleteCommunity()', () => {
  it('deletes community when user is creator', async () => {
    prisma.community.findUnique.mockResolvedValue({ id: 'com-1', creatorId: 'creator-1' });
    prisma.community.delete.mockResolvedValue({});

    await deleteCommunity('creator-1', 'com-1');

    expect(prisma.community.delete).toHaveBeenCalledWith({ where: { id: 'com-1' } });
  });

  it('throws 403 when user is not creator', async () => {
    prisma.community.findUnique.mockResolvedValue({ id: 'com-1', creatorId: 'creator-1' });

    await expect(deleteCommunity('other-user', 'com-1')).rejects.toThrow('Not authorized');
  });
});

// ── joinCommunity ──────────────────────────────────────────
describe('joinCommunity()', () => {
  it('joins a free community', async () => {
    prisma.communityMember.findUnique.mockResolvedValue(null);
    prisma.community.findUnique.mockResolvedValue({ id: 'com-1', price: null });
    prisma.communityMember.create.mockResolvedValue({});
    prisma.course.findMany.mockResolvedValue([]);

    await joinCommunity('user-1', 'com-1');

    expect(prisma.communityMember.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', communityId: 'com-1' },
    });
  });

  it('auto-enrolls in free published courses', async () => {
    prisma.communityMember.findUnique.mockResolvedValue(null);
    prisma.community.findUnique.mockResolvedValue({ id: 'com-1', price: null });
    prisma.communityMember.create.mockResolvedValue({});
    prisma.course.findMany.mockResolvedValue([{ id: 'course-1' }, { id: 'course-2' }]);
    prisma.enrollment.createMany.mockResolvedValue({});

    await joinCommunity('user-1', 'com-1');

    expect(prisma.enrollment.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 'user-1', courseId: 'course-1' },
        { userId: 'user-1', courseId: 'course-2' },
      ],
      skipDuplicates: true,
    });
  });

  it('throws 409 when already a member', async () => {
    prisma.communityMember.findUnique.mockResolvedValue({ id: 'mem-1' });

    await expect(joinCommunity('user-1', 'com-1')).rejects.toThrow('Already a member');
  });

  it('throws 402 when paid community has no payment', async () => {
    prisma.communityMember.findUnique.mockResolvedValue(null);
    prisma.community.findUnique.mockResolvedValue({ id: 'com-1', price: 50 });
    prisma.payment.findFirst.mockResolvedValue(null);

    await expect(joinCommunity('user-1', 'com-1')).rejects.toThrow('Payment required');
  });

  it('joins paid community when payment exists', async () => {
    prisma.communityMember.findUnique.mockResolvedValue(null);
    prisma.community.findUnique.mockResolvedValue({ id: 'com-1', price: 50 });
    prisma.payment.findFirst.mockResolvedValue({ id: 'pay-1', status: 'COMPLETED' });
    prisma.communityMember.create.mockResolvedValue({});
    prisma.course.findMany.mockResolvedValue([]);

    await joinCommunity('user-1', 'com-1');

    expect(prisma.communityMember.create).toHaveBeenCalled();
  });

  it('throws 404 when community not found', async () => {
    prisma.communityMember.findUnique.mockResolvedValue(null);
    prisma.community.findUnique.mockResolvedValue(null);

    await expect(joinCommunity('user-1', 'not-exists')).rejects.toThrow('Community not found');
  });
});

// ── leaveCommunity ─────────────────────────────────────────
describe('leaveCommunity()', () => {
  it('removes the membership record', async () => {
    prisma.communityMember.delete.mockResolvedValue({});

    await leaveCommunity('user-1', 'com-1');

    expect(prisma.communityMember.delete).toHaveBeenCalledWith({
      where: { userId_communityId: { userId: 'user-1', communityId: 'com-1' } },
    });
  });
});

// ── getCommunityMembers ────────────────────────────────────
describe('getCommunityMembers()', () => {
  it('returns list of members', async () => {
    const members = [
      { id: 'mem-1', role: 'OWNER', user: { id: 'u1', name: 'Ali', avatar: null } },
      { id: 'mem-2', role: 'MEMBER', user: { id: 'u2', name: 'Sara', avatar: null } },
    ];
    prisma.communityMember.findMany.mockResolvedValue(members);

    const result = await getCommunityMembers('com-1');

    expect(result).toHaveLength(2);
    expect(prisma.communityMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { communityId: 'com-1' } })
    );
  });
});

// ── getMembershipStatus ────────────────────────────────────
describe('getMembershipStatus()', () => {
  it('returns membership when exists', async () => {
    const membership = { id: 'mem-1', role: 'MEMBER' };
    prisma.communityMember.findUnique.mockResolvedValue(membership);

    const result = await getMembershipStatus('user-1', 'com-1');

    expect(result).toEqual(membership);
  });

  it('returns null when not a member', async () => {
    prisma.communityMember.findUnique.mockResolvedValue(null);

    const result = await getMembershipStatus('user-1', 'com-1');

    expect(result).toBeNull();
  });
});

// ── removeMember ───────────────────────────────────────────
describe('removeMember()', () => {
  it('removes member when actor is moderator', async () => {
    prisma.communityMember.findUnique.mockResolvedValue({ role: 'OWNER' });
    prisma.communityMember.delete.mockResolvedValue({});

    await removeMember('admin-1', 'com-1', 'target-user');

    expect(prisma.communityMember.delete).toHaveBeenCalledWith({
      where: { userId_communityId: { userId: 'target-user', communityId: 'com-1' } },
    });
  });

  it('throws 403 when actor is not moderator', async () => {
    prisma.communityMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

    await expect(removeMember('user-1', 'com-1', 'target')).rejects.toThrow('Not authorized');
  });

  it('throws 403 when actor is not a member', async () => {
    prisma.communityMember.findUnique.mockResolvedValue(null);

    await expect(removeMember('outsider', 'com-1', 'target')).rejects.toThrow('Not authorized');
  });
});

// ── updateMemberRole ───────────────────────────────────────
describe('updateMemberRole()', () => {
  it('updates role when actor is OWNER', async () => {
    prisma.communityMember.findUnique.mockResolvedValue({ role: 'OWNER' });
    prisma.communityMember.update.mockResolvedValue({ role: 'MODERATOR' });

    const result = await updateMemberRole('owner-1', 'com-1', 'target', 'MODERATOR');

    expect(result.role).toBe('MODERATOR');
    expect(prisma.communityMember.update).toHaveBeenCalledWith({
      where: { userId_communityId: { userId: 'target', communityId: 'com-1' } },
      data: { role: 'MODERATOR' },
    });
  });

  it('updates role when actor is ADMIN', async () => {
    prisma.communityMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
    prisma.communityMember.update.mockResolvedValue({ role: 'MEMBER' });

    const result = await updateMemberRole('admin-1', 'com-1', 'target', 'MEMBER');

    expect(result.role).toBe('MEMBER');
  });

  it('throws 403 when actor is MEMBER', async () => {
    prisma.communityMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

    await expect(updateMemberRole('user-1', 'com-1', 'target', 'ADMIN'))
      .rejects.toThrow('Not authorized');
  });

  it('throws 403 when actor is MODERATOR', async () => {
    prisma.communityMember.findUnique.mockResolvedValue({ role: 'MODERATOR' });

    await expect(updateMemberRole('mod-1', 'com-1', 'target', 'ADMIN'))
      .rejects.toThrow('Not authorized');
  });
});
