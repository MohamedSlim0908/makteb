import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error-handler.js';
import { USER_PROFILE_SELECT } from '../../lib/db-selects.js';
import { comparePassword, hashPassword, verifyRefreshToken } from './auth.utils.js';

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

async function getUserAuthRecord(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      provider: true,
    },
  });

  if (!user) throw new AppError('User not found', 404);

  return user;
}

async function verifyCurrentPassword(user, currentPassword) {
  if (!user.passwordHash) {
    throw new AppError('This account does not support password-based credential changes', 400);
  }

  if (!currentPassword) {
    throw new AppError('Current password is required', 400);
  }

  const isValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isValid) throw new AppError('Current password is incorrect', 401);
}

export async function updateUserEmail(userId, { email, currentPassword }) {
  const user = await getUserAuthRecord(userId);
  const normalizedEmail = email.trim().toLowerCase();

  await verifyCurrentPassword(user, currentPassword);

  if (normalizedEmail === user.email) {
    return getCurrentUser(userId);
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing && existing.id !== userId) {
    throw new AppError('Email already registered', 409);
  }

  return prisma.user.update({
    where: { id: userId },
    data: { email: normalizedEmail },
    select: USER_PROFILE_SELECT,
  });
}

export async function updateUserPassword(userId, { currentPassword, newPassword }) {
  const user = await getUserAuthRecord(userId);

  await verifyCurrentPassword(user, currentPassword);

  const isSamePassword = await comparePassword(newPassword, user.passwordHash);
  if (isSamePassword) {
    throw new AppError('New password must be different from your current password', 400);
  }

  const nextPasswordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: nextPasswordHash },
  });
}
