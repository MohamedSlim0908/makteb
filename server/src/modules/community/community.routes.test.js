import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./community.service.js', () => ({
  listCommunities: vi.fn(),
  getCommunityBySlug: vi.fn(),
  createCommunity: vi.fn(),
  updateCommunity: vi.fn(),
  deleteCommunity: vi.fn(),
  joinCommunity: vi.fn(),
  leaveCommunity: vi.fn(),
  getCommunityMembers: vi.fn(),
  getMembershipStatus: vi.fn(),
  removeMember: vi.fn(),
  updateMemberRole: vi.fn(),
}));

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => next(),
  requireRole: () => (_req, _res, next) => next(),
}));

import * as communityService from './community.service.js';
import express from 'express';
import request from 'supertest';
import router from './community.routes.js';
import { errorHandler } from '../../middleware/error-handler.js';

function buildApp(userId = 'user-test-id', userRole = 'MEMBER') {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.userId = userId;
    req.userRole = userRole;
    next();
  });
  app.use('/', router);
  app.use(errorHandler);
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
    communityService.listCommunities.mockResolvedValue({
      communities: [COMMUNITY],
      total: 1,
      page: 1,
      totalPages: 1,
    });

    const res = await request(buildApp()).get('/');

    expect(res.status).toBe(200);
    expect(res.body.communities).toHaveLength(1);
    expect(res.body.communities[0].name).toBe('Makteb Academy');
    expect(res.body.total).toBe(1);
  });

  it('supports search query', async () => {
    communityService.listCommunities.mockResolvedValue({ communities: [], total: 0, page: 1, totalPages: 0 });

    await request(buildApp()).get('/?search=coding');

    expect(communityService.listCommunities).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'coding' })
    );
  });

  it('defaults to page 1, limit 12', async () => {
    communityService.listCommunities.mockResolvedValue({ communities: [], total: 0, page: 1, totalPages: 0 });

    await request(buildApp()).get('/');

    expect(communityService.listCommunities).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 12 })
    );
  });
});

describe('GET /:slug', () => {
  it('returns the community for a valid slug', async () => {
    communityService.getCommunityBySlug.mockResolvedValue(COMMUNITY);

    const res = await request(buildApp()).get('/makteb-academy');

    expect(res.status).toBe(200);
    expect(res.body.community.slug).toBe('makteb-academy');
  });

  it('returns 404 when community not found', async () => {
    const { AppError } = await import('../../middleware/error-handler.js');
    communityService.getCommunityBySlug.mockRejectedValue(new AppError('Community not found', 404));

    const res = await request(buildApp()).get('/not-exists');

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('POST /', () => {
  it('creates a community and returns 201', async () => {
    communityService.createCommunity.mockResolvedValue(COMMUNITY);

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
    communityService.leaveCommunity.mockResolvedValue(undefined);

    const res = await request(buildApp()).delete('/com-1/leave');

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });
});
