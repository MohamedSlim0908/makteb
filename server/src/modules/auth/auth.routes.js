import { Router } from 'express';
import passport from 'passport';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
} from './auth.utils.js';

const router = Router();

// Register with email + password
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, name, passwordHash, provider: 'LOCAL' },
    });

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, bio: user.bio },
      accessToken,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login with email + password
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      res.status(401).json({ error: info?.message || 'Invalid credentials' });
      return;
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });
    setRefreshCookie(res, refreshToken);

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, bio: user.bio },
      accessToken,
    });
  })(req, res, next);
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ error: 'No refresh token' });
      return;
    }

    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });
    setRefreshCookie(res, refreshToken);

    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, role: true, avatar: true, bio: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name, bio, avatar },
      select: { id: true, email: true, name: true, role: true, avatar: true, bio: true },
    });
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ message: 'Logged out' });
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });
    setRefreshCookie(res, refreshToken);
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${accessToken}`);
  })(req, res, next);
});

// Facebook OAuth
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));

router.get('/facebook/callback', (req, res, next) => {
  passport.authenticate('facebook', { session: false }, (err, user) => {
    if (err || !user) return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });
    setRefreshCookie(res, refreshToken);
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${accessToken}`);
  })(req, res, next);
});

export default router;
