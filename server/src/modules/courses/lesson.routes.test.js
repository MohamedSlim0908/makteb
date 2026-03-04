import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => { req.userId = 'user-1'; next(); },
  requireRole: () => (_req, _res, next) => next(),
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    lesson: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    enrollment: {
      findUnique: vi.fn(),
      update: vi.fn(),
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
import router from './lesson.routes.js';
import { errorHandler } from '../../middleware/error-handler.js';

function buildApp(userId = 'user-1') {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.userId = userId; next(); });
  app.use('/', router);
  app.use(errorHandler);
  return app;
}

beforeEach(() => vi.clearAllMocks());

const LESSON = {
  id: 'lesson-1',
  moduleId: 'module-1',
  title: 'Intro to JavaScript',
  type: 'TEXT',
  content: 'JS is awesome',
  videoUrl: null,
  duration: 10,
  order: 0,
};

const LESSON_WITH_MODULE = {
  ...LESSON,
  module: {
    courseId: 'course-1',
    course: {
      id: 'course-1',
      communityId: 'com-1',
      creatorId: 'creator-1',
      modules: [
        {
          lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
        },
      ],
    },
  },
};

// ── GET /:id ──────────────────────────────────────────────
describe('GET /:id', () => {
  it('returns the lesson', async () => {
    prisma.lesson.findUnique.mockResolvedValue(LESSON_WITH_MODULE);

    const res = await request(buildApp()).get('/lesson-1');

    expect(res.status).toBe(200);
    expect(res.body.lesson.id).toBe('lesson-1');
    expect(res.body.lesson.title).toBe('Intro to JavaScript');
  });

  it('returns 404 for unknown lesson', async () => {
    prisma.lesson.findUnique.mockResolvedValue(null);

    const res = await request(buildApp()).get('/unknown');

    expect(res.status).toBe(404);
  });
});

// ── POST / ────────────────────────────────────────────────
describe('POST /', () => {
  it('creates a lesson and returns 201', async () => {
    prisma.lesson.create.mockResolvedValue(LESSON);

    const res = await request(buildApp())
      .post('/')
      .send({ moduleId: 'module-1', title: 'Intro to JavaScript', type: 'TEXT', content: 'JS is awesome' });

    expect(res.status).toBe(201);
    expect(res.body.lesson.title).toBe('Intro to JavaScript');
  });

  it('defaults type to TEXT when not specified', async () => {
    prisma.lesson.create.mockResolvedValue(LESSON);

    await request(buildApp()).post('/').send({ moduleId: 'module-1', title: 'Lesson' });

    expect(prisma.lesson.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'TEXT' }) })
    );
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(buildApp()).post('/').send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when moduleId is missing', async () => {
    const res = await request(buildApp()).post('/').send({ title: 'No Module' });
    expect(res.status).toBe(400);
  });
});

// ── PUT /:id ──────────────────────────────────────────────
describe('PUT /:id', () => {
  it('updates and returns the lesson', async () => {
    const updated = { ...LESSON, title: 'Updated Title' };
    prisma.lesson.update.mockResolvedValue(updated);

    const res = await request(buildApp())
      .put('/lesson-1')
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.lesson.title).toBe('Updated Title');
  });
});

// ── DELETE /:id ───────────────────────────────────────────
describe('DELETE /:id', () => {
  it('deletes the lesson and returns success', async () => {
    prisma.lesson.delete.mockResolvedValue({});

    const res = await request(buildApp()).delete('/lesson-1');

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });
});

// ── POST /:id/complete ────────────────────────────────────
describe('POST /:id/complete', () => {
  it('marks a lesson as complete and updates progress', async () => {
    prisma.lesson.findUnique.mockResolvedValue(LESSON_WITH_MODULE);
    prisma.enrollment.findUnique.mockResolvedValue({
      id: 'enr-1',
      userId: 'user-1',
      courseId: 'course-1',
      completedLessons: [],
    });
    prisma.enrollment.update.mockResolvedValue({
      id: 'enr-1',
      completedLessons: ['lesson-1'],
      progress: 50,
    });

    const res = await request(buildApp()).post('/lesson-1/complete');

    expect(res.status).toBe(200);
    expect(res.body.enrollment.completedLessons).toContain('lesson-1');
  });

  it('does not duplicate a completed lesson', async () => {
    prisma.lesson.findUnique.mockResolvedValue(LESSON_WITH_MODULE);
    prisma.enrollment.findUnique.mockResolvedValue({
      id: 'enr-1',
      completedLessons: ['lesson-1'], // already completed
    });
    prisma.enrollment.update.mockResolvedValue({
      id: 'enr-1',
      completedLessons: ['lesson-1'],
      progress: 50,
    });

    const res = await request(buildApp()).post('/lesson-1/complete');

    // Should still succeed but not duplicate
    const updatedLessons = prisma.enrollment.update.mock.calls[0][0].data.completedLessons;
    expect(updatedLessons.filter((l) => l === 'lesson-1')).toHaveLength(1);
  });

  it('returns 404 when lesson does not exist', async () => {
    prisma.lesson.findUnique.mockResolvedValue(null);

    const res = await request(buildApp()).post('/unknown/complete');

    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not enrolled', async () => {
    prisma.lesson.findUnique.mockResolvedValue(LESSON_WITH_MODULE);
    prisma.enrollment.findUnique.mockResolvedValue(null); // not enrolled

    const res = await request(buildApp()).post('/lesson-1/complete');

    expect(res.status).toBe(403);
  });
});
