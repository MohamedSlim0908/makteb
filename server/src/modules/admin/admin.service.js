import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error-handler.js';
import { USER_PROFILE_SELECT } from '../../lib/db-selects.js';

export async function listUsers({ search, page, skip, take }) {
  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        ...USER_PROFILE_SELECT,
        createdAt: true,
        provider: true,
        _count: { select: { communities: true, posts: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, totalPages: Math.ceil(total / take) };
}

export async function banUser(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'ADMIN') throw new AppError('Cannot ban an admin', 403);

  return prisma.user.update({
    where: { id: userId },
    data: { role: 'MEMBER' },
    select: USER_PROFILE_SELECT,
  });
}

export async function listAllPosts({ search, page, skip, take }) {
  const where = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        community: { select: { id: true, name: true, slug: true } },
        _count: { select: { comments: true, likes: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total, page, totalPages: Math.ceil(total / take) };
}

export async function adminDeletePost(postId) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError('Post not found', 404);
  await prisma.post.delete({ where: { id: postId } });
}

export async function listAllCommunities({ search, page, skip, take }) {
  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [communities, total] = await Promise.all([
    prisma.community.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true, courses: true, posts: true } },
      },
    }),
    prisma.community.count({ where }),
  ]);

  return { communities, total, page, totalPages: Math.ceil(total / take) };
}

export async function listAllCourses({ search, page, skip, take }) {
  const where = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        community: { select: { id: true, name: true, slug: true } },
        _count: { select: { modules: true, enrollments: true } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  return { courses, total, page, totalPages: Math.ceil(total / take) };
}

export async function toggleCoursePublish(courseId) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError('Course not found', 404);

  return prisma.course.update({
    where: { id: courseId },
    data: { published: !course.published },
    include: {
      creator: { select: { id: true, name: true, avatar: true } },
      community: { select: { id: true, name: true, slug: true } },
      _count: { select: { modules: true, enrollments: true } },
    },
  });
}

export async function listAllEvents({ page, skip, take }) {
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      skip,
      take,
      orderBy: { startAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        community: { select: { id: true, name: true, slug: true } },
        _count: { select: { attendance: true } },
      },
    }),
    prisma.event.count(),
  ]);

  return { events, total, page, totalPages: Math.ceil(total / take) };
}

export async function adminDeleteEvent(eventId) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('Event not found', 404);
  await prisma.event.delete({ where: { id: eventId } });
}

export async function getAdminStats() {
  const [userCount, communityCount, courseCount, postCount] = await Promise.all([
    prisma.user.count(),
    prisma.community.count(),
    prisma.course.count(),
    prisma.post.count(),
  ]);

  return { userCount, communityCount, courseCount, postCount };
}
