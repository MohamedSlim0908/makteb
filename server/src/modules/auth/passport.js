import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { prisma } from '../../lib/prisma.js';
import { comparePassword } from './auth.utils.js';
import { env } from '../../config/env.js';

async function findOrCreateOAuthUser(email, profile, provider) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: profile.displayName || email.split('@')[0],
        avatar: profile.photos?.[0]?.value || null,
        provider,
        providerId: profile.id,
      },
    });
  }
  return user;
}

function createOAuthCallback(provider) {
  return async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(null, false);
      const user = await findOrCreateOAuthUser(email, profile, provider);
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  };
}

export function initPassport(app) {
  app.use(passport.initialize());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      async (email, password, done) => {
        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.passwordHash) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          const isValid = await comparePassword(password, user.passwordHash);
          if (!isValid) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  if (env.google.clientId && env.google.clientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.google.clientId,
          clientSecret: env.google.clientSecret,
          callbackURL: '/api/auth/google/callback',
        },
        createOAuthCallback('GOOGLE')
      )
    );
  }

  if (env.facebook.appId && env.facebook.appSecret) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: env.facebook.appId,
          clientSecret: env.facebook.appSecret,
          callbackURL: '/api/auth/facebook/callback',
          profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
        },
        createOAuthCallback('FACEBOOK')
      )
    );
  }
}
