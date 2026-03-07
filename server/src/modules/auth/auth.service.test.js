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
  comparePassword: vi.fn(),
  hashPassword: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

import { prisma } from '../../lib/prisma.js';
import { comparePassword, hashPassword, verifyRefreshToken } from './auth.utils.js';
import {
  registerUser,
  resolveRefreshToken,
  getCurrentUser,
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
} from './auth.service.js';

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

describe('updateUserEmail()', () => {
  it('updates email after verifying current password', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce(MOCK_USER)
      .mockResolvedValueOnce(null);
    comparePassword.mockResolvedValue(true);
    prisma.user.update.mockResolvedValue({ ...MOCK_USER, email: 'new@makteb.tn' });

    const result = await updateUserEmail('user-1', {
      email: 'new@makteb.tn',
      currentPassword: 'secret123',
    });

    expect(comparePassword).toHaveBeenCalledWith('secret123', MOCK_USER.passwordHash);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { email: 'new@makteb.tn' },
      select: { id: true, email: true, name: true, role: true, avatar: true, bio: true },
    });
    expect(result.email).toBe('new@makteb.tn');
  });

  it('throws when email is already registered', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce(MOCK_USER)
      .mockResolvedValueOnce({ id: 'user-2', email: 'new@makteb.tn' });
    comparePassword.mockResolvedValue(true);

    await expect(
      updateUserEmail('user-1', { email: 'new@makteb.tn', currentPassword: 'secret123' })
    ).rejects.toThrow('Email already registered');
  });
});

describe('updateUserPassword()', () => {
  it('updates password when current password is valid', async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER);
    comparePassword
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    hashPassword.mockResolvedValue('$2b$12$newhash');

    await updateUserPassword('user-1', {
      currentPassword: 'secret123',
      newPassword: 'newpassword123',
    });

    expect(hashPassword).toHaveBeenCalledWith('newpassword123');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { passwordHash: '$2b$12$newhash' },
    });
  });

  it('throws when the new password matches the current password', async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER);
    comparePassword
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);

    await expect(
      updateUserPassword('user-1', {
        currentPassword: 'secret123',
        newPassword: 'secret123',
      })
    ).rejects.toThrow('New password must be different');
  });
});
