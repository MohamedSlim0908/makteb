import { describe, it, expect, vi, beforeEach } from 'vitest';

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
import { awardPoints } from '../gamification/gamification.service.js';
import {
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  completeLesson,
  reorderLessons,
} from './lesson.service.js';

beforeEach(() => vi.clearAllMocks());

const LESSON = {
  id: 'lesson-1',
  moduleId: 'module-1',
  title: 'Intro to JS',
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
        { lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }] },
      ],
    },
  },
};

// ── getLesson ───────────────────────────────────────────────
describe('getLesson()', () => {
  it('returns lesson with module and course info', async () => {
    prisma.lesson.findUnique.mockResolvedValue(LESSON_WITH_MODULE);

    const result = await getLesson('lesson-1');

    expect(result.id).toBe('lesson-1');
    expect(result.module.course.id).toBe('course-1');
  });

  it('throws 404 when lesson not found', async () => {
    prisma.lesson.findUnique.mockResolvedValue(null);

    await expect(getLesson('unknown')).rejects.toThrow('Lesson not found');
  });
});

// ── createLesson ────────────────────────────────────────────
describe('createLesson()', () => {
  it('creates a lesson', async () => {
    prisma.lesson.create.mockResolvedValue(LESSON);

    const result = await createLesson({
      moduleId: 'module-1',
      title: 'Intro to JS',
      type: 'TEXT',
      content: 'JS is awesome',
    });

    expect(result).toEqual(LESSON);
    expect(prisma.lesson.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        moduleId: 'module-1',
        title: 'Intro to JS',
        type: 'TEXT',
      }),
    });
  });

  it('defaults type to TEXT when not specified', async () => {
    prisma.lesson.create.mockResolvedValue(LESSON);

    await createLesson({ moduleId: 'module-1', title: 'Lesson' });

    expect(prisma.lesson.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'TEXT' }),
    });
  });

  it('defaults order to 0 when not specified', async () => {
    prisma.lesson.create.mockResolvedValue(LESSON);

    await createLesson({ moduleId: 'module-1', title: 'Lesson' });

    expect(prisma.lesson.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ order: 0 }),
    });
  });
});

// ── updateLesson ────────────────────────────────────────────
describe('updateLesson()', () => {
  it('updates lesson fields', async () => {
    const updated = { ...LESSON, title: 'Updated Title' };
    prisma.lesson.update.mockResolvedValue(updated);

    const result = await updateLesson('lesson-1', { title: 'Updated Title' });

    expect(result.title).toBe('Updated Title');
    expect(prisma.lesson.update).toHaveBeenCalledWith({
      where: { id: 'lesson-1' },
      data: expect.objectContaining({ title: 'Updated Title' }),
    });
  });
});

// ── deleteLesson ────────────────────────────────────────────
describe('deleteLesson()', () => {
  it('deletes the lesson', async () => {
    prisma.lesson.delete.mockResolvedValue({});

    await deleteLesson('lesson-1');

    expect(prisma.lesson.delete).toHaveBeenCalledWith({ where: { id: 'lesson-1' } });
  });
});

// ── completeLesson ──────────────────────────────────────────
describe('completeLesson()', () => {
  it('marks lesson as complete and recalculates progress', async () => {
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

    const result = await completeLesson('user-1', 'lesson-1');

    expect(result.completedLessons).toContain('lesson-1');
    expect(result.progress).toBe(50);
    expect(awardPoints).toHaveBeenCalledWith('user-1', 'com-1', 10, 'Completed a lesson');
  });

  it('is idempotent - does not duplicate already completed lesson', async () => {
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

    await completeLesson('user-1', 'lesson-1');

    const updateData = prisma.enrollment.update.mock.calls[0][0].data;
    expect(updateData.completedLessons.filter((l) => l === 'lesson-1')).toHaveLength(1);
  });

  it('throws 404 when lesson not found', async () => {
    prisma.lesson.findUnique.mockResolvedValue(null);

    await expect(completeLesson('user-1', 'unknown')).rejects.toThrow('Lesson not found');
  });

  it('throws 403 when user is not enrolled', async () => {
    prisma.lesson.findUnique.mockResolvedValue(LESSON_WITH_MODULE);
    prisma.enrollment.findUnique.mockResolvedValue(null);

    await expect(completeLesson('user-1', 'lesson-1')).rejects.toThrow('Not enrolled in this course');
  });

  it('calculates progress correctly for all lessons completed', async () => {
    prisma.lesson.findUnique.mockResolvedValue(LESSON_WITH_MODULE);
    prisma.enrollment.findUnique.mockResolvedValue({
      id: 'enr-1',
      completedLessons: ['lesson-2'], // already have lesson-2
    });
    // After adding lesson-1, both lessons completed => 100%
    prisma.enrollment.update.mockResolvedValue({
      id: 'enr-1',
      completedLessons: ['lesson-2', 'lesson-1'],
      progress: 100,
    });

    const result = await completeLesson('user-1', 'lesson-1');

    const updateCall = prisma.enrollment.update.mock.calls[0][0];
    // Progress should be 100 since 2/2 lessons are completed
    expect(updateCall.data.progress).toBe(100);
  });
});

// ── reorderLessons ──────────────────────────────────────────
describe('reorderLessons()', () => {
  it('updates order for each lesson', async () => {
    prisma.lesson.update.mockResolvedValue({});

    await reorderLessons('module-1', ['l3', 'l1', 'l2']);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.lesson.update).toHaveBeenCalledTimes(3);
    expect(prisma.lesson.update).toHaveBeenCalledWith({ where: { id: 'l3' }, data: { order: 0 } });
    expect(prisma.lesson.update).toHaveBeenCalledWith({ where: { id: 'l1' }, data: { order: 1 } });
    expect(prisma.lesson.update).toHaveBeenCalledWith({ where: { id: 'l2' }, data: { order: 2 } });
  });
});
