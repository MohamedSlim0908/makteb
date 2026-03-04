import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { initSocket } from './lib/socket';
import { initPassport } from './modules/auth/passport';
import authRoutes from './modules/auth/auth.routes';
import communityRoutes from './modules/community/community.routes';
import postRoutes from './modules/community/post.routes';
import courseRoutes from './modules/courses/course.routes';
import lessonRoutes from './modules/courses/lesson.routes';
import gamificationRoutes from './modules/gamification/gamification.routes';
import paymentRoutes from './modules/payments/payment.routes';

const app = express();
const httpServer = createServer(app);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

initPassport(app);
initSocket(httpServer);

app.use('/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

export { app, httpServer };
