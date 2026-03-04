import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => { req.userId = 'user-1'; next(); },
  requireRole: () => (_req, _res, next) => next(),
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    post: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    communityMember: {
      findUnique: vi.fn(),
    },
    like: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    comment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../../lib/socket.js', () => ({
  getIO: vi.fn(() => ({ to: () => ({ emit: vi.fn() }) })),
}));

vi.mock('../gamification/gamification.service.js', () => ({
  awardPoints: vi.fn().mockResolvedValue({}),
}));

import { prisma } from '../../lib/prisma.js';
import express from 'express';
import request from 'supertest';
import router from './post.routes.js';

function buildApp(userId = 'user-1') {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.userId = userId; next(); });
  app.use('/', router);
  return app;
}

beforeEach(() => vi.clearAllMocks());

const POST = {
  id: 'post-1',
  communityId: 'com-1',
  authorId: 'user-1',
  title: 'Test Post',
  content: 'Content here',
  type: 'DISCUSSION',
  pinned: false,
  createdAt: new Date(),
  author: { id: 'user-1', name: 'Ali', avatar: null },
  _count: { comments: 2, likes: 5 },
};

// ── GET /community/:communityId ─────────────────────────
describe('GET /community/:communityId', () => {
  it('returns posts and pagination info', async () => {
    prisma.post.findMany.mockResolvedValue([POST]);
    prisma.post.count.mockResolvedValue(1);

    const res = await request(buildApp()).get('/community/com-1');

    expect(res.status).toBe(200);
    expect(res.body.posts).toHaveLength(1);
    expect(res.body.total).toBe(1);
    expect(res.body.totalPages).toBe(1);
  });

  it('defaults to page 1 limit 20', async () => {
    prisma.post.findMany.mockResolvedValue([]);
    prisma.post.count.mockResolvedValue(0);

    await request(buildApp()).get('/community/com-1');

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 })
    );
  });
});

// ── GET /:id ───────────────────────────────────────────
describe('GET /:id', () => {
  it('returns a single post with comments', async () => {
    prisma.post.findUnique.mockResolvedValue({ ...POST, comments: [] });

    const res = await request(buildApp()).get('/post-1');

    expect(res.status).toBe(200);
    expect(res.body.post.id).toBe('post-1');
  });

  it('returns 404 for unknown post', async () => {
    prisma.post.findUnique.mockResolvedValue(null);

    const res = await request(buildApp()).get('/unknown');

    expect(res.status).toBe(404);
  });
});

// ── POST / ─────────────────────────────────────────────
describe('POST /', () => {
  it('creates a post when user is a member', async () => {
    prisma.communityMember.findUnique.mockResolvedValue({ id: 'mem-1', role: 'MEMBER' });
    prisma.post.create.mockResolvedValue(POST);

    const res = await request(buildApp())
      .post('/')
      .send({ communityId: 'com-1', title: 'Test Post', content: 'Content here' });

    expect(res.status).toBe(201);
    expect(res.body.post.title).toBe('Test Post');
  });

  it('returns 403 when user is not a member', async () => {
    prisma.communityMember.findUnique.mockResolvedValue(null);

    const res = await request(buildApp())
      .post('/')
      .send({ communityId: 'com-1', title: 'Post', content: 'Body' });

    expect(res.status).toBe(403);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(buildApp()).post('/').send({});
    expect(res.status).toBe(400);
  });
});

// ── POST /:id/like ──────────────────────────────────────
describe('POST /:id/like', () => {
  it('adds a like when not already liked', async () => {
    prisma.like.findUnique.mockResolvedValue(null); // not liked yet
    prisma.like.create.mockResolvedValue({});
    prisma.post.findUnique.mockResolvedValue(POST);

    const res = await request(buildApp()).post('/post-1/like');

    expect(res.status).toBe(200);
    expect(res.body.liked).toBe(true);
  });

  it('removes a like when already liked (toggle)', async () => {
    prisma.like.findUnique.mockResolvedValue({ id: 'like-1' });
    prisma.like.delete.mockResolvedValue({});

    const res = await request(buildApp()).post('/post-1/like');

    expect(res.status).toBe(200);
    expect(res.body.liked).toBe(false);
  });
});

// ── POST /:id/comments ──────────────────────────────────
describe('POST /:id/comments', () => {
  it('creates a comment on a post', async () => {
    prisma.post.findUnique.mockResolvedValue(POST);
    prisma.comment.create.mockResolvedValue({
      id: 'com-1',
      content: 'Nice post!',
      postId: 'post-1',
      authorId: 'user-1',
      author: { id: 'user-1', name: 'Ali', avatar: null },
    });

    const res = await request(buildApp())
      .post('/post-1/comments')
      .send({ content: 'Nice post!' });

    expect(res.status).toBe(201);
    expect(res.body.comment.content).toBe('Nice post!');
  });

  it('creates a nested reply with parentId', async () => {
    prisma.post.findUnique.mockResolvedValue(POST);
    prisma.comment.create.mockResolvedValue({
      id: 'rep-1',
      content: 'Thanks!',
      parentId: 'com-1',
      author: { id: 'user-1', name: 'Ali', avatar: null },
    });

    const res = await request(buildApp())
      .post('/post-1/comments')
      .send({ content: 'Thanks!', parentId: 'com-1' });

    expect(res.status).toBe(201);
    expect(res.body.comment.parentId).toBe('com-1');
  });

  it('returns 400 when content is empty', async () => {
    const res = await request(buildApp())
      .post('/post-1/comments')
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 404 when post does not exist', async () => {
    prisma.post.findUnique.mockResolvedValue(null);

    const res = await request(buildApp())
      .post('/unknown-post/comments')
      .send({ content: 'Hello' });

    expect(res.status).toBe(404);
  });
});

// ── PUT /:id/pin ────────────────────────────────────────
describe('PUT /:id/pin', () => {
  it('pins a post when user is moderator', async () => {
    prisma.post.findUnique.mockResolvedValue(POST);
    prisma.communityMember.findUnique.mockResolvedValue({ role: 'OWNER' });
    prisma.post.update.mockResolvedValue({ ...POST, pinned: true });

    const res = await request(buildApp()).put('/post-1/pin');

    expect(res.status).toBe(200);
    expect(res.body.post.pinned).toBe(true);
  });

  it('returns 403 when user is not moderator', async () => {
    prisma.post.findUnique.mockResolvedValue(POST);
    prisma.communityMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

    const res = await request(buildApp()).put('/post-1/pin');

    expect(res.status).toBe(403);
  });
});
