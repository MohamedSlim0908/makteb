import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    community: {
      findUnique: vi.fn(),
    },
    communityMember: {
      findUnique: vi.fn(),
    },
    event: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    eventAttendance: {
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from '../../lib/prisma.js';
import {
  listCommunityEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  setAttendance,
  getUpcomingEvent,
} from './event.service.js';

beforeEach(() => vi.clearAllMocks());

const EVENT = {
  id: 'evt-1',
  communityId: 'com-1',
  createdBy: 'user-1',
  title: 'LIVE Q&A',
  description: 'Weekly session',
  startAt: new Date('2026-03-15T17:00:00Z'),
  endAt: new Date('2026-03-15T18:00:00Z'),
  meetingUrl: 'https://meet.google.com/abc',
  createdAt: new Date(),
  creator: { id: 'user-1', name: 'Ali', avatar: null },
  _count: { attendance: 3 },
};

// ── listCommunityEvents ──────────────────────────────────
describe('listCommunityEvents()', () => {
  it('returns events for a given month', async () => {
    prisma.community.findUnique.mockResolvedValue({ id: 'com-1' });
    prisma.event.findMany.mockResolvedValue([EVENT]);

    const result = await listCommunityEvents('com-1', { month: 2, year: 2026 });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('LIVE Q&A');
    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          communityId: 'com-1',
        }),
      })
    );
  });

  it('throws 404 when community not found', async () => {
    prisma.community.findUnique.mockResolvedValue(null);

    await expect(listCommunityEvents('not-exists', { month: 0, year: 2026 }))
      .rejects.toThrow('Community not found');
  });
});

// ── getEvent ─────────────────────────────────────────────
describe('getEvent()', () => {
  it('returns event with attendees', async () => {
    const eventWithAttendance = { ...EVENT, attendance: [] };
    prisma.event.findUnique.mockResolvedValue(eventWithAttendance);

    const result = await getEvent('evt-1');

    expect(result.title).toBe('LIVE Q&A');
    expect(prisma.event.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'evt-1' } })
    );
  });

  it('throws 404 when event not found', async () => {
    prisma.event.findUnique.mockResolvedValue(null);

    await expect(getEvent('not-exists')).rejects.toThrow('Event not found');
  });
});

// ── createEvent ──────────────────────────────────────────
describe('createEvent()', () => {
  it('creates event when user is admin/owner', async () => {
    prisma.communityMember.findUnique.mockResolvedValue({ role: 'OWNER' });
    prisma.event.create.mockResolvedValue(EVENT);

    const result = await createEvent('com-1', 'user-1', {
      title: 'LIVE Q&A',
      description: 'Weekly session',
      startAt: '2026-03-15T17:00:00Z',
      endAt: '2026-03-15T18:00:00Z',
      meetingUrl: 'https://meet.google.com/abc',
    });

    expect(result.title).toBe('LIVE Q&A');
    expect(prisma.event.create).toHaveBeenCalled();
  });

  it('throws 403 when user is a regular member', async () => {
    prisma.communityMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

    await expect(
      createEvent('com-1', 'user-2', { title: 'Hack', startAt: '2026-03-15T17:00:00Z' })
    ).rejects.toThrow('Not authorized');
  });

  it('throws 403 when user is not a member', async () => {
    prisma.communityMember.findUnique.mockResolvedValue(null);

    await expect(
      createEvent('com-1', 'outsider', { title: 'Hack', startAt: '2026-03-15T17:00:00Z' })
    ).rejects.toThrow('Not authorized');
  });

  it('defaults endAt to 1 hour after startAt when not provided', async () => {
    prisma.communityMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
    prisma.event.create.mockResolvedValue(EVENT);

    await createEvent('com-1', 'user-1', {
      title: 'Quick Call',
      startAt: '2026-03-15T17:00:00Z',
    });

    const createCall = prisma.event.create.mock.calls[0][0];
    expect(createCall.data.endAt).toEqual(new Date('2026-03-15T18:00:00Z'));
  });
});

// ── updateEvent ──────────────────────────────────────────
describe('updateEvent()', () => {
  it('updates event when user is creator', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'evt-1', createdBy: 'user-1' });
    prisma.event.update.mockResolvedValue({ ...EVENT, title: 'Updated Q&A' });

    const result = await updateEvent('evt-1', 'user-1', { title: 'Updated Q&A' });

    expect(result.title).toBe('Updated Q&A');
  });

  it('throws 403 when user is not creator', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'evt-1', createdBy: 'user-1' });

    await expect(updateEvent('evt-1', 'other-user', { title: 'Hack' }))
      .rejects.toThrow('Not authorized');
  });

  it('throws 404 when event not found', async () => {
    prisma.event.findUnique.mockResolvedValue(null);

    await expect(updateEvent('not-exists', 'user-1', {}))
      .rejects.toThrow('Event not found');
  });
});

// ── deleteEvent ──────────────────────────────────────────
describe('deleteEvent()', () => {
  it('deletes event when user is creator', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'evt-1', createdBy: 'user-1' });
    prisma.event.delete.mockResolvedValue({});

    await deleteEvent('evt-1', 'user-1');

    expect(prisma.event.delete).toHaveBeenCalledWith({ where: { id: 'evt-1' } });
  });

  it('throws 403 when user is not creator', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'evt-1', createdBy: 'user-1' });

    await expect(deleteEvent('evt-1', 'other-user')).rejects.toThrow('Not authorized');
  });

  it('throws 404 when event not found', async () => {
    prisma.event.findUnique.mockResolvedValue(null);

    await expect(deleteEvent('not-exists', 'user-1')).rejects.toThrow('Event not found');
  });
});

// ── setAttendance ────────────────────────────────────────
describe('setAttendance()', () => {
  it('upserts attendance status', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'evt-1' });
    prisma.eventAttendance.upsert.mockResolvedValue({
      eventId: 'evt-1',
      userId: 'user-1',
      status: 'GOING',
      user: { id: 'user-1', name: 'Ali', avatar: null },
    });

    const result = await setAttendance('evt-1', 'user-1', 'GOING');

    expect(result.status).toBe('GOING');
    expect(prisma.eventAttendance.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { eventId_userId: { eventId: 'evt-1', userId: 'user-1' } },
        create: { eventId: 'evt-1', userId: 'user-1', status: 'GOING' },
      })
    );
  });

  it('throws 404 when event not found', async () => {
    prisma.event.findUnique.mockResolvedValue(null);

    await expect(setAttendance('not-exists', 'user-1', 'GOING'))
      .rejects.toThrow('Event not found');
  });
});

// ── getUpcomingEvent ─────────────────────────────────────
describe('getUpcomingEvent()', () => {
  it('returns the next upcoming event', async () => {
    prisma.event.findFirst.mockResolvedValue(EVENT);

    const result = await getUpcomingEvent('com-1');

    expect(result.title).toBe('LIVE Q&A');
    expect(prisma.event.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          communityId: 'com-1',
          startAt: expect.objectContaining({ gt: expect.any(Date) }),
        }),
        orderBy: { startAt: 'asc' },
      })
    );
  });

  it('returns null when no upcoming events', async () => {
    prisma.event.findFirst.mockResolvedValue(null);

    const result = await getUpcomingEvent('com-1');

    expect(result).toBeNull();
  });
});
