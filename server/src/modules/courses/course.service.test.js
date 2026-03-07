import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    course: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    community: {
      findUnique: vi.fn(),
    },
    enrollment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    module: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    payment: {
      findFirst: vi.fn(),
    },
    communityMember: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}));

vi.mock('../../lib/db-selects.js', () => ({
  USER_PUBLIC_SELECT: { id: true, name: true, avatar: true },
}));

vi.mock('../gamification/gamification.service.js', () => ({
  awardPoints: vi.fn().mockResolvedValue({}),
}));

vi.mock('../notifications/notification.service.js', () => ({
  sendNotification: vi.fn().mockResolvedValue({}),
}));

import { prisma } from '../../lib/prisma.js';
import { awardPoints } from '../gamification/gamification.service.js';
import {
  listCourses,
  listCommunityCourses,
  listEnrolledCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  createModule,
  updateModule,
  deleteModule,
  enrollInCourse,
  getCourseProgress,
  reorderModules,
} from './course.service.js';

beforeEach(() => vi.clearAllMocks());

const COURSE = {
  id: 'course-1',
  communityId: 'com-1',
  creatorId: 'creator-1',
  title: 'JS Fundamentals',
  description: 'Learn JS',
  price: null,
  published: true,
  order: 0,
  createdAt: new Date(),
  creator: { id: 'creator-1', name: 'Ali', avatar: null },
  community: { id: 'com-1', name: 'Makteb', slug: 'makteb', coverImage: null, _count: { members: 10 } },
  _count: { modules: 2, enrollments: 5 },
};

// ── listCourses ─────────────────────────────────────────────
describe('listCourses()', () => {
  it('returns paginated published courses', async () => {
    prisma.course.findMany.mockResolvedValue([COURSE]);
    prisma.course.count.mockResolvedValue(1);

    const result = await listCourses({ skip: 0, take: 12, page: 1 });

    expect(result.courses).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('applies search filter', async () => {
    prisma.course.findMany.mockResolvedValue([]);
    prisma.course.count.mockResolvedValue(0);

    await listCourses({ search: 'javascript', skip: 0, take: 12, page: 1 });

    expect(prisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          published: true,
          OR: expect.any(Array),
        }),
      })
    );
  });

  it('maps enrollmentCount and moduleCount', async () => {
    prisma.course.findMany.mockResolvedValue([COURSE]);
    prisma.course.count.mockResolvedValue(1);

    const result = await listCourses({ skip: 0, take: 12, page: 1 });

    expect(result.courses[0].enrollmentCount).toBe(5);
    expect(result.courses[0].moduleCount).toBe(2);
    expect(result.courses[0].memberCount).toBe(10);
  });
});

// ── listCommunityCourses ────────────────────────────────────
describe('listCommunityCourses()', () => {
  it('returns published courses for a community', async () => {
    prisma.course.findMany.mockResolvedValue([COURSE]);

    const result = await listCommunityCourses('com-1');

    expect(result).toHaveLength(1);
    expect(prisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { communityId: 'com-1', published: true },
      })
    );
  });
});

// ── listEnrolledCourses ─────────────────────────────────────
describe('listEnrolledCourses()', () => {
  it('returns enrolled courses with progress', async () => {
    const enrollment = {
      id: 'enr-1',
      progress: 50,
      completedLessons: ['l1'],
      enrolledAt: new Date(),
      course: COURSE,
    };
    prisma.enrollment.findMany.mockResolvedValue([enrollment]);

    const result = await listEnrolledCourses('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].enrollment.progress).toBe(50);
    expect(result[0].id).toBe('course-1');
  });

  it('filters out enrollments with null course', async () => {
    prisma.enrollment.findMany.mockResolvedValue([{ id: 'enr-1', course: null }]);

    const result = await listEnrolledCourses('user-1');

    expect(result).toHaveLength(0);
  });
});

// ── getCourse ───────────────────────────────────────────────
describe('getCourse()', () => {
  it('returns full course with modules', async () => {
    const courseWithModules = { ...COURSE, modules: [{ id: 'mod-1', lessons: [] }] };
    prisma.course.findUnique.mockResolvedValue(courseWithModules);

    const result = await getCourse('course-1');

    expect(result.id).toBe('course-1');
    expect(result.modules).toHaveLength(1);
  });

  it('throws 404 when course not found', async () => {
    prisma.course.findUnique.mockResolvedValue(null);

    await expect(getCourse('unknown')).rejects.toThrow('Course not found');
  });
});

// ── createCourse ────────────────────────────────────────────
describe('createCourse()', () => {
  it('creates course when user is community creator', async () => {
    prisma.community.findUnique.mockResolvedValue({ id: 'com-1', creatorId: 'creator-1' });
    prisma.course.create.mockResolvedValue(COURSE);

    const result = await createCourse('creator-1', {
      communityId: 'com-1',
      title: 'JS Fundamentals',
      description: 'Learn JS',
    });

    expect(result).toEqual(COURSE);
    expect(prisma.course.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          communityId: 'com-1',
          creatorId: 'creator-1',
          title: 'JS Fundamentals',
        }),
      })
    );
  });

  it('throws 403 when user is not community creator', async () => {
    prisma.community.findUnique.mockResolvedValue({ id: 'com-1', creatorId: 'other-user' });

    await expect(createCourse('user-1', { communityId: 'com-1', title: 'Hack' }))
      .rejects.toThrow('Only community creator can add courses');
  });

  it('throws 403 when community not found', async () => {
    prisma.community.findUnique.mockResolvedValue(null);

    await expect(createCourse('user-1', { communityId: 'missing', title: 'T' }))
      .rejects.toThrow('Only community creator can add courses');
  });
});

// ── updateCourse ────────────────────────────────────────────
describe('updateCourse()', () => {
  it('updates when user is creator', async () => {
    prisma.course.findUnique.mockResolvedValue({ id: 'course-1', creatorId: 'creator-1' });
    prisma.course.update.mockResolvedValue({ ...COURSE, title: 'Updated' });

    const result = await updateCourse('creator-1', 'course-1', { title: 'Updated' });

    expect(result.title).toBe('Updated');
  });

  it('throws 403 when user is not creator', async () => {
    prisma.course.findUnique.mockResolvedValue({ id: 'course-1', creatorId: 'other' });

    await expect(updateCourse('user-1', 'course-1', {})).rejects.toThrow('Not authorized');
  });
});

// ── deleteCourse ────────────────────────────────────────────
describe('deleteCourse()', () => {
  it('deletes when user is creator', async () => {
    prisma.course.findUnique.mockResolvedValue({ id: 'course-1', creatorId: 'creator-1' });
    prisma.course.delete.mockResolvedValue({});

    await deleteCourse('creator-1', 'course-1');

    expect(prisma.course.delete).toHaveBeenCalledWith({ where: { id: 'course-1' } });
  });

  it('throws 403 when user is not creator', async () => {
    prisma.course.findUnique.mockResolvedValue({ id: 'course-1', creatorId: 'other' });

    await expect(deleteCourse('user-1', 'course-1')).rejects.toThrow('Not authorized');
  });
});

// ── createModule ────────────────────────────────────────────
describe('createModule()', () => {
  it('creates module when user is course creator', async () => {
    prisma.course.findUnique.mockResolvedValue({ id: 'course-1', creatorId: 'creator-1' });
    prisma.module.create.mockResolvedValue({ id: 'mod-1', title: 'Intro', order: 0, lessons: [] });

    const result = await createModule('creator-1', 'course-1', { title: 'Intro' });

    expect(result.title).toBe('Intro');
  });

  it('throws 403 when user is not course creator', async () => {
    prisma.course.findUnique.mockResolvedValue({ id: 'course-1', creatorId: 'other' });

    await expect(createModule('user-1', 'course-1', { title: 'Hack' }))
      .rejects.toThrow('Not authorized');
  });
});

// ── updateModule ────────────────────────────────────────────
describe('updateModule()', () => {
  it('updates module title and order', async () => {
    prisma.module.findUnique.mockResolvedValue({
      id: 'mod-1',
      course: { creatorId: 'creator-1' },
    });
    prisma.module.update.mockResolvedValue({ id: 'mod-1', title: 'Updated', order: 1, lessons: [] });

    const result = await updateModule('creator-1', 'mod-1', { title: 'Updated', order: 1 });

    expect(result.title).toBe('Updated');
    expect(prisma.module.update).toHaveBeenCalledWith({
      where: { id: 'mod-1' },
      data: { title: 'Updated', order: 1 },
      include: { lessons: true },
    });
  });

  it('throws 403 when user is not course creator', async () => {
    prisma.module.findUnique.mockResolvedValue({
      id: 'mod-1',
      course: { creatorId: 'creator-1' },
    });

    await expect(updateModule('other-user', 'mod-1', { title: 'X' }))
      .rejects.toThrow('Not authorized');
  });
});

// ── deleteModule ────────────────────────────────────────────
describe('deleteModule()', () => {
  it('deletes the module', async () => {
    prisma.module.findUnique.mockResolvedValue({
      id: 'mod-1',
      course: { creatorId: 'creator-1' },
    });
    prisma.module.delete.mockResolvedValue({});

    await deleteModule('creator-1', 'mod-1');

    expect(prisma.module.delete).toHaveBeenCalledWith({ where: { id: 'mod-1' } });
  });

  it('throws 403 when user is not course creator', async () => {
    prisma.module.findUnique.mockResolvedValue({
      id: 'mod-1',
      course: { creatorId: 'creator-1' },
    });

    await expect(deleteModule('other-user', 'mod-1'))
      .rejects.toThrow('Not authorized');
  });
});

// ── enrollInCourse ──────────────────────────────────────────
describe('enrollInCourse()', () => {
  it('enrolls user in a free course', async () => {
    prisma.course.findUnique.mockResolvedValue({
      id: 'course-1',
      price: null,
      communityId: 'com-1',
      modules: [],
    });
    prisma.enrollment.findUnique.mockResolvedValue(null);
    prisma.enrollment.create.mockResolvedValue({ id: 'enr-1', userId: 'user-1', courseId: 'course-1' });

    const result = await enrollInCourse('user-1', 'course-1');

    expect(result.id).toBe('enr-1');
    expect(awardPoints).toHaveBeenCalledWith('user-1', 'com-1', 10, 'Enrolled in a course');
  });

  it('throws 409 when already enrolled', async () => {
    prisma.course.findUnique.mockResolvedValue({ id: 'course-1', price: null, modules: [] });
    prisma.enrollment.findUnique.mockResolvedValue({ id: 'enr-1' });

    await expect(enrollInCourse('user-1', 'course-1')).rejects.toThrow('Already enrolled');
  });

  it('throws 402 for paid course without payment', async () => {
    prisma.course.findUnique.mockResolvedValue({ id: 'course-1', price: 50, communityId: 'com-1', modules: [] });
    prisma.enrollment.findUnique.mockResolvedValue(null);
    prisma.payment.findFirst.mockResolvedValue(null);

    await expect(enrollInCourse('user-1', 'course-1')).rejects.toThrow('Payment required');
  });

  it('enrolls in paid course when payment exists', async () => {
    prisma.course.findUnique.mockResolvedValue({ id: 'course-1', price: 50, communityId: 'com-1', modules: [] });
    prisma.enrollment.findUnique.mockResolvedValue(null);
    prisma.payment.findFirst.mockResolvedValue({ id: 'pay-1', status: 'COMPLETED' });
    prisma.enrollment.create.mockResolvedValue({ id: 'enr-1' });

    const result = await enrollInCourse('user-1', 'course-1');

    expect(result.id).toBe('enr-1');
  });

  it('throws 404 when course not found', async () => {
    prisma.course.findUnique.mockResolvedValue(null);

    await expect(enrollInCourse('user-1', 'unknown')).rejects.toThrow('Course not found');
  });
});

// ── getCourseProgress ───────────────────────────────────────
describe('getCourseProgress()', () => {
  it('returns existing enrollment', async () => {
    const enrollment = { id: 'enr-1', progress: 75, completedLessons: ['l1', 'l2'] };
    prisma.enrollment.findUnique.mockResolvedValue(enrollment);

    const result = await getCourseProgress('user-1', 'course-1');

    expect(result).toEqual(enrollment);
  });

  it('throws 404 when not enrolled', async () => {
    prisma.enrollment.findUnique.mockResolvedValue(null);

    await expect(getCourseProgress('user-1', 'unknown')).rejects.toThrow('Not enrolled in this course');
  });
});

// ── reorderModules ──────────────────────────────────────────
describe('reorderModules()', () => {
  it('updates order for each module', async () => {
    prisma.module.update.mockResolvedValue({});

    await reorderModules('course-1', ['mod-2', 'mod-1', 'mod-3']);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.module.update).toHaveBeenCalledTimes(3);
    expect(prisma.module.update).toHaveBeenCalledWith({ where: { id: 'mod-2' }, data: { order: 0 } });
    expect(prisma.module.update).toHaveBeenCalledWith({ where: { id: 'mod-1' }, data: { order: 1 } });
    expect(prisma.module.update).toHaveBeenCalledWith({ where: { id: 'mod-3' }, data: { order: 2 } });
  });
});
