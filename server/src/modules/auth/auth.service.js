import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error-handler.js';
import { USER_PROFILE_SELECT } from '../../lib/db-selects.js';
import { hashPassword, verifyRefreshToken } from './auth.utils.js';

export async function registerUser({ email, password, name }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email already registered', 409);

  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: { email, name, passwordHash, provider: 'LOCAL' },
  });
}

export async function resolveRefreshToken(refreshToken) {
  const payload = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new AppError('User not found', 401);
  return user;
}

export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_PROFILE_SELECT,
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function updateUserProfile(userId, data) {
  const { name, bio, avatar } = data;
  return prisma.user.update({
    where: { id: userId },
    data: { name, bio, avatar },
    select: USER_PROFILE_SELECT,
  });
}
