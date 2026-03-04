import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./course.service.js', () => ({
  listCommunityCourses: vi.fn(),
  getCourse: vi.fn(),
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  deleteCourse: vi.fn(),
  createModule: vi.fn(),
  updateModule: vi.fn(),
  deleteModule: vi.fn(),
  enrollInCourse: vi.fn(),
  getCourseProgress: vi.fn(),
  reorderModules: vi.fn(),
}));

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => next(),
  requireRole: () => (_req, _res, next) => next(),
}));

import * as courseService from './course.service.js';
import express from 'express';
import request from 'supertest';
import router from './course.routes.js';
import { errorHandler } from '../../middleware/error-handler.js';

function buildApp(userId = 'creator-1') {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.userId = userId; next(); });
  app.use('/', router);
  app.use(errorHandler);
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
    courseService.listCommunityCourses.mockResolvedValue([COURSE]);

    const res = await request(buildApp()).get('/community/com-1');

    expect(res.status).toBe(200);
    expect(res.body.courses).toHaveLength(1);
    expect(res.body.courses[0].title).toBe('JS Fundamentals');
  });

  it('only returns published courses', async () => {
    courseService.listCommunityCourses.mockResolvedValue([]);

    await request(buildApp()).get('/community/com-1');

    expect(courseService.listCommunityCourses).toHaveBeenCalledWith('com-1');
  });
});

describe('GET /:id', () => {
  it('returns course with modules and lessons', async () => {
    courseService.getCourse.mockResolvedValue({ ...COURSE, modules: [] });

    const res = await request(buildApp()).get('/course-1');

    expect(res.status).toBe(200);
    expect(res.body.course.id).toBe('course-1');
  });

  it('returns 404 for unknown course', async () => {
    const { AppError } = await import('../../middleware/error-handler.js');
    courseService.getCourse.mockRejectedValue(new AppError('Course not found', 404));

    const res = await request(buildApp()).get('/unknown');

    expect(res.status).toBe(404);
  });
});

describe('POST /', () => {
  it('creates a course when requester is community creator', async () => {
    courseService.createCourse.mockResolvedValue(COURSE);

    const res = await request(buildApp('creator-1'))
      .post('/')
      .send({ communityId: 'com-1', title: 'JS Fundamentals' });

    expect(res.status).toBe(201);
    expect(res.body.course.title).toBe('JS Fundamentals');
  });

  it('returns 403 when requester is not community creator', async () => {
    const { AppError } = await import('../../middleware/error-handler.js');
    courseService.createCourse.mockRejectedValue(
      new AppError('Only community creator can add courses', 403)
    );

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
    courseService.enrollInCourse.mockResolvedValue({ id: 'enr-1', userId: 'u1', courseId: 'course-1' });

    const res = await request(buildApp('u1')).post('/course-1/enroll');

    expect(res.status).toBe(201);
    expect(res.body.enrollment).toBeDefined();
  });

  it('returns 409 when already enrolled', async () => {
    const { AppError } = await import('../../middleware/error-handler.js');
    courseService.enrollInCourse.mockRejectedValue(new AppError('Already enrolled', 409));

    const res = await request(buildApp('u1')).post('/course-1/enroll');

    expect(res.status).toBe(409);
  });

  it('returns 402 for a paid course without payment', async () => {
    const { AppError } = await import('../../middleware/error-handler.js');
    courseService.enrollInCourse.mockRejectedValue(new AppError('Payment required', 402));

    const res = await request(buildApp('u1')).post('/course-1/enroll');

    expect(res.status).toBe(402);
  });
});
