import { Router, Request, Response } from 'express';
import { param, query } from '../../lib/params';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../../middleware/auth';
import { awardPoints } from '../gamification/gamification.service';

const router = Router();

// Get courses for a community
router.get('/community/:communityId', async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      where: { communityId: param(req, 'communityId'), published: true },
      orderBy: { order: 'asc' },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { modules: true, enrollments: true } },
      },
    });
    res.json({ courses });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single course with modules & lessons
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: param(req, 'id') },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    res.json({ course });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create course (creator only)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { communityId, title, description, price, coverImage } = req.body;
    if (!communityId || !title) {
      res.status(400).json({ error: 'communityId and title are required' });
      return;
    }

    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community || community.creatorId !== req.userId) {
      res.status(403).json({ error: 'Only community creator can add courses' });
      return;
    }

    const course = await prisma.course.create({
      data: {
        communityId,
        creatorId: req.userId!,
        title,
        description,
        price: price || null,
        coverImage,
      },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { modules: true, enrollments: true } },
      },
    });

    res.status(201).json({ course });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update course
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: param(req, 'id') } });
    if (!course || course.creatorId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const { title, description, price, coverImage, published, order } = req.body;
    const updated = await prisma.course.update({
      where: { id: param(req, 'id') },
      data: { title, description, price, coverImage, published, order },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: { lessons: { orderBy: { order: 'asc' } } },
        },
        _count: { select: { enrollments: true } },
      },
    });
    res.json({ course: updated });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete course
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: param(req, 'id') } });
    if (!course || course.creatorId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    await prisma.course.delete({ where: { id: param(req, 'id') } });
    res.json({ message: 'Course deleted' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create module in a course
router.post('/:id/modules', requireAuth, async (req: Request, res: Response) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: param(req, 'id') } });
    if (!course || course.creatorId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const { title, order } = req.body;
    const mod = await prisma.module.create({
      data: { courseId: param(req, 'id'), title, order: order ?? 0 },
      include: { lessons: true },
    });
    res.status(201).json({ module: mod });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update module
router.put('/modules/:moduleId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, order } = req.body;
    const mod = await prisma.module.update({
      where: { id: param(req, 'moduleId') },
      data: { title, order },
      include: { lessons: true },
    });
    res.json({ module: mod });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete module
router.delete('/modules/:moduleId', requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.module.delete({ where: { id: param(req, 'moduleId') } });
    res.json({ message: 'Module deleted' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enroll in course
router.post('/:id/enroll', requireAuth, async (req: Request, res: Response) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: param(req, 'id') },
      include: { modules: { include: { lessons: true } } },
    });
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.userId!, courseId: param(req, 'id') } },
    });
    if (existing) {
      res.status(409).json({ error: 'Already enrolled' });
      return;
    }

    // Check payment if paid course
    if (course.price && Number(course.price) > 0) {
      const payment = await prisma.payment.findFirst({
        where: { userId: req.userId!, type: 'COURSE', referenceId: course.id, status: 'COMPLETED' },
      });
      if (!payment) {
        res.status(402).json({ error: 'Payment required', price: course.price });
        return;
      }
    }

    const enrollment = await prisma.enrollment.create({
      data: { userId: req.userId!, courseId: param(req, 'id') },
    });

    await awardPoints(req.userId!, course.communityId, 10, 'Enrolled in a course');

    res.status(201).json({ enrollment });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get enrollment / progress
router.get('/:id/progress', requireAuth, async (req: Request, res: Response) => {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.userId!, courseId: param(req, 'id') } },
    });
    if (!enrollment) {
      res.status(404).json({ error: 'Not enrolled' });
      return;
    }
    res.json({ enrollment });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reorder modules
router.put('/:id/reorder-modules', requireAuth, async (req: Request, res: Response) => {
  try {
    const { moduleIds } = req.body; // ordered array of module IDs
    const updates = (moduleIds as string[]).map((id, index) =>
      prisma.module.update({ where: { id }, data: { order: index } })
    );
    await prisma.$transaction(updates);
    res.json({ message: 'Modules reordered' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
