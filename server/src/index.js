import { app, httpServer } from './app.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import { env } from './config/env.js';

async function start() {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL');

    await redis.connect();

    httpServer.listen(env.port, () => {
      console.log(`Makteb server running on port ${env.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
