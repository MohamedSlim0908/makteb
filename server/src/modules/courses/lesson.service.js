import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error-handler.js';
import { awardPoints } from '../gamification/gamification.service.js';

function calculateCourseProgress(completedLessonIds, modules) {
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  if (totalLessons === 0) return 0;
  return Math.round((completedLessonIds.size / totalLessons) * 10000) / 100;
}

export async function getLesson(lessonId) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: { course: { select: { id: true, communityId: true, creatorId: true } } },
      },
    },
  });
  if (!lesson) throw new AppError('Lesson not found', 404);
  return lesson;
}

export async function createLesson(userId, { moduleId, title, type, content, videoUrl, duration, order }) {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { course: { select: { creatorId: true } } },
  });
  if (!mod) throw new AppError('Module not found', 404);
  if (mod.course.creatorId !== userId) throw new AppError('Not authorized', 403);

  return prisma.lesson.create({
    data: { moduleId, title, type: type || 'TEXT', content, videoUrl, duration, order: order ?? 0 },
  });
}

export async function updateLesson(userId, lessonId, data) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: { select: { creatorId: true } } } } },
  });
  if (!lesson) throw new AppError('Lesson not found', 404);
  if (lesson.module.course.creatorId !== userId) throw new AppError('Not authorized', 403);

  const { title, type, content, videoUrl, duration, order } = data;
  return prisma.lesson.update({
    where: { id: lessonId },
    data: { title, type, content, videoUrl, duration, order },
  });
}

export async function deleteLesson(userId, lessonId) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: { select: { creatorId: true } } } } },
  });
  if (!lesson) throw new AppError('Lesson not found', 404);
  if (lesson.module.course.creatorId !== userId) throw new AppError('Not authorized', 403);

  await prisma.lesson.delete({ where: { id: lessonId } });
}

export async function completeLesson(userId, lessonId) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: {
            include: { modules: { include: { lessons: { select: { id: true } } } } },
          },
        },
      },
    },
  });
  if (!lesson) throw new AppError('Lesson not found', 404);

  const courseId = lesson.module.courseId;
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment) throw new AppError('Not enrolled in this course', 403);

  const completedLessonIds = new Set(enrollment.completedLessons);
  completedLessonIds.add(lessonId);

  const progress = calculateCourseProgress(completedLessonIds, lesson.module.course.modules);

  const updated = await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { completedLessons: Array.from(completedLessonIds), progress },
  });

  await awardPoints(userId, lesson.module.course.communityId, 10, 'Completed a lesson');

  return updated;
}

export async function reorderLessons(userId, moduleId, lessonIds) {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { course: { select: { creatorId: true } } },
  });
  if (!mod) throw new AppError('Module not found', 404);
  if (mod.course.creatorId !== userId) throw new AppError('Not authorized', 403);

  const updates = lessonIds.map((id, index) =>
    prisma.lesson.update({ where: { id }, data: { order: index } })
  );
  await prisma.$transaction(updates);
}
