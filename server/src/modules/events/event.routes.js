import { Router } from 'express';
import { z } from 'zod';
import { param, query } from '../../lib/params.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as eventService from './event.service.js';

const router = Router();

const createEventSchema = z.object({
  communityId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  meetingUrl: z.string().url().optional().nullable(),
});

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  meetingUrl: z.string().url().optional().nullable(),
});

const attendSchema = z.object({
  status: z.enum(['GOING', 'MAYBE', 'NOT_GOING']),
});

router.get('/community/:communityId', async (req, res) => {
  const communityId = param(req, 'communityId');
  const now = new Date();
  const month = parseInt(query(req, 'month') ?? String(now.getMonth()), 10);
  const year = parseInt(query(req, 'year') ?? String(now.getFullYear()), 10);
  const events = await eventService.listCommunityEvents(communityId, { month, year });
  res.json({ events });
});

router.get('/community/:communityId/upcoming', async (req, res) => {
  const event = await eventService.getUpcomingEvent(param(req, 'communityId'));
  res.json({ event });
});

router.get('/:id', async (req, res) => {
  const event = await eventService.getEvent(param(req, 'id'));
  res.json({ event });
});

router.post('/', requireAuth, validate(createEventSchema), async (req, res) => {
  const { communityId, ...data } = req.body;
  const event = await eventService.createEvent(communityId, req.userId, data);
  res.status(201).json({ event });
});

router.put('/:id', requireAuth, validate(updateEventSchema), async (req, res) => {
  const event = await eventService.updateEvent(param(req, 'id'), req.userId, req.body);
  res.json({ event });
});

router.delete('/:id', requireAuth, async (req, res) => {
  await eventService.deleteEvent(param(req, 'id'), req.userId);
  res.json({ message: 'Event deleted' });
});

router.post('/:id/attend', requireAuth, validate(attendSchema), async (req, res) => {
  const attendance = await eventService.setAttendance(param(req, 'id'), req.userId, req.body.status);
  res.json({ attendance });
});

export default router;
