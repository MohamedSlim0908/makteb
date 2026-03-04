import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => next(),
  requireRole: () => (_req, _res, next) => next(),
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    course: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    community: {
      findUnique: vi.fn(),
    },
    enrollment: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    payment: {
      findFirst: vi.fn(),
    },
    module: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}));

vi.mock('../gamification/gamification.service.js', () => ({
  awardPoints: vi.fn().mockResolvedValue({}),
}));

import { prisma } from '../../lib/prisma.js';
import express from 'express';
import request from 'supertest';
import router from './course.routes.js';

function buildApp(userId = 'creator-1') {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.userId = userId; next(); });
  app.use('/', router);
  return app;
}

beforeEach(() => vi.clearAllMocks());

const COURSE = {
  id: 'course-1',
  communityId: 'com-1',
  creatorId: 'creator-1',
  title: 'JS Fundamentals',
  description: 'Learn JS from scratch',
  price: null,
  published: false,
  order: 0,
  creator: { id: 'creator-1', name: 'Ali', avatar: null },
  _count: { modules: 2, enrollments: 5 },
};

describe('GET /community/:communityId', () => {
  it('returns list of published courses', async () => {
    prisma.course.findMany.mockResolvedValue([COURSE]);

    const res = await request(buildApp()).get('/community/com-1');

    expect(res.status).toBe(200);
    expect(res.body.courses).toHaveLength(1);
    expect(res.body.courses[0].title).toBe('JS Fundamentals');
  });

  it('only returns published courses', async () => {
    prisma.course.findMany.mockResolvedValue([]);

    await request(buildApp()).get('/community/com-1');

    expect(prisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ published: true }),
      })
    );
  });
});

describe('GET /:id', () => {
  it('returns course with modules and lessons', async () => {
    prisma.course.findUnique.mockResolvedValue({ ...COURSE, modules: [] });

    const res = await request(buildApp()).get('/course-1');

    expect(res.status).toBe(200);
    expect(res.body.course.id).toBe('course-1');
  });

  it('returns 404 for unknown course', async () => {
    prisma.course.findUnique.mockResolvedValue(null);

    const res = await request(buildApp()).get('/unknown');

    expect(res.status).toBe(404);
  });
});

describe('POST /', () => {
  it('creates a course when requester is community creator', async () => {
    prisma.community.findUnique.mockResolvedValue({ id: 'com-1', creatorId: 'creator-1' });
    prisma.course.create.mockResolvedValue(COURSE);

    const res = await request(buildApp('creator-1'))
      .post('/')
      .send({ communityId: 'com-1', title: 'JS Fundamentals' });

    expect(res.status).toBe(201);
    expect(res.body.course.title).toBe('JS Fundamentals');
  });

  it('returns 403 when requester is not community creator', async () => {
    prisma.community.findUnique.mockResolvedValue({ id: 'com-1', creatorId: 'someone-else' });

    const res = await request(buildApp('random-user'))
      .post('/')
      .send({ communityId: 'com-1', title: 'Hacking' });

    expect(res.status).toBe(403);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(buildApp()).post('/').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /:id/enroll', () => {
  it('enrolls user in a free course', async () => {
    prisma.course.findUnique.mockResolvedValue({
      ...COURSE,
      price: null,
      communityId: 'com-1',
      modules: [{ lessons: [] }],
    });
    prisma.enrollment.findUnique.mockResolvedValue(null); // not enrolled yet
    prisma.enrollment.create.mockResolvedValue({ id: 'enr-1', userId: 'u1', courseId: 'course-1' });

    const res = await request(buildApp('u1')).post('/course-1/enroll');

    expect(res.status).toBe(201);
    expect(res.body.enrollment).toBeDefined();
  });

  it('returns 409 when already enrolled', async () => {
    prisma.course.findUnique.mockResolvedValue({ ...COURSE, price: null, modules: [] });
    prisma.enrollment.findUnique.mockResolvedValue({ id: 'enr-1' }); // already enrolled

    const res = await request(buildApp('u1')).post('/course-1/enroll');

    expect(res.status).toBe(409);
  });

  it('returns 402 for a paid course without payment', async () => {
    prisma.course.findUnique.mockResolvedValue({
      ...COURSE,
      price: 99,
      modules: [],
    });
    prisma.enrollment.findUnique.mockResolvedValue(null);
    prisma.payment.findFirst.mockResolvedValue(null); // no payment

    const res = await request(buildApp('u1')).post('/course-1/enroll');

    expect(res.status).toBe(402);
  });
});
