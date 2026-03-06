import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock cloudinary before importing the service
vi.mock('../../lib/cloudinary.js', () => {
  const mockUploadStream = vi.fn();
  const mockDestroy = vi.fn();
  return {
    default: {
      uploader: {
        upload_stream: mockUploadStream,
        destroy: mockDestroy,
      },
    },
  };
});

import cloudinary from '../../lib/cloudinary.js';
import { uploadImage, deleteImage } from './upload.service.js';

describe('uploadImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads a buffer and returns url + publicId', async () => {
    const fakeResult = {
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/makteb/abc.jpg',
      public_id: 'makteb/abc',
    };

    cloudinary.uploader.upload_stream.mockImplementation((_opts, callback) => {
      // Simulate a writable stream
      return {
        end: () => callback(null, fakeResult),
      };
    });

    const result = await uploadImage(Buffer.from('fake-image'), 'makteb');

    expect(result).toEqual({
      url: fakeResult.secure_url,
      publicId: fakeResult.public_id,
    });
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledOnce();
  });

  it('throws AppError on upload failure', async () => {
    cloudinary.uploader.upload_stream.mockImplementation((_opts, callback) => {
      return {
        end: () => callback(new Error('Cloudinary error'), null),
      };
    });

    await expect(uploadImage(Buffer.from('fake'), 'makteb')).rejects.toThrow('Failed to upload image');
  });
});

describe('deleteImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls cloudinary destroy with publicId', async () => {
    cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

    await deleteImage('makteb/abc');

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('makteb/abc');
  });

  it('does not throw on delete failure', async () => {
    cloudinary.uploader.destroy.mockRejectedValue(new Error('fail'));

    await expect(deleteImage('makteb/abc')).resolves.toBeUndefined();
  });
});
