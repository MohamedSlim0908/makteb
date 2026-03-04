import { describe, it, expect } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
} from './auth.utils.js';

describe('auth.utils', () => {

  // ── Token generation ──────────────────────────────────────
  describe('generateAccessToken', () => {
    it('returns a JWT string', () => {
      const token = generateAccessToken({ userId: 'u1', role: 'MEMBER' });
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('embeds userId and role in the payload', () => {
      const token = generateAccessToken({ userId: 'abc123', role: 'CREATOR' });
      const payload = verifyAccessToken(token);
      expect(payload.userId).toBe('abc123');
      expect(payload.role).toBe('CREATOR');
    });

    it('generates different tokens for different users', () => {
      const t1 = generateAccessToken({ userId: 'u1', role: 'MEMBER' });
      const t2 = generateAccessToken({ userId: 'u2', role: 'MEMBER' });
      expect(t1).not.toBe(t2);
    });
  });

  describe('generateRefreshToken', () => {
    it('returns a JWT string', () => {
      const token = generateRefreshToken({ userId: 'u1', role: 'MEMBER' });
      expect(typeof token).toBe('string');
    });

    it('is verifiable with verifyRefreshToken', () => {
      const token = generateRefreshToken({ userId: 'xyz', role: 'ADMIN' });
      const payload = verifyRefreshToken(token);
      expect(payload.userId).toBe('xyz');
      expect(payload.role).toBe('ADMIN');
    });

    it('access token and refresh token are different strings', () => {
      const payload = { userId: 'u1', role: 'MEMBER' };
      expect(generateAccessToken(payload)).not.toBe(generateRefreshToken(payload));
    });
  });

  // ── Token verification ────────────────────────────────────
  describe('verifyAccessToken', () => {
    it('returns the decoded payload for a valid token', () => {
      const token = generateAccessToken({ userId: 'user1', role: 'MEMBER' });
      const result = verifyAccessToken(token);
      expect(result).toMatchObject({ userId: 'user1', role: 'MEMBER' });
    });

    it('throws for an invalid token', () => {
      expect(() => verifyAccessToken('not.a.valid.token')).toThrow();
    });

    it('throws for a token signed with the wrong secret', () => {
      const badToken = generateRefreshToken({ userId: 'u1', role: 'MEMBER' });
      expect(() => verifyAccessToken(badToken)).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('returns the decoded payload for a valid refresh token', () => {
      const token = generateRefreshToken({ userId: 'user2', role: 'CREATOR' });
      const result = verifyRefreshToken(token);
      expect(result).toMatchObject({ userId: 'user2', role: 'CREATOR' });
    });

    it('throws for a tampered token', () => {
      const token = generateRefreshToken({ userId: 'u1', role: 'MEMBER' });
      const tampered = token.slice(0, -3) + 'xxx';
      expect(() => verifyRefreshToken(tampered)).toThrow();
    });
  });

  // ── Password hashing ──────────────────────────────────────
  describe('hashPassword', () => {
    it('returns a bcrypt hash string', async () => {
      const hash = await hashPassword('password123');
      expect(typeof hash).toBe('string');
      expect(hash.startsWith('$2')).toBe(true); // bcrypt format
    });

    it('two hashes of the same password are different (salt)', async () => {
      const h1 = await hashPassword('samepassword');
      const h2 = await hashPassword('samepassword');
      expect(h1).not.toBe(h2);
    });
  });

  describe('comparePassword', () => {
    it('returns true when password matches hash', async () => {
      const hash = await hashPassword('mySecret42');
      expect(await comparePassword('mySecret42', hash)).toBe(true);
    });

    it('returns false when password does not match', async () => {
      const hash = await hashPassword('mySecret42');
      expect(await comparePassword('wrongPassword', hash)).toBe(false);
    });

    it('returns false for empty string against a valid hash', async () => {
      const hash = await hashPassword('something');
      expect(await comparePassword('', hash)).toBe(false);
    });
  });
});
