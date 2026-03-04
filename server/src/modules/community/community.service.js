import slugify from 'slug';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error-handler.js';
import { USER_PUBLIC_SELECT, MODERATOR_ROLES } from '../../lib/db-selects.js';

const DEFAULT_COMMUNITY_LEVELS = [
  { name: 'Newcomer', minPoints: 0, order: 1 },
  { name: 'Active', minPoints: 50, order: 2 },
  { name: 'Contributor', minPoints: 150, order: 3 },
  { name: 'Expert', minPoints: 500, order: 4 },
  { name: 'Legend', minPoints: 1000, order: 5 },
];

export async function listCommunities({ search, page, skip, take }) {
  const where = { visibility: 'PUBLIC' };
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
        creator: { select: USER_PUBLIC_SELECT },
        _count: { select: { members: true, courses: true } },
      },
    }),
    prisma.community.count({ where }),
  ]);

  return { communities, total, page, totalPages: Math.ceil(total / take) };
}

export async function getCommunityBySlug(slug) {
  const community = await prisma.community.findUnique({
    where: { slug },
    include: {
      creator: { select: USER_PUBLIC_SELECT },
      _count: { select: { members: true, courses: true, posts: true } },
    },
  });
  if (!community) throw new AppError('Community not found', 404);
  return community;
}

export async function createCommunity(userId, { name, description, visibility, price, coverImage }) {
  let communitySlug = slugify(name, { lower: true });
  const existing = await prisma.community.findUnique({ where: { slug: communitySlug } });
  if (existing) communitySlug += '-' + Date.now().toString(36);

  const community = await prisma.community.create({
    data: {
      name,
      slug: communitySlug,
      description,
      visibility: visibility || 'PUBLIC',
      price: price || null,
      coverImage,
      creatorId: userId,
      members: { create: { userId, role: 'OWNER' } },
      levels: { createMany: { data: DEFAULT_COMMUNITY_LEVELS } },
    },
    include: {
      creator: { select: USER_PUBLIC_SELECT },
      _count: { select: { members: true } },
    },
  });

  await prisma.user.update({ where: { id: userId }, data: { role: 'CREATOR' } });

  return community;
}

export async function updateCommunity(userId, communityId, data) {
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community || community.creatorId !== userId) throw new AppError('Not authorized', 403);

  const { name, description, visibility, price, coverImage } = data;
  return prisma.community.update({
    where: { id: communityId },
    data: { name, description, visibility, price, coverImage },
    include: {
      creator: { select: USER_PUBLIC_SELECT },
      _count: { select: { members: true, courses: true, posts: true } },
    },
  });
}

export async function deleteCommunity(userId, communityId) {
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community || community.creatorId !== userId) throw new AppError('Not authorized', 403);
  await prisma.community.delete({ where: { id: communityId } });
}

export async function joinCommunity(userId, communityId) {
  const existingMembership = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId, communityId } },
  });
  if (existingMembership) throw new AppError('Already a member', 409);

  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) throw new AppError('Community not found', 404);

  if (community.price && Number(community.price) > 0) {
    const payment = await prisma.payment.findFirst({
      where: { userId, type: 'COMMUNITY', referenceId: communityId, status: 'COMPLETED' },
    });
    if (!payment) throw new AppError('Payment required', 402);
  }

  await prisma.communityMember.create({ data: { userId, communityId } });

  const publishedFreeCourses = await prisma.course.findMany({
    where: {
      communityId,
      published: true,
      OR: [{ price: null }, { price: { lte: 0 } }],
    },
    select: { id: true },
  });

  if (publishedFreeCourses.length) {
    await prisma.enrollment.createMany({
      data: publishedFreeCourses.map((course) => ({
        userId,
        courseId: course.id,
      })),
      skipDuplicates: true,
    });
  }
}

export async function leaveCommunity(userId, communityId) {
  await prisma.communityMember.delete({
    where: { userId_communityId: { userId, communityId } },
  });
}

export async function getCommunityMembers(communityId) {
  return prisma.communityMember.findMany({
    where: { communityId },
    include: { user: { select: USER_PUBLIC_SELECT } },
    orderBy: { joinedAt: 'asc' },
  });
}

export async function getMembershipStatus(userId, communityId) {
  return prisma.communityMember.findUnique({
    where: { userId_communityId: { userId, communityId } },
  });
}

export async function removeMember(actorId, communityId, targetUserId) {
  const actorMembership = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: actorId, communityId } },
  });
  if (!actorMembership || !MODERATOR_ROLES.includes(actorMembership.role)) {
    throw new AppError('Not authorized', 403);
  }
  await prisma.communityMember.delete({
    where: { userId_communityId: { userId: targetUserId, communityId } },
  });
}

export async function updateMemberRole(actorId, communityId, targetUserId, role) {
  const actorMembership = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: actorId, communityId } },
  });
  if (!actorMembership || !['OWNER', 'ADMIN'].includes(actorMembership.role)) {
    throw new AppError('Not authorized', 403);
  }
  return prisma.communityMember.update({
    where: { userId_communityId: { userId: targetUserId, communityId } },
    data: { role },
  });
}
