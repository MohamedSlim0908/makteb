import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Express } from 'express';
import { prisma } from '../../lib/prisma';
import { comparePassword } from './auth.utils';
import { env } from '../../config/env';

export function initPassport(app: Express) {
  app.use(passport.initialize());

  // Local strategy (email + password)
  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      async (email, password, done) => {
        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.passwordHash) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          const valid = await comparePassword(password, user.passwordHash);
          if (!valid) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Google OAuth (only if credentials configured)
  if (env.google.clientId && env.google.clientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.google.clientId,
          clientSecret: env.google.clientSecret,
          callbackURL: '/auth/google/callback',
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(null, false);

            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
              user = await prisma.user.create({
                data: {
                  email,
                  name: profile.displayName || email.split('@')[0],
                  avatar: profile.photos?.[0]?.value || null,
                  provider: 'GOOGLE',
                  providerId: profile.id,
                },
              });
            }
            return done(null, user);
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
  }

  // Facebook OAuth (only if credentials configured)
  if (env.facebook.appId && env.facebook.appSecret) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: env.facebook.appId,
          clientSecret: env.facebook.appSecret,
          callbackURL: '/auth/facebook/callback',
          profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(null, false);

            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
              user = await prisma.user.create({
                data: {
                  email,
                  name: profile.displayName || email.split('@')[0],
                  avatar: profile.photos?.[0]?.value || null,
                  provider: 'FACEBOOK',
                  providerId: profile.id,
                },
              });
            }
            return done(null, user);
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
  }
}
