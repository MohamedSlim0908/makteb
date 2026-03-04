import { Router } from 'express';
import { z } from 'zod';
import { param } from '../../lib/params.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as lessonService from './lesson.service.js';

const router = Router();

const createLessonSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(['TEXT', 'VIDEO', 'QUIZ']).optional(),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  order: z.number().int().optional(),
});

const updateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(['TEXT', 'VIDEO', 'QUIZ']).optional(),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  order: z.number().int().optional(),
});

router.get('/:id', async (req, res) => {
  const lesson = await lessonService.getLesson(param(req, 'id'));
  res.json({ lesson });
});

router.post('/', requireAuth, validate(createLessonSchema), async (req, res) => {
  const lesson = await lessonService.createLesson(req.body);
  res.status(201).json({ lesson });
});

router.put('/:id', requireAuth, validate(updateLessonSchema), async (req, res) => {
  const lesson = await lessonService.updateLesson(param(req, 'id'), req.body);
  res.json({ lesson });
});

router.delete('/:id', requireAuth, async (req, res) => {
  await lessonService.deleteLesson(param(req, 'id'));
  res.json({ message: 'Lesson deleted' });
});

router.post('/:id/complete', requireAuth, async (req, res) => {
  const enrollment = await lessonService.completeLesson(req.userId, param(req, 'id'));
  res.json({ enrollment });
});

router.put('/module/:moduleId/reorder', requireAuth, async (req, res) => {
  await lessonService.reorderLessons(param(req, 'moduleId'), req.body.lessonIds);
  res.json({ message: 'Lessons reordered' });
});

export default router;
