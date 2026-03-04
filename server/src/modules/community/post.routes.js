import { Router } from 'express';
import { param, query } from '../../lib/params.js';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { getIO } from '../../lib/socket.js';
import { awardPoints } from '../gamification/gamification.service.js';

const router = Router();

// Get posts for a community (mounted at /api/communities/:communityId/posts via main community router)
// But we also mount at /api/posts for post-specific operations
router.get('/community/:communityId', async (req, res) => {
  try {
    const page = query(req, 'page') ?? '1';
    const limit = query(req, 'limit') ?? '20';
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { communityId: param(req, 'communityId') },
        skip,
        take,
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          _count: { select: { comments: true, likes: true } },
        },
      }),
      prisma.post.count({ where: { communityId: param(req, 'communityId') } }),
    ]);

    res.json({ posts, total, page: parseInt(page), totalPages: Math.ceil(total / take) });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: param(req, 'id') },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, avatar: true } },
            replies: {
              orderBy: { createdAt: 'asc' },
              include: { author: { select: { id: true, name: true, avatar: true } } },
            },
          },
        },
        _count: { select: { comments: true, likes: true } },
      },
    });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json({ post });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create post
router.post('/', requireAuth, async (req, res) => {
  try {
    const { communityId, title, content, type } = req.body;
    if (!communityId || !title || !content) {
      res.status(400).json({ error: 'communityId, title, and content are required' });
      return;
    }

    const membership = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: req.userId, communityId } },
    });
    if (!membership) {
      res.status(403).json({ error: 'Must be a member to post' });
      return;
    }

    const post = await prisma.post.create({
      data: {
        communityId,
        authorId: req.userId,
        title,
        content,
        type: type || 'DISCUSSION',
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });

    await awardPoints(req.userId, communityId, 5, 'Created a post');

    getIO().to(`community:${communityId}`).emit('post:created', post);

    res.status(201).json({ post });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update post
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: param(req, 'id') } });
    if (!post || post.authorId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const { title, content, type } = req.body;
    const updated = await prisma.post.update({
      where: { id: param(req, 'id') },
      data: { title, content, type },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });
    res.json({ post: updated });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete post
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: param(req, 'id') } });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Allow author or community admin/owner to delete
    if (post.authorId !== req.userId) {
      const membership = await prisma.communityMember.findUnique({
        where: { userId_communityId: { userId: req.userId, communityId: post.communityId } },
      });
      if (!membership || !['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }
    }

    await prisma.post.delete({ where: { id: param(req, 'id') } });
    getIO().to(`community:${post.communityId}`).emit('post:deleted', { id: param(req, 'id') });
    res.json({ message: 'Post deleted' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pin/unpin post
router.put('/:id/pin', requireAuth, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: param(req, 'id') } });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const membership = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: req.userId, communityId: post.communityId } },
    });
    if (!membership || !['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const updated = await prisma.post.update({
      where: { id: param(req, 'id') },
      data: { pinned: !post.pinned },
    });
    res.json({ post: updated });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Like/unlike post
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId: param(req, 'id'), userId: req.userId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      res.json({ liked: false });
    } else {
      await prisma.like.create({ data: { postId: param(req, 'id'), userId: req.userId } });

      const post = await prisma.post.findUnique({ where: { id: param(req, 'id') } });
      if (post) {
        await awardPoints(req.userId, post.communityId, 1, 'Liked a post');
      }

      res.json({ liked: true });
    }
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if user liked a post
router.get('/:id/liked', requireAuth, async (req, res) => {
  try {
    const like = await prisma.like.findUnique({
      where: { postId_userId: { postId: param(req, 'id'), userId: req.userId } },
    });
    res.json({ liked: !!like });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add comment
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { content, parentId } = req.body;
    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const post = await prisma.post.findUnique({ where: { id: param(req, 'id') } });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        postId: param(req, 'id'),
        authorId: req.userId,
        content,
        parentId: parentId || null,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    await awardPoints(req.userId, post.communityId, 2, 'Commented on a post');

    getIO().to(`community:${post.communityId}`).emit('comment:created', { postId: post.id, comment });

    res.status(201).json({ comment });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete comment
router.delete('/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: param(req, 'commentId') } });
    if (!comment || comment.authorId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    await prisma.comment.delete({ where: { id: param(req, 'commentId') } });
    res.json({ message: 'Comment deleted' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
