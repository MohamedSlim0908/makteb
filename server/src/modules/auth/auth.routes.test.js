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

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => {
    req.userId = 'user-test';
    next();
  },
  requireRole: () => (_req, _res, next) => next(),
}));

// Mock passport — authenticate returns a no-op middleware for OAuth routes
vi.mock('passport', () => {
  const mockMiddleware = (_req, _res, next) => next && next();
  const authenticate = vi.fn(() => mockMiddleware);
  return {
    default: {
      initialize: () => (_req, _res, next) => next(),
      authenticate,
    },
  };
});

import { prisma } from '../../lib/prisma.js';
import passport from 'passport';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import router from './auth.routes.js';
import { generateRefreshToken } from './auth.utils.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/', router);
  return app;
}

const MOCK_USER = {
  id: 'user-1',
  email: 'ali@makteb.tn',
  name: 'Ali Ben Salah',
  role: 'MEMBER',
  avatar: null,
  bio: null,
  passwordHash: '$2b$12$dummyhashvalue',
};

beforeEach(() => vi.clearAllMocks());

// ── POST /register ────────────────────────────────────────
describe('POST /register', () => {
  it('creates a new user and returns 201 with accessToken', async () => {
    prisma.user.findUnique.mockResolvedValue(null); // no existing user
    prisma.user.create.mockResolvedValue(MOCK_USER);

    const res = await request(buildApp())
      .post('/register')
      .send({ email: 'ali@makteb.tn', password: 'secret123', name: 'Ali Ben Salah' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('ali@makteb.tn');
    expect(res.body.accessToken).toBeDefined();
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(buildApp())
      .post('/register')
      .send({ email: 'ali@makteb.tn' }); // missing name and password

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 409 when email is already registered', async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER); // user already exists

    const res = await request(buildApp())
      .post('/register')
      .send({ email: 'ali@makteb.tn', password: 'pass', name: 'Ali' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already/i);
  });

  it('sets a refreshToken cookie on success', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(MOCK_USER);

    const res = await request(buildApp())
      .post('/register')
      .send({ email: 'new@makteb.tn', password: 'pass', name: 'New' });

    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/refreshToken/);
  });
});

// ── POST /login ───────────────────────────────────────────
describe('POST /login', () => {
  it('returns user and accessToken on valid credentials', async () => {
    passport.authenticate.mockImplementation((_strategy, _opts, cb) =>
      (_req, _res, _next) => cb(null, MOCK_USER, null)
    );

    const res = await request(buildApp())
      .post('/login')
      .send({ email: 'ali@makteb.tn', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe('user-1');
    expect(res.body.accessToken).toBeDefined();
  });

  it('returns 401 on invalid credentials', async () => {
    passport.authenticate.mockImplementation((_strategy, _opts, cb) =>
      (_req, _res, _next) => cb(null, false, { message: 'Invalid email or password' })
    );

    const res = await request(buildApp())
      .post('/login')
      .send({ email: 'bad@email.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });
});

// ── POST /refresh ──────────────────────────────────────────
describe('POST /refresh', () => {
  it('returns new accessToken for a valid refresh cookie', async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER);
    const refreshToken = generateRefreshToken({ userId: 'user-1', role: 'MEMBER' });

    const res = await request(buildApp())
      .post('/refresh')
      .set('Cookie', `refreshToken=${refreshToken}`);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('returns 401 when no refresh cookie is present', async () => {
    const res = await request(buildApp()).post('/refresh');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/No refresh token/i);
  });

  it('returns 401 for a tampered refresh token', async () => {
    const res = await request(buildApp())
      .post('/refresh')
      .set('Cookie', 'refreshToken=bad.token.here');

    expect(res.status).toBe(401);
  });

  it('returns 401 when user no longer exists', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const token = generateRefreshToken({ userId: 'deleted-user', role: 'MEMBER' });

    const res = await request(buildApp())
      .post('/refresh')
      .set('Cookie', `refreshToken=${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/User not found/i);
  });
});

// ── GET /me ───────────────────────────────────────────────
describe('GET /me', () => {
  it('returns the current user profile', async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER);

    const res = await request(buildApp()).get('/me');

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe('user-1');
    expect(res.body.user.email).toBe('ali@makteb.tn');
  });

  it('returns 404 when user not found in DB', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(buildApp()).get('/me');

    expect(res.status).toBe(404);
  });
});

// ── PUT /me ───────────────────────────────────────────────
describe('PUT /me', () => {
  it('updates and returns user profile', async () => {
    const updated = { ...MOCK_USER, name: 'Ali Updated', bio: 'Coach' };
    prisma.user.update.mockResolvedValue(updated);

    const res = await request(buildApp())
      .put('/me')
      .send({ name: 'Ali Updated', bio: 'Coach' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Ali Updated');
    expect(res.body.user.bio).toBe('Coach');
  });
});

// ── POST /logout ──────────────────────────────────────────
describe('POST /logout', () => {
  it('clears the refreshToken cookie and returns success', async () => {
    const res = await request(buildApp()).post('/logout');

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
    // Cookie cleared
    const setCookie = res.headers['set-cookie']?.[0] || '';
    expect(setCookie).toMatch(/refreshToken=;/);
  });
});
