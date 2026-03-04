import { describe, it, expect, vi } from 'vitest';
import { requireAuth, requireRole } from './auth.js';
import { generateAccessToken } from '../modules/auth/auth.utils.js';

// Helper to create mock Express req/res/next
function mockContext({ headers = {}, userId = undefined, userRole = undefined } = {}) {
  const req = { headers, userId, userRole };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

describe('requireAuth middleware', () => {
  it('calls next() for a valid Bearer token', () => {
    const token = generateAccessToken({ userId: 'u1', role: 'MEMBER' });
    const { req, res, next } = mockContext({
      headers: { authorization: `Bearer ${token}` },
    });

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBe('u1');
    expect(req.userRole).toBe('MEMBER');
  });

  it('responds 401 when Authorization header is missing', () => {
    const { req, res, next } = mockContext({ headers: {} });

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 when header does not start with Bearer', () => {
    const { req, res, next } = mockContext({
      headers: { authorization: 'Basic dXNlcjpwYXNz' },
    });

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 for an expired / invalid token', () => {
    const { req, res, next } = mockContext({
      headers: { authorization: 'Bearer this.is.fake' },
    });

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('sets userId and userRole from the token payload', () => {
    const token = generateAccessToken({ userId: 'creator99', role: 'CREATOR' });
    const { req, res, next } = mockContext({
      headers: { authorization: `Bearer ${token}` },
    });

    requireAuth(req, res, next);

    expect(req.userId).toBe('creator99');
    expect(req.userRole).toBe('CREATOR');
  });
});

describe('requireRole middleware', () => {
  it('calls next() when userRole is in the allowed list', () => {
    const { req, res, next } = mockContext({ userRole: 'ADMIN' });

    requireRole('ADMIN', 'CREATOR')({ ...req, userRole: 'ADMIN' }, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('responds 403 when userRole is not in the allowed list', () => {
    const { req, res, next } = mockContext({ userRole: 'MEMBER' });

    requireRole('ADMIN')({ ...req, userRole: 'MEMBER' }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 403 when userRole is undefined', () => {
    const { req, res, next } = mockContext();

    requireRole('CREATOR')({ ...req, userRole: undefined }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows multiple roles in the list', () => {
    const { res, next } = mockContext();

    // CREATOR is allowed
    requireRole('CREATOR', 'ADMIN')({ userRole: 'CREATOR' }, res, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
