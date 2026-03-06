import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';
import { uploadImage } from './upload.service.js';

const router = Router();

router.post('/image', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  const result = await uploadImage(req.file.buffer, 'makteb');
  res.json({ url: result.url, publicId: result.publicId });
});

export default router;
