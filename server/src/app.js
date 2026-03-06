import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { env } from './config/env.js';
import { initSocket } from './lib/socket.js';
import { initPassport } from './modules/auth/passport.js';
import { errorHandler } from './middleware/error-handler.js';
import authRoutes from './modules/auth/auth.routes.js';
import communityRoutes from './modules/community/community.routes.js';
import postRoutes from './modules/community/post.routes.js';
import courseRoutes from './modules/courses/course.routes.js';
import lessonRoutes from './modules/courses/lesson.routes.js';
import gamificationRoutes from './modules/gamification/gamification.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import uploadRoutes from './modules/upload/upload.routes.js';
import eventRoutes from './modules/events/event.routes.js';

const app = express();
const httpServer = createServer(app);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: env.clientUrls && env.clientUrls.length > 0
      ? (origin, cb) => {
          if (!origin || env.clientUrls.includes(origin)) return cb(null, true);
          if (env.nodeEnv === 'development' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
          return cb(null, false);
        }
      : env.clientUrl,
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

initPassport(app);
initSocket(httpServer);

app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/events', eventRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export { app, httpServer };
