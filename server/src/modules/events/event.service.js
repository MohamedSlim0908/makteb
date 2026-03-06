import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error-handler.js';

export async function listCommunityEvents(communityId, { month, year }) {
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) throw new AppError('Community not found', 404);

  const startOfMonth = new Date(Date.UTC(year, month, 1));
  const endOfMonth = new Date(Date.UTC(year, month + 1, 1));

  const events = await prisma.event.findMany({
    where: {
      communityId,
      startAt: { gte: startOfMonth, lt: endOfMonth },
    },
    orderBy: { startAt: 'asc' },
    include: {
      creator: { select: { id: true, name: true, avatar: true } },
      _count: { select: { attendance: true } },
    },
  });

  return events;
}

export async function getEvent(eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      creator: { select: { id: true, name: true, avatar: true } },
      attendance: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });
  if (!event) throw new AppError('Event not found', 404);
  return event;
}

export async function createEvent(communityId, creatorId, { title, description, startAt, endAt, meetingUrl }) {
  const membership = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: creatorId, communityId } },
  });
  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    throw new AppError('Not authorized', 403);
  }

  const event = await prisma.event.create({
    data: {
      communityId,
      createdBy: creatorId,
      title,
      description: description || null,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : new Date(new Date(startAt).getTime() + 3600000),
      meetingUrl: meetingUrl || null,
    },
    include: {
      creator: { select: { id: true, name: true, avatar: true } },
      _count: { select: { attendance: true } },
    },
  });

  return event;
}

export async function updateEvent(eventId, userId, data) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('Event not found', 404);
  if (event.createdBy !== userId) throw new AppError('Not authorized', 403);

  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.startAt !== undefined) updateData.startAt = new Date(data.startAt);
  if (data.endAt !== undefined) updateData.endAt = new Date(data.endAt);
  if (data.meetingUrl !== undefined) updateData.meetingUrl = data.meetingUrl;

  return prisma.event.update({
    where: { id: eventId },
    data: updateData,
    include: {
      creator: { select: { id: true, name: true, avatar: true } },
      _count: { select: { attendance: true } },
    },
  });
}

export async function deleteEvent(eventId, userId) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('Event not found', 404);
  if (event.createdBy !== userId) throw new AppError('Not authorized', 403);

  await prisma.event.delete({ where: { id: eventId } });
}

export async function setAttendance(eventId, userId, status) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('Event not found', 404);

  return prisma.eventAttendance.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId, status },
    update: { status, respondedAt: new Date() },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });
}

export async function getUpcomingEvent(communityId) {
  const event = await prisma.event.findFirst({
    where: {
      communityId,
      startAt: { gt: new Date() },
    },
    orderBy: { startAt: 'asc' },
    include: {
      creator: { select: { id: true, name: true, avatar: true } },
      _count: { select: { attendance: true } },
    },
  });

  return event || null;
}
