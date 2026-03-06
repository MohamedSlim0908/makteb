import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth middleware
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (_req, _res, next) => next(),
}));

// Mock upload service
vi.mock('./upload.service.js', () => ({
  uploadImage: vi.fn(),
}));

import express from 'express';
import request from 'supertest';
import uploadRoutes from './upload.routes.js';
import { uploadImage } from './upload.service.js';

function createApp() {
  const app = express();
  app.use('/api/upload', uploadRoutes);
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: err.message });
  });
  return app;
}

describe('POST /api/upload/image', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when no file is provided', async () => {
    const app = createApp();
    const res = await request(app).post('/api/upload/image');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No image file provided');
  });

  it('uploads an image and returns url + publicId', async () => {
    uploadImage.mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/image/upload/v1/makteb/test.jpg',
      publicId: 'makteb/test',
    });

    const app = createApp();
    const res = await request(app)
      .post('/api/upload/image')
      .attach('image', Buffer.from('fake-png'), { filename: 'test.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      url: 'https://res.cloudinary.com/demo/image/upload/v1/makteb/test.jpg',
      publicId: 'makteb/test',
    });
    expect(uploadImage).toHaveBeenCalledOnce();
  });

  it('rejects non-image files', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/upload/image')
      .attach('image', Buffer.from('not-an-image'), { filename: 'test.txt', contentType: 'text/plain' });

    // Multer rejects non-image files
    expect(res.status).toBe(500);
    expect(res.body.error).toContain('Only image files are allowed');
  });
});
