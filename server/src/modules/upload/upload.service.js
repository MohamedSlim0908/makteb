import cloudinary from '../../lib/cloudinary.js';
import { AppError } from '../../middleware/error-handler.js';

export async function uploadImage(buffer, folder = 'makteb') {
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    throw new AppError('Failed to upload image', 500);
  }
}

export async function deleteImage(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // Ignore delete failures
  }
}
