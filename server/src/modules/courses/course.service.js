import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error-handler.js';
import { USER_PUBLIC_SELECT } from '../../lib/db-selects.js';
import { awardPoints } from '../gamification/gamification.service.js';

export async function listCommunityCourses(communityId) {
  return prisma.course.findMany({
    where: { communityId, published: true },
    orderBy: { order: 'asc' },
    include: {
      creator: { select: USER_PUBLIC_SELECT },
      _count: { select: { modules: true, enrollments: true } },
    },
  });
}

export async function getCourse(courseId) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      creator: { select: USER_PUBLIC_SELECT },
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
      _count: { select: { enrollments: true } },
    },
  });
  if (!course) throw new AppError('Course not found', 404);
  return course;
}

export async function createCourse(creatorId, { communityId, title, description, price, coverImage }) {
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community || community.creatorId !== creatorId) {
    throw new AppError('Only community creator can add courses', 403);
  }

  return prisma.course.create({
    data: { communityId, creatorId, title, description, price: price || null, coverImage },
    include: {
      creator: { select: USER_PUBLIC_SELECT },
      _count: { select: { modules: true, enrollments: true } },
    },
  });
}

export async function updateCourse(creatorId, courseId, data) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.creatorId !== creatorId) throw new AppError('Not authorized', 403);

  const { title, description, price, coverImage, published, order } = data;
  return prisma.course.update({
    where: { id: courseId },
    data: { title, description, price, coverImage, published, order },
    include: {
      creator: { select: USER_PUBLIC_SELECT },
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
      _count: { select: { enrollments: true } },
    },
  });
}

export async function deleteCourse(creatorId, courseId) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.creatorId !== creatorId) throw new AppError('Not authorized', 403);
  await prisma.course.delete({ where: { id: courseId } });
}

export async function createModule(creatorId, courseId, { title, order }) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.creatorId !== creatorId) throw new AppError('Not authorized', 403);

  return prisma.module.create({
    data: { courseId, title, order: order ?? 0 },
    include: { lessons: true },
  });
}

export async function updateModule(moduleId, { title, order }) {
  return prisma.module.update({
    where: { id: moduleId },
    data: { title, order },
    include: { lessons: true },
  });
}

export async function deleteModule(moduleId) {
  await prisma.module.delete({ where: { id: moduleId } });
}

export async function enrollInCourse(userId, courseId) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { modules: { include: { lessons: true } } },
  });
  if (!course) throw new AppError('Course not found', 404);

  const existingEnrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existingEnrollment) throw new AppError('Already enrolled', 409);

  if (course.price && Number(course.price) > 0) {
    const payment = await prisma.payment.findFirst({
      where: { userId, type: 'COURSE', referenceId: courseId, status: 'COMPLETED' },
    });
    if (!payment) throw new AppError('Payment required', 402);
  }

  const enrollment = await prisma.enrollment.create({ data: { userId, courseId } });
  await awardPoints(userId, course.communityId, 10, 'Enrolled in a course');
  return enrollment;
}

export async function getCourseProgress(userId, courseId) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment) throw new AppError('Not enrolled', 404);
  return enrollment;
}

export async function reorderModules(courseId, moduleIds) {
  const updates = moduleIds.map((id, index) =>
    prisma.module.update({ where: { id }, data: { order: index } })
  );
  await prisma.$transaction(updates);
}
