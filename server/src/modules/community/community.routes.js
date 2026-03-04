import { Router } from 'express';
import { z } from 'zod';
import { param, parsePagination } from '../../lib/params.js';
import { query } from '../../lib/params.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as communityService from './community.service.js';

const router = Router();

const createCommunitySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  price: z.number().positive().optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
});

const updateCommunitySchema = createCommunitySchema.partial();

router.get('/', async (req, res) => {
  const search = query(req, 'search');
  const pagination = parsePagination(req, 12);
  const result = await communityService.listCommunities({ search, ...pagination });
  res.json(result);
});

router.get('/:slug', async (req, res) => {
  const community = await communityService.getCommunityBySlug(param(req, 'slug'));
  res.json({ community });
});

router.post('/', requireAuth, validate(createCommunitySchema), async (req, res) => {
  const community = await communityService.createCommunity(req.userId, req.body);
  res.status(201).json({ community });
});

router.put('/:id', requireAuth, validate(updateCommunitySchema), async (req, res) => {
  const community = await communityService.updateCommunity(req.userId, param(req, 'id'), req.body);
  res.json({ community });
});

router.delete('/:id', requireAuth, async (req, res) => {
  await communityService.deleteCommunity(req.userId, param(req, 'id'));
  res.json({ message: 'Community deleted' });
});

router.post('/:id/join', requireAuth, async (req, res) => {
  await communityService.joinCommunity(req.userId, param(req, 'id'));
  res.json({ message: 'Joined community' });
});

router.delete('/:id/leave', requireAuth, async (req, res) => {
  await communityService.leaveCommunity(req.userId, param(req, 'id'));
  res.json({ message: 'Left community' });
});

router.get('/:id/members', async (req, res) => {
  const members = await communityService.getCommunityMembers(param(req, 'id'));
  res.json({ members });
});

router.get('/:id/membership', requireAuth, async (req, res) => {
  const membership = await communityService.getMembershipStatus(req.userId, param(req, 'id'));
  res.json({ membership });
});

router.delete('/:id/members/:userId', requireAuth, async (req, res) => {
  await communityService.removeMember(req.userId, param(req, 'id'), param(req, 'userId'));
  res.json({ message: 'Member removed' });
});

router.put('/:id/members/:userId/role', requireAuth, async (req, res) => {
  const membership = await communityService.updateMemberRole(
    req.userId,
    param(req, 'id'),
    param(req, 'userId'),
    req.body.role
  );
  res.json({ membership });
});

export default router;
