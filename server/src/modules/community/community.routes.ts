import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { param, query } from '../../lib/params';
import { requireAuth } from '../../middleware/auth';
import slugify from 'slug';

const router = Router();

// List communities (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const search = query(req, 'search');
    const page = query(req, 'page') || '1';
    const limit = query(req, 'limit') || '12';
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = { visibility: 'PUBLIC' };
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
          creator: { select: { id: true, name: true, avatar: true } },
          _count: { select: { members: true, courses: true } },
        },
      }),
      prisma.community.count({ where }),
    ]);

    res.json({ communities, total, page: parseInt(page), totalPages: Math.ceil(total / take) });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single community
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const community = await prisma.community.findUnique({
      where: { slug: param(req, 'slug') },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true, courses: true, posts: true } },
      },
    });
    if (!community) {
      res.status(404).json({ error: 'Community not found' });
      return;
    }
    res.json({ community });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create community
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, visibility, price, coverImage } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

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
        creatorId: req.userId!,
        members: {
          create: { userId: req.userId!, role: 'OWNER' },
        },
        levels: {
          createMany: {
            data: [
              { name: 'Newcomer', minPoints: 0, order: 1 },
              { name: 'Active', minPoints: 50, order: 2 },
              { name: 'Contributor', minPoints: 150, order: 3 },
              { name: 'Expert', minPoints: 500, order: 4 },
              { name: 'Legend', minPoints: 1000, order: 5 },
            ],
          },
        },
      },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true } },
      },
    });

    // Upgrade user to CREATOR role if they're a regular member
    await prisma.user.update({
      where: { id: req.userId! },
      data: { role: 'CREATOR' },
    });

    res.status(201).json({ community });
  } catch (err) {
    console.error('Create community error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update community
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const community = await prisma.community.findUnique({ where: { id: param(req, 'id') } });
    if (!community || community.creatorId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const { name, description, visibility, price, coverImage } = req.body;
    const updated = await prisma.community.update({
      where: { id: param(req, 'id') },
      data: { name, description, visibility, price, coverImage },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true, courses: true, posts: true } },
      },
    });
    res.json({ community: updated });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete community
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const community = await prisma.community.findUnique({ where: { id: param(req, 'id') } });
    if (!community || community.creatorId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    await prisma.community.delete({ where: { id: param(req, 'id') } });
    res.json({ message: 'Community deleted' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join community
router.post('/:id/join', requireAuth, async (req: Request, res: Response) => {
  try {
    const communityId = param(req, 'id');
    const existing = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: req.userId!, communityId } },
    });
    if (existing) {
      res.status(409).json({ error: 'Already a member' });
      return;
    }

    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      res.status(404).json({ error: 'Community not found' });
      return;
    }

    // If paid community, check for completed payment
    if (community.price && Number(community.price) > 0) {
      const payment = await prisma.payment.findFirst({
        where: {
          userId: req.userId!,
          type: 'COMMUNITY',
          referenceId: community.id,
          status: 'COMPLETED',
        },
      });
      if (!payment) {
        res.status(402).json({ error: 'Payment required', price: community.price });
        return;
      }
    }

    await prisma.communityMember.create({
      data: { userId: req.userId!, communityId },
    });

    res.json({ message: 'Joined community' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave community
router.delete('/:id/leave', requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.communityMember.delete({
      where: { userId_communityId: { userId: req.userId!, communityId: param(req, 'id') } },
    });
    res.json({ message: 'Left community' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get community members
router.get('/:id/members', async (req: Request, res: Response) => {
  try {
    const members = await prisma.communityMember.findMany({
      where: { communityId: param(req, 'id') },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    res.json({ members });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my membership status
router.get('/:id/membership', requireAuth, async (req: Request, res: Response) => {
  try {
    const membership = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: req.userId!, communityId: param(req, 'id') } },
    });
    res.json({ membership });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Kick/ban member
router.delete('/:id/members/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const membership = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: req.userId!, communityId: param(req, 'id') } },
    });
    if (!membership || !['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    await prisma.communityMember.delete({
      where: { userId_communityId: { userId: param(req, 'userId'), communityId: param(req, 'id') } },
    });
    res.json({ message: 'Member removed' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Promote member
router.put('/:id/members/:userId/role', requireAuth, async (req: Request, res: Response) => {
  try {
    const myMembership = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: req.userId!, communityId: param(req, 'id') } },
    });
    if (!myMembership || !['OWNER', 'ADMIN'].includes(myMembership.role)) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const { role } = req.body;
    const updated = await prisma.communityMember.update({
      where: { userId_communityId: { userId: param(req, 'userId'), communityId: param(req, 'id') } },
      data: { role },
    });
    res.json({ membership: updated });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
