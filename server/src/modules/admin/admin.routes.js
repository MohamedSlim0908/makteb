import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { parsePagination, query, param } from '../../lib/params.js';
import * as adminService from './admin.service.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/stats', async (_req, res) => {
  const stats = await adminService.getAdminStats();
  res.json(stats);
});

router.get('/users', async (req, res) => {
  const search = query(req, 'search');
  const pagination = parsePagination(req, 20);
  const result = await adminService.listUsers({ search, ...pagination });
  res.json(result);
});

router.put('/users/:id/ban', async (req, res) => {
  const user = await adminService.banUser(param(req, 'id'));
  res.json({ user });
});

router.get('/posts', async (req, res) => {
  const search = query(req, 'search');
  const pagination = parsePagination(req, 20);
  const result = await adminService.listAllPosts({ search, ...pagination });
  res.json(result);
});

router.delete('/posts/:id', async (req, res) => {
  await adminService.adminDeletePost(param(req, 'id'));
  res.json({ message: 'Post deleted' });
});

router.get('/communities', async (req, res) => {
  const search = query(req, 'search');
  const pagination = parsePagination(req, 20);
  const result = await adminService.listAllCommunities({ search, ...pagination });
  res.json(result);
});

router.get('/courses', async (req, res) => {
  const search = query(req, 'search');
  const pagination = parsePagination(req, 20);
  const result = await adminService.listAllCourses({ search, ...pagination });
  res.json(result);
});

router.put('/courses/:id/toggle-publish', async (req, res) => {
  const course = await adminService.toggleCoursePublish(param(req, 'id'));
  res.json({ course });
});

router.get('/events', async (req, res) => {
  const pagination = parsePagination(req, 20);
  const result = await adminService.listAllEvents(pagination);
  res.json(result);
});

router.delete('/events/:id', async (req, res) => {
  await adminService.adminDeleteEvent(param(req, 'id'));
  res.json({ message: 'Event deleted' });
});

export default router;
