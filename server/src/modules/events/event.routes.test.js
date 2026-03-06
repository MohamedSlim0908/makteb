import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./event.service.js', () => ({
  listCommunityEvents: vi.fn(),
  getEvent: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  setAttendance: vi.fn(),
  getUpcomingEvent: vi.fn(),
}));

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => next(),
}));

import * as eventService from './event.service.js';
import express from 'express';
import request from 'supertest';
import router from './event.routes.js';
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

const EVENT = {
  id: 'evt-1',
  communityId: 'com-1',
  createdBy: 'user-1',
  title: 'LIVE Q&A',
  startAt: '2026-03-15T17:00:00.000Z',
  endAt: '2026-03-15T18:00:00.000Z',
  creator: { id: 'user-1', name: 'Ali', avatar: null },
  _count: { attendance: 0 },
};

// ── GET /community/:communityId ──────────────────────────
describe('GET /community/:communityId', () => {
  it('returns events for the community', async () => {
    eventService.listCommunityEvents.mockResolvedValue([EVENT]);

    const res = await request(buildApp()).get('/community/com-1?month=2&year=2026');

    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(1);
    expect(eventService.listCommunityEvents).toHaveBeenCalledWith('com-1', { month: 2, year: 2026 });
  });

  it('defaults to current month/year when not provided', async () => {
    eventService.listCommunityEvents.mockResolvedValue([]);
    const now = new Date();

    const res = await request(buildApp()).get('/community/com-1');

    expect(res.status).toBe(200);
    expect(eventService.listCommunityEvents).toHaveBeenCalledWith(
      'com-1',
      { month: now.getMonth(), year: now.getFullYear() }
    );
  });
});

// ── GET /community/:communityId/upcoming ─────────────────
describe('GET /community/:communityId/upcoming', () => {
  it('returns the upcoming event', async () => {
    eventService.getUpcomingEvent.mockResolvedValue(EVENT);

    const res = await request(buildApp()).get('/community/com-1/upcoming');

    expect(res.status).toBe(200);
    expect(res.body.event.title).toBe('LIVE Q&A');
  });

  it('returns null when no upcoming event', async () => {
    eventService.getUpcomingEvent.mockResolvedValue(null);

    const res = await request(buildApp()).get('/community/com-1/upcoming');

    expect(res.status).toBe(200);
    expect(res.body.event).toBeNull();
  });
});

// ── GET /:id ─────────────────────────────────────────────
describe('GET /:id', () => {
  it('returns single event with attendees', async () => {
    eventService.getEvent.mockResolvedValue({ ...EVENT, attendance: [] });

    const res = await request(buildApp()).get('/evt-1');

    expect(res.status).toBe(200);
    expect(res.body.event.title).toBe('LIVE Q&A');
  });

  it('returns 404 for non-existent event', async () => {
    const { AppError } = await import('../../middleware/error-handler.js');
    eventService.getEvent.mockRejectedValue(new AppError('Event not found', 404));

    const res = await request(buildApp()).get('/not-exists');

    expect(res.status).toBe(404);
  });
});

// ── POST / ───────────────────────────────────────────────
describe('POST /', () => {
  it('creates an event', async () => {
    eventService.createEvent.mockResolvedValue(EVENT);

    const res = await request(buildApp())
      .post('/')
      .send({
        communityId: 'com-1',
        title: 'LIVE Q&A',
        startAt: '2026-03-15T17:00:00Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.event.title).toBe('LIVE Q&A');
    expect(eventService.createEvent).toHaveBeenCalledWith(
      'com-1',
      'user-1',
      expect.objectContaining({ title: 'LIVE Q&A' })
    );
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(buildApp())
      .post('/')
      .send({ communityId: 'com-1' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid datetime format', async () => {
    const res = await request(buildApp())
      .post('/')
      .send({
        communityId: 'com-1',
        title: 'Test',
        startAt: 'not-a-date',
      });

    expect(res.status).toBe(400);
  });
});

// ── PUT /:id ─────────────────────────────────────────────
describe('PUT /:id', () => {
  it('updates an event', async () => {
    eventService.updateEvent.mockResolvedValue({ ...EVENT, title: 'Updated' });

    const res = await request(buildApp())
      .put('/evt-1')
      .send({ title: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.event.title).toBe('Updated');
  });
});

// ── DELETE /:id ──────────────────────────────────────────
describe('DELETE /:id', () => {
  it('deletes an event', async () => {
    eventService.deleteEvent.mockResolvedValue(undefined);

    const res = await request(buildApp()).delete('/evt-1');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Event deleted');
  });
});

// ── POST /:id/attend ─────────────────────────────────────
describe('POST /:id/attend', () => {
  it('sets attendance status', async () => {
    eventService.setAttendance.mockResolvedValue({
      eventId: 'evt-1',
      userId: 'user-1',
      status: 'GOING',
    });

    const res = await request(buildApp())
      .post('/evt-1/attend')
      .send({ status: 'GOING' });

    expect(res.status).toBe(200);
    expect(res.body.attendance.status).toBe('GOING');
  });

  it('returns 400 for invalid status', async () => {
    const res = await request(buildApp())
      .post('/evt-1/attend')
      .send({ status: 'INVALID' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when status is missing', async () => {
    const res = await request(buildApp())
      .post('/evt-1/attend')
      .send({});

    expect(res.status).toBe(400);
  });
});
