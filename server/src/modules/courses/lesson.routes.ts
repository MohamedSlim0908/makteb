import { Router, Request, Response } from 'express';
import { param, query } from '../../lib/params';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../../middleware/auth';
import { awardPoints } from '../gamification/gamification.service';

const router = Router();

// Get single lesson
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: param(req, 'id') },
      include: {
        module: {
          include: { course: { select: { id: true, communityId: true, creatorId: true } } },
        },
      },
    });
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }
    res.json({ lesson });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create lesson
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { moduleId, title, type, content, videoUrl, duration, order } = req.body;
    if (!moduleId || !title) {
      res.status(400).json({ error: 'moduleId and title are required' });
      return;
    }

    const lesson = await prisma.lesson.create({
      data: {
        moduleId,
        title,
        type: type || 'TEXT',
        content,
        videoUrl,
        duration,
        order: order ?? 0,
      },
    });

    res.status(201).json({ lesson });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update lesson
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, type, content, videoUrl, duration, order } = req.body;
    const lesson = await prisma.lesson.update({
      where: { id: param(req, 'id') },
      data: { title, type, content, videoUrl, duration, order },
    });
    res.json({ lesson });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete lesson
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.lesson.delete({ where: { id: param(req, 'id') } });
    res.json({ message: 'Lesson deleted' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark lesson complete
router.post('/:id/complete', requireAuth, async (req: Request, res: Response) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: param(req, 'id') },
      include: {
        module: {
          include: {
            course: {
              include: {
                modules: { include: { lessons: { select: { id: true } } } },
              },
            },
          },
        },
      },
    });
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    const courseId = lesson.module.courseId;
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.userId!, courseId } },
    });
    if (!enrollment) {
      res.status(403).json({ error: 'Not enrolled in this course' });
      return;
    }

    // Add to completed lessons (avoid duplicates)
    const completed = new Set(enrollment.completedLessons);
    completed.add(param(req, 'id'));

    // Calculate progress
    const totalLessons = lesson.module.course.modules.reduce(
      (sum, m) => sum + m.lessons.length, 0
    );
    const progress = totalLessons > 0 ? (completed.size / totalLessons) * 100 : 0;

    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        completedLessons: Array.from(completed),
        progress: Math.round(progress * 100) / 100,
      },
    });

    await awardPoints(req.userId!, lesson.module.course.communityId, 10, 'Completed a lesson');

    res.json({ enrollment: updated });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reorder lessons in a module
router.put('/module/:moduleId/reorder', requireAuth, async (req: Request, res: Response) => {
  try {
    const { lessonIds } = req.body;
    const updates = (lessonIds as string[]).map((id, index) =>
      prisma.lesson.update({ where: { id }, data: { order: index } })
    );
    await prisma.$transaction(updates);
    res.json({ message: 'Lessons reordered' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
