import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    post: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    communityMember: {
      findUnique: vi.fn(),
    },
    like: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    comment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../../lib/socket.js', () => ({
  getIO: vi.fn(() => ({
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
  })),
}));

vi.mock('../../lib/db-selects.js', () => ({
  USER_PUBLIC_SELECT: { id: true, name: true, avatar: true },
  MODERATOR_ROLES: ['OWNER', 'ADMIN', 'MODERATOR'],
}));

vi.mock('../gamification/gamification.service.js', () => ({
  awardPoints: vi.fn().mockResolvedValue({}),
}));

vi.mock('../notifications/notification.service.js', () => ({
  sendNotification: vi.fn().mockResolvedValue({}),
}));

import { prisma } from '../../lib/prisma.js';
import {
  listCommunityPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  togglePin,
  toggleLike,
  addComment,
  deleteComment,
} from './post.service.js';
import { awardPoints } from '../gamification/gamification.service.js';

beforeEach(() => vi.clearAllMocks());

const POST = {
  id: 'post-1',
  communityId: 'com-1',
  authorId: 'user-1',
  title: 'Test Post',
  content: 'Content here',
  type: 'DISCUSSION',
  pinned: false,
  author: { id: 'user-1', name: 'Ali', avatar: null },
  _count: { comments: 2, likes: 5 },
};

// ── listCommunityPosts ─────────────────────────────────────
describe('listCommunityPosts()', () => {
  it('returns paginated posts with likes/comments count', async () => {
    prisma.post.findMany.mockResolvedValue([{ ...POST, likes: [] }]);
    prisma.post.count.mockResolvedValue(1);

    const result = await listCommunityPosts('com-1', { skip: 0, take: 20, page: 1, viewerUserId: 'user-1' });

    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].likeCount).toBe(5);
    expect(result.posts[0].commentCount).toBe(2);
    expect(result.posts[0].isLiked).toBe(false);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('sets isLiked to true when viewer has liked', async () => {
    prisma.post.findMany.mockResolvedValue([{ ...POST, likes: [{ id: 'like-1' }] }]);
    prisma.post.count.mockResolvedValue(1);

    const result = await listCommunityPosts('com-1', { skip: 0, take: 20, page: 1, viewerUserId: 'user-1' });

    expect(result.posts[0].isLiked).toBe(true);
  });

  it('applies category filter', async () => {
    prisma.post.findMany.mockResolvedValue([]);
    prisma.post.count.mockResolvedValue(0);

    await listCommunityPosts('com-1', { skip: 0, take: 20, page: 1, category: 'WINS' });

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ communityId: 'com-1', category: 'WINS' }),
      })
    );
  });

  it('does not filter by category when ALL', async () => {
    prisma.post.findMany.mockResolvedValue([]);
    prisma.post.count.mockResolvedValue(0);

    await listCommunityPosts('com-1', { skip: 0, take: 20, page: 1, category: 'ALL' });

    const where = prisma.post.findMany.mock.calls[0][0].where;
    expect(where.category).toBeUndefined();
  });

  it('orders by pinned desc then createdAt desc', async () => {
    prisma.post.findMany.mockResolvedValue([]);
    prisma.post.count.mockResolvedValue(0);

    await listCommunityPosts('com-1', { skip: 0, take: 20, page: 1 });

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      })
    );
  });
});

// ── getPost ─────────────────────────────────────────────────
describe('getPost()', () => {
  it('returns post with nested comments', async () => {
    const postWithComments = {
      ...POST,
      comments: [{ id: 'c1', content: 'Nice', replies: [] }],
    };
    prisma.post.findUnique.mockResolvedValue(postWithComments);

    const result = await getPost('post-1');

    expect(result.id).toBe('post-1');
    expect(result.likeCount).toBe(5);
    expect(result.commentCount).toBe(2);
  });

  it('throws 404 when post not found', async () => {
    prisma.post.findUnique.mockResolvedValue(null);

    await expect(getPost('unknown')).rejects.toThrow('Post not found');
  });

  it('checks isLiked when viewerUserId is provided', async () => {
    prisma.post.findUnique.mockResolvedValue(POST);
    prisma.like.findUnique.mockResolvedValue({ id: 'like-1' });

    const result = await getPost('post-1', 'user-1');

    expect(result.isLiked).toBe(true);
  });
});

// ── createPost ──────────────────────────────────────────────
describe('createPost()', () => {
  it('creates a post when user is a member', async () => {
    prisma.communityMember.findUnique.mockResolvedValue({ id: 'mem-1', role: 'MEMBER' });
    prisma.post.create.mockResolvedValue(POST);

    const result = await createPost('user-1', {
      communityId: 'com-1',
      title: 'Test Post',
      content: 'Content here',
    });

    expect(prisma.post.create).toHaveBeenCalled();
    expect(awardPoints).toHaveBeenCalledWith('user-1', 'com-1', 5, 'Created a post');
    expect(result).toEqual(POST);
  });

  it('throws 403 when user is not a member', async () => {
    prisma.communityMember.findUnique.mockResolvedValue(null);

    await expect(createPost('user-1', { communityId: 'com-1', title: 'T', content: 'C' }))
      .rejects.toThrow('Must be a member to post');
  });

  it('defaults type to DISCUSSION and category to GENERAL', async () => {
    prisma.communityMember.findUnique.mockResolvedValue({ id: 'mem-1' });
    prisma.post.create.mockResolvedValue(POST);

    await createPost('user-1', { communityId: 'com-1', title: 'T', content: 'C' });

    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'DISCUSSION', category: 'GENERAL' }),
      })
    );
  });
});

// ── updatePost ──────────────────────────────────────────────
describe('updatePost()', () => {
  it('updates when user is the author', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'post-1', authorId: 'user-1' });
    prisma.post.update.mockResolvedValue({ ...POST, title: 'Updated' });

    const result = await updatePost('user-1', 'post-1', { title: 'Updated' });

    expect(result.title).toBe('Updated');
  });

  it('throws 403 when user is not the author', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'post-1', authorId: 'other-user' });

    await expect(updatePost('user-1', 'post-1', { title: 'Hack' }))
      .rejects.toThrow('Not authorized');
  });

  it('throws 403 when post not found', async () => {
    prisma.post.findUnique.mockResolvedValue(null);

    await expect(updatePost('user-1', 'unknown', {})).rejects.toThrow('Not authorized');
  });
});

// ── deletePost ──────────────────────────────────────────────
describe('deletePost()', () => {
  it('author can delete their own post', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'post-1', authorId: 'user-1', communityId: 'com-1' });
    prisma.post.delete.mockResolvedValue({});

    await deletePost('user-1', 'post-1');

    expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: 'post-1' } });
  });

  it('moderator can delete any post', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'post-1', authorId: 'other-user', communityId: 'com-1' });
    prisma.communityMember.findUnique.mockResolvedValue({ role: 'MODERATOR' });
    prisma.post.delete.mockResolvedValue({});

    await deletePost('mod-1', 'post-1');

    expect(prisma.post.delete).toHaveBeenCalled();
  });

  it('throws 403 when non-author non-mod tries to delete', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'post-1', authorId: 'other-user', communityId: 'com-1' });
    prisma.communityMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

    await expect(deletePost('user-1', 'post-1')).rejects.toThrow('Not authorized');
  });

  it('throws 404 when post not found', async () => {
    prisma.post.findUnique.mockResolvedValue(null);

    await expect(deletePost('user-1', 'unknown')).rejects.toThrow('Post not found');
  });
});

// ── togglePin ───────────────────────────────────────────────
describe('togglePin()', () => {
  it('toggles pin status when user is moderator', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'post-1', pinned: false, communityId: 'com-1' });
    prisma.communityMember.findUnique.mockResolvedValue({ role: 'OWNER' });
    prisma.post.update.mockResolvedValue({ id: 'post-1', pinned: true });

    const result = await togglePin('owner-1', 'post-1');

    expect(prisma.post.update).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: { pinned: true },
    });
    expect(result.pinned).toBe(true);
  });

  it('throws 403 when user is not moderator', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'post-1', communityId: 'com-1' });
    prisma.communityMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

    await expect(togglePin('user-1', 'post-1')).rejects.toThrow('Not authorized');
  });

  it('throws 404 when post not found', async () => {
    prisma.post.findUnique.mockResolvedValue(null);

    await expect(togglePin('user-1', 'unknown')).rejects.toThrow('Post not found');
  });
});

// ── toggleLike ──────────────────────────────────────────────
describe('toggleLike()', () => {
  it('creates like when not already liked', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'post-1', communityId: 'com-1' });
    prisma.communityMember.findUnique.mockResolvedValue({ id: 'mem-1' });
    prisma.like.findUnique.mockResolvedValue(null);
    prisma.like.create.mockResolvedValue({});

    const result = await toggleLike('user-1', 'post-1');

    expect(result.liked).toBe(true);
    expect(prisma.like.create).toHaveBeenCalledWith({ data: { postId: 'post-1', userId: 'user-1' } });
    expect(awardPoints).toHaveBeenCalledWith('user-1', 'com-1', 1, 'Liked a post');
  });

  it('removes like when already liked (toggle off)', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'post-1', communityId: 'com-1' });
    prisma.communityMember.findUnique.mockResolvedValue({ id: 'mem-1' });
    prisma.like.findUnique.mockResolvedValue({ id: 'like-1' });
    prisma.like.delete.mockResolvedValue({});

    const result = await toggleLike('user-1', 'post-1');

    expect(result.liked).toBe(false);
    expect(prisma.like.delete).toHaveBeenCalledWith({ where: { id: 'like-1' } });
  });

  it('throws 403 when not a member', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'post-1', communityId: 'com-1' });
    prisma.communityMember.findUnique.mockResolvedValue(null);

    await expect(toggleLike('user-1', 'post-1')).rejects.toThrow('Must be a member to like posts');
  });

  it('throws 404 when post not found', async () => {
    prisma.post.findUnique.mockResolvedValue(null);

    await expect(toggleLike('user-1', 'unknown')).rejects.toThrow('Post not found');
  });
});

// ── addComment ──────────────────────────────────────────────
describe('addComment()', () => {
  it('creates a comment on a post', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'post-1', communityId: 'com-1' });
    prisma.communityMember.findUnique.mockResolvedValue({ id: 'mem-1' });
    prisma.comment.create.mockResolvedValue({
      id: 'com-1',
      content: 'Nice post!',
      postId: 'post-1',
      authorId: 'user-1',
      parentId: null,
    });

    const result = await addComment('user-1', 'post-1', { content: 'Nice post!' });

    expect(result.content).toBe('Nice post!');
    expect(awardPoints).toHaveBeenCalledWith('user-1', 'com-1', 2, 'Commented on a post');
  });

  it('creates a nested reply with parentId', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'post-1', communityId: 'com-1' });
    prisma.communityMember.findUnique.mockResolvedValue({ id: 'mem-1' });
    prisma.comment.create.mockResolvedValue({
      id: 'rep-1',
      content: 'Thanks!',
      parentId: 'com-1',
    });

    const result = await addComment('user-1', 'post-1', { content: 'Thanks!', parentId: 'com-1' });

    expect(result.parentId).toBe('com-1');
    expect(prisma.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ parentId: 'com-1' }),
      })
    );
  });

  it('throws 404 when post not found', async () => {
    prisma.post.findUnique.mockResolvedValue(null);

    await expect(addComment('user-1', 'unknown', { content: 'Hi' }))
      .rejects.toThrow('Post not found');
  });

  it('throws 403 when not a member', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'post-1', communityId: 'com-1' });
    prisma.communityMember.findUnique.mockResolvedValue(null);

    await expect(addComment('user-1', 'post-1', { content: 'Hi' }))
      .rejects.toThrow('Must be a member to comment');
  });
});

// ── deleteComment ───────────────────────────────────────────
describe('deleteComment()', () => {
  it('deletes comment when user is the author', async () => {
    prisma.comment.findUnique.mockResolvedValue({ id: 'c1', authorId: 'user-1' });
    prisma.comment.delete.mockResolvedValue({});

    await deleteComment('user-1', 'c1');

    expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });

  it('throws 403 when user is not the author', async () => {
    prisma.comment.findUnique.mockResolvedValue({ id: 'c1', authorId: 'other-user' });

    await expect(deleteComment('user-1', 'c1')).rejects.toThrow('Not authorized');
  });

  it('throws 403 when comment not found', async () => {
    prisma.comment.findUnique.mockResolvedValue(null);

    await expect(deleteComment('user-1', 'unknown')).rejects.toThrow('Not authorized');
  });
});
