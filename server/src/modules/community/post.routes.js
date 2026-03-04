import { Router } from 'express';
import { z } from 'zod';
import { param, parsePagination } from '../../lib/params.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as postService from './post.service.js';

const router = Router();

const createPostSchema = z.object({
  communityId: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['DISCUSSION', 'QUESTION', 'ANNOUNCEMENT']).optional(),
});

const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  type: z.enum(['DISCUSSION', 'QUESTION', 'ANNOUNCEMENT']).optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1),
  parentId: z.string().optional().nullable(),
});

router.get('/community/:communityId', async (req, res) => {
  const pagination = parsePagination(req);
  const result = await postService.listCommunityPosts(param(req, 'communityId'), pagination);
  res.json(result);
});

router.get('/:id', optionalAuth, async (req, res) => {
  const post = await postService.getPost(param(req, 'id'), req.userId ?? null);
  res.json({ post });
});

router.post('/', requireAuth, validate(createPostSchema), async (req, res) => {
  const post = await postService.createPost(req.userId, req.body);
  res.status(201).json({ post });
});

router.put('/:id', requireAuth, validate(updatePostSchema), async (req, res) => {
  const post = await postService.updatePost(req.userId, param(req, 'id'), req.body);
  res.json({ post });
});

router.delete('/:id', requireAuth, async (req, res) => {
  await postService.deletePost(req.userId, param(req, 'id'));
  res.json({ message: 'Post deleted' });
});

router.put('/:id/pin', requireAuth, async (req, res) => {
  const post = await postService.togglePin(req.userId, param(req, 'id'));
  res.json({ post });
});

router.post('/:id/like', requireAuth, async (req, res) => {
  const result = await postService.toggleLike(req.userId, param(req, 'id'));
  res.json(result);
});

router.get('/:id/liked', requireAuth, async (req, res) => {
  const result = await postService.checkLiked(req.userId, param(req, 'id'));
  res.json(result);
});

router.post('/:id/comments', requireAuth, validate(createCommentSchema), async (req, res) => {
  const comment = await postService.addComment(req.userId, param(req, 'id'), req.body);
  res.status(201).json({ comment });
});

router.delete('/comments/:commentId', requireAuth, async (req, res) => {
  await postService.deleteComment(req.userId, param(req, 'commentId'));
  res.json({ message: 'Comment deleted' });
});

export default router;
