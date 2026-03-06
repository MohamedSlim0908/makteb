import { app, httpServer } from './app.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import { env } from './config/env.js';

async function start() {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL');

    try {
      await redis.connect();
    } catch (err) {
      if (env.nodeEnv === 'production') {
        throw err;
      }

      console.warn('Redis unavailable in development. Continuing without Redis.');
    }

    httpServer.listen(env.port, () => {
      console.log(`Makteb server running on port ${env.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
