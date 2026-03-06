import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../../lib/db-selects.js', () => ({
  USER_PROFILE_SELECT: { id: true, email: true, name: true, role: true, avatar: true, bio: true },
}));

vi.mock('./auth.utils.js', () => ({
  hashPassword: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyRefreshToken } from './auth.utils.js';
import { registerUser, resolveRefreshToken, getCurrentUser, updateUserProfile } from './auth.service.js';

beforeEach(() => vi.clearAllMocks());

const MOCK_USER = {
  id: 'user-1',
  email: 'ali@makteb.tn',
  name: 'Ali Ben Salah',
  role: 'MEMBER',
  avatar: null,
  bio: null,
  passwordHash: '$2b$12$hashedvalue',
  provider: 'LOCAL',
};

// ── registerUser ──────────────────────────────────────────
describe('registerUser()', () => {
  it('creates a new user when email is not taken', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    hashPassword.mockResolvedValue('$2b$12$hashedvalue');
    prisma.user.create.mockResolvedValue(MOCK_USER);

    const result = await registerUser({ email: 'ali@makteb.tn', password: 'secret123', name: 'Ali Ben Salah' });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'ali@makteb.tn' } });
    expect(hashPassword).toHaveBeenCalledWith('secret123');
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: 'ali@makteb.tn', name: 'Ali Ben Salah', passwordHash: '$2b$12$hashedvalue', provider: 'LOCAL' },
    });
    expect(result).toEqual(MOCK_USER);
  });

  it('throws 409 when email is already registered', async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER);

    await expect(registerUser({ email: 'ali@makteb.tn', password: 'secret', name: 'Ali' }))
      .rejects.toThrow('Email already registered');
  });
});

// ── resolveRefreshToken ───────────────────────────────────
describe('resolveRefreshToken()', () => {
  it('returns user when refresh token is valid', async () => {
    verifyRefreshToken.mockReturnValue({ userId: 'user-1', role: 'MEMBER' });
    prisma.user.findUnique.mockResolvedValue(MOCK_USER);

    const result = await resolveRefreshToken('valid-token');

    expect(verifyRefreshToken).toHaveBeenCalledWith('valid-token');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(result).toEqual(MOCK_USER);
  });

  it('throws 401 when user is not found', async () => {
    verifyRefreshToken.mockReturnValue({ userId: 'deleted-user', role: 'MEMBER' });
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(resolveRefreshToken('valid-token')).rejects.toThrow('User not found');
  });

  it('throws when token is invalid', async () => {
    verifyRefreshToken.mockImplementation(() => { throw new Error('invalid token'); });

    await expect(resolveRefreshToken('bad-token')).rejects.toThrow('invalid token');
  });
});

// ── getCurrentUser ────────────────────────────────────────
describe('getCurrentUser()', () => {
  it('returns user profile when found', async () => {
    const profile = { id: 'user-1', email: 'ali@makteb.tn', name: 'Ali', role: 'MEMBER', avatar: null, bio: null };
    prisma.user.findUnique.mockResolvedValue(profile);

    const result = await getCurrentUser('user-1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { id: true, email: true, name: true, role: true, avatar: true, bio: true },
    });
    expect(result).toEqual(profile);
  });

  it('throws 404 when user is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(getCurrentUser('unknown')).rejects.toThrow('User not found');
  });
});

// ── updateUserProfile ─────────────────────────────────────
describe('updateUserProfile()', () => {
  it('updates name, bio, and avatar', async () => {
    const updated = { id: 'user-1', email: 'ali@makteb.tn', name: 'Ali Updated', role: 'MEMBER', avatar: 'img.png', bio: 'Coach' };
    prisma.user.update.mockResolvedValue(updated);

    const result = await updateUserProfile('user-1', { name: 'Ali Updated', bio: 'Coach', avatar: 'img.png' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'Ali Updated', bio: 'Coach', avatar: 'img.png' },
      select: { id: true, email: true, name: true, role: true, avatar: true, bio: true },
    });
    expect(result.name).toBe('Ali Updated');
    expect(result.bio).toBe('Coach');
  });

  it('handles partial updates (only name)', async () => {
    const updated = { id: 'user-1', name: 'New Name', bio: null, avatar: null };
    prisma.user.update.mockResolvedValue(updated);

    const result = await updateUserProfile('user-1', { name: 'New Name' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'New Name' }),
      })
    );
    expect(result.name).toBe('New Name');
  });
});
