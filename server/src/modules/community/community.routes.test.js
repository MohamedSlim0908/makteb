import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────

// Bypass requireAuth — inject userId via app middleware instead
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => next(),
  requireRole: () => (_req, _res, next) => next(),
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    community: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    communityMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      findFirst: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
}));

vi.mock('slug', () => ({ default: (s) => s.toLowerCase().replace(/\s+/g, '-') }));

import { prisma } from '../../lib/prisma.js';
import express from 'express';
import request from 'supertest';
import router from './community.routes.js';

// Build a mini Express app for testing
function buildApp(userId = 'user-test-id', userRole = 'MEMBER') {
  const app = express();
  app.use(express.json());
  // Inject auth mock
  app.use((req, _res, next) => {
    req.userId = userId;
    req.userRole = userRole;
    next();
  });
  app.use('/', router);
  return app;
}

beforeEach(() => vi.clearAllMocks());

const COMMUNITY = {
  id: 'com-1',
  name: 'Makteb Academy',
  slug: 'makteb-academy',
  description: 'Learn together',
  visibility: 'PUBLIC',
  price: null,
  creatorId: 'user-test-id',
  creator: { id: 'user-test-id', name: 'Ali', avatar: null },
  _count: { members: 10, courses: 2, posts: 5 },
};

describe('GET /', () => {
  it('returns a list of communities', async () => {
    prisma.community.findMany.mockResolvedValue([COMMUNITY]);
    prisma.community.count.mockResolvedValue(1);

    const res = await request(buildApp()).get('/');

    expect(res.status).toBe(200);
    expect(res.body.communities).toHaveLength(1);
    expect(res.body.communities[0].name).toBe('Makteb Academy');
    expect(res.body.total).toBe(1);
  });

  it('supports search query', async () => {
    prisma.community.findMany.mockResolvedValue([]);
    prisma.community.count.mockResolvedValue(0);

    await request(buildApp()).get('/?search=coding');

    expect(prisma.community.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      })
    );
  });

  it('defaults to page 1, limit 12', async () => {
    prisma.community.findMany.mockResolvedValue([]);
    prisma.community.count.mockResolvedValue(0);

    await request(buildApp()).get('/');

    expect(prisma.community.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 12 })
    );
  });
});

describe('GET /:slug', () => {
  it('returns the community for a valid slug', async () => {
    prisma.community.findUnique.mockResolvedValue(COMMUNITY);

    const res = await request(buildApp()).get('/makteb-academy');

    expect(res.status).toBe(200);
    expect(res.body.community.slug).toBe('makteb-academy');
  });

  it('returns 404 when community not found', async () => {
    prisma.community.findUnique.mockResolvedValue(null);

    const res = await request(buildApp()).get('/not-exists');

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('POST /', () => {
  it('creates a community and returns 201', async () => {
    prisma.community.findUnique.mockResolvedValue(null); // no slug collision
    prisma.community.create.mockResolvedValue(COMMUNITY);
    prisma.user.update.mockResolvedValue({});

    const res = await request(buildApp())
      .post('/')
      .send({ name: 'Makteb Academy', description: 'Learn together' });

    expect(res.status).toBe(201);
    expect(res.body.community.name).toBe('Makteb Academy');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(buildApp()).post('/').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

describe('DELETE /:id/leave', () => {
  it('removes member from community', async () => {
    prisma.communityMember.delete.mockResolvedValue({});

    const res = await request(buildApp()).delete('/com-1/leave');

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });
});
