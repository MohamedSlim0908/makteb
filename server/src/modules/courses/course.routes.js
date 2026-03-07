import { Router } from 'express';
import { z } from 'zod';
import { param, parsePagination, query } from '../../lib/params.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as courseService from './course.service.js';

const router = Router();

const createCourseSchema = z.object({
  communityId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0).optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
});

const updateCourseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
  published: z.boolean().optional(),
  order: z.number().int().optional(),
});

const createModuleSchema = z.object({
  title: z.string().min(1),
  order: z.number().int().optional(),
});

router.get('/', async (req, res) => {
  const search = query(req, 'search');
  const pagination = parsePagination(req, 12);
  const result = await courseService.listCourses({ search, ...pagination });
  res.json(result);
});

router.get('/community/:communityId', async (req, res) => {
  const courses = await courseService.listCommunityCourses(param(req, 'communityId'));
  res.json({ courses });
});

router.get('/enrolled/me', requireAuth, async (req, res) => {
  const enrolledCourses = await courseService.listEnrolledCourses(req.userId);
  res.json({ enrolledCourses });
});

router.get('/:id', async (req, res) => {
  const course = await courseService.getCourse(param(req, 'id'));
  res.json({ course });
});

router.post('/', requireAuth, validate(createCourseSchema), async (req, res) => {
  const course = await courseService.createCourse(req.userId, req.body);
  res.status(201).json({ course });
});

router.put('/:id', requireAuth, validate(updateCourseSchema), async (req, res) => {
  const course = await courseService.updateCourse(req.userId, param(req, 'id'), req.body);
  res.json({ course });
});

router.delete('/:id', requireAuth, async (req, res) => {
  await courseService.deleteCourse(req.userId, param(req, 'id'));
  res.json({ message: 'Course deleted' });
});

router.post('/:id/modules', requireAuth, validate(createModuleSchema), async (req, res) => {
  const mod = await courseService.createModule(req.userId, param(req, 'id'), req.body);
  res.status(201).json({ module: mod });
});

router.put('/modules/:moduleId', requireAuth, validate(createModuleSchema.partial()), async (req, res) => {
  const mod = await courseService.updateModule(req.userId, param(req, 'moduleId'), req.body);
  res.json({ module: mod });
});

router.delete('/modules/:moduleId', requireAuth, async (req, res) => {
  await courseService.deleteModule(req.userId, param(req, 'moduleId'));
  res.json({ message: 'Module deleted' });
});

router.post('/:id/enroll', requireAuth, async (req, res) => {
  const enrollment = await courseService.enrollInCourse(req.userId, param(req, 'id'));
  res.status(201).json({ enrollment });
});

router.get('/:id/progress', requireAuth, async (req, res) => {
  const enrollment = await courseService.getCourseProgress(req.userId, param(req, 'id'));
  res.json({ enrollment });
});

router.put('/:id/reorder-modules', requireAuth, async (req, res) => {
  await courseService.reorderModules(param(req, 'id'), req.body.moduleIds);
  res.json({ message: 'Modules reordered' });
});

export default router;
