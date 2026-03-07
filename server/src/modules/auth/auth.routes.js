import { Router } from 'express';
import { z } from 'zod';
import passport from 'passport';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { AppError } from '../../middleware/error-handler.js';
import { issueTokenPair, formatUserResponse } from './auth.utils.js';
import { env } from '../../config/env.js';
import * as authService from './auth.service.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  name: z.string().min(1),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
});

const updateEmailSchema = z.object({
  email: z.string().email(),
  currentPassword: z.string().min(1),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

function handleOAuthCallback(res, err, user) {
  if (err || !user) {
    res.redirect(`${env.clientUrl}/login?error=auth_failed`);
    return;
  }
  const accessToken = issueTokenPair(res, user);
  res.redirect(`${env.clientUrl}/auth/callback?token=${accessToken}`);
}

router.post('/register', validate(registerSchema), async (req, res) => {
  const user = await authService.registerUser(req.body);
  const accessToken = issueTokenPair(res, user);
  res.status(201).json({ user: formatUserResponse(user), accessToken });
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return next(new AppError(info?.message || 'Invalid credentials', 401));

    const accessToken = issueTokenPair(res, user);
    res.json({ user: formatUserResponse(user), accessToken });
  })(req, res, next);
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new AppError('No refresh token', 401);
  const user = await authService.resolveRefreshToken(token);
  const accessToken = issueTokenPair(res, user);
  res.json({ accessToken });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await authService.getCurrentUser(req.userId);
  res.json({ user });
});

router.put('/me', requireAuth, validate(updateProfileSchema), async (req, res) => {
  const user = await authService.updateUserProfile(req.userId, req.body);
  res.json({ user });
});

router.put('/email', requireAuth, validate(updateEmailSchema), async (req, res) => {
  const user = await authService.updateUserEmail(req.userId, req.body);
  res.json({ user });
});

router.put('/password', requireAuth, validate(updatePasswordSchema), async (req, res) => {
  await authService.updateUserPassword(req.userId, req.body);
  res.json({ message: 'Password updated' });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ message: 'Logged out' });
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    handleOAuthCallback(res, err, user);
  })(req, res, next);
});

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));

router.get('/facebook/callback', (req, res, next) => {
  passport.authenticate('facebook', { session: false }, (err, user) => {
    handleOAuthCallback(res, err, user);
  })(req, res, next);
});

export default router;
