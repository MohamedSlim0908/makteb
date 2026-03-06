import { prisma } from '../../lib/prisma.js';
import { getIO } from '../../lib/socket.js';
import { AppError } from '../../middleware/error-handler.js';
import { USER_PUBLIC_SELECT, MODERATOR_ROLES } from '../../lib/db-selects.js';
import { awardPoints } from '../gamification/gamification.service.js';
import { sendNotification } from '../notifications/notification.service.js';

export async function listCommunityPosts(communityId, { skip, take, page, category, viewerUserId }) {
  const where = { communityId };
  if (category && category !== 'ALL') {
    where.category = category;
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take,
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: { select: USER_PUBLIC_SELECT },
        _count: { select: { comments: true, likes: true } },
        ...(viewerUserId
          ? {
              likes: {
                where: { userId: viewerUserId },
                select: { id: true },
              },
            }
          : {}),
      },
    }),
    prisma.post.count({ where }),
  ]);
  const mapped = posts.map(({ _count, likes, ...rest }) => ({
    ...rest,
    likeCount: _count.likes,
    commentCount: _count.comments,
    isLiked: Array.isArray(likes) ? likes.length > 0 : false,
  }));
  return { posts: mapped, total, page, totalPages: Math.ceil(total / take) };
}

export async function getPost(postId, viewerUserId = null) {
  const [post, isLiked] = await Promise.all([
    prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: USER_PUBLIC_SELECT },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: USER_PUBLIC_SELECT },
            replies: {
              orderBy: { createdAt: 'asc' },
              include: { author: { select: USER_PUBLIC_SELECT } },
            },
          },
        },
        _count: { select: { comments: true, likes: true } },
      },
    }),
    viewerUserId
      ? prisma.like.findUnique({ where: { postId_userId: { postId, userId: viewerUserId } } })
      : Promise.resolve(null),
  ]);

  if (!post) throw new AppError('Post not found', 404);

  const { _count, ...rest } = post;
  return {
    ...rest,
    likeCount: _count.likes,
    commentCount: _count.comments,
    isLiked: !!isLiked,
  };
}

export async function createPost(authorId, { communityId, title, content, type, category }) {
  const membership = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: authorId, communityId } },
  });
  if (!membership) throw new AppError('Must be a member to post', 403);

  const post = await prisma.post.create({
    data: {
      communityId,
      authorId,
      title,
      content,
      type: type || 'DISCUSSION',
      category: category || 'GENERAL',
    },
    include: {
      author: { select: USER_PUBLIC_SELECT },
      _count: { select: { comments: true, likes: true } },
    },
  });

  await awardPoints(authorId, communityId, 5, 'Created a post');
  getIO().to(`community:${communityId}`).emit('post:created', post);

  return post;
}

export async function updatePost(authorId, postId, data) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.authorId !== authorId) throw new AppError('Not authorized', 403);

  const { title, content, type, category } = data;
  return prisma.post.update({
    where: { id: postId },
    data: { title, content, type, category },
    include: {
      author: { select: USER_PUBLIC_SELECT },
      _count: { select: { comments: true, likes: true } },
    },
  });
}

export async function deletePost(actorId, postId) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError('Post not found', 404);

  if (post.authorId !== actorId) {
    const membership = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: actorId, communityId: post.communityId } },
    });
    if (!membership || !MODERATOR_ROLES.includes(membership.role)) {
      throw new AppError('Not authorized', 403);
    }
  }

  await prisma.post.delete({ where: { id: postId } });
  getIO().to(`community:${post.communityId}`).emit('post:deleted', { id: postId });
}

export async function togglePin(actorId, postId) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError('Post not found', 404);

  const membership = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: actorId, communityId: post.communityId } },
  });
  if (!membership || !MODERATOR_ROLES.includes(membership.role)) {
    throw new AppError('Not authorized', 403);
  }

  return prisma.post.update({ where: { id: postId }, data: { pinned: !post.pinned } });
}

export async function toggleLike(userId, postId) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError('Post not found', 404);

  const membership = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId, communityId: post.communityId } },
  });
  if (!membership) throw new AppError('Must be a member to like posts', 403);

  const existingLike = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existingLike) {
    await prisma.like.delete({ where: { id: existingLike.id } });
    return { liked: false };
  }

  await prisma.like.create({ data: { postId, userId } });
  await awardPoints(userId, post.communityId, 1, 'Liked a post');

  if (post.authorId !== userId) {
    await sendNotification(post.authorId, {
      title: 'Someone liked your post',
      body: `Your post "${post.title}" received a new like`,
      link: `/community/${post.communityId}/post/${postId}`,
    });
  }

  return { liked: true };
}

export async function checkLiked(userId, postId) {
  const like = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  return { liked: !!like };
}

export async function addComment(authorId, postId, { content, parentId }) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError('Post not found', 404);

  const membership = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: authorId, communityId: post.communityId } },
  });
  if (!membership) throw new AppError('Must be a member to comment', 403);

  const comment = await prisma.comment.create({
    data: { postId, authorId, content, parentId: parentId || null },
    include: { author: { select: USER_PUBLIC_SELECT } },
  });

  await awardPoints(authorId, post.communityId, 2, 'Commented on a post');
  getIO().to(`community:${post.communityId}`).emit('comment:created', { postId, comment });

  if (post.authorId !== authorId) {
    await sendNotification(post.authorId, {
      title: 'New comment on your post',
      body: `Someone commented on "${post.title}"`,
      link: `/community/${post.communityId}/post/${postId}`,
    });
  }

  return comment;
}

export async function deleteComment(authorId, commentId) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.authorId !== authorId) throw new AppError('Not authorized', 403);
  await prisma.comment.delete({ where: { id: commentId } });
}
