import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validate } from './validate.js';

beforeEach(() => vi.clearAllMocks());

// Create a mock Zod-like schema
function createMockSchema({ success = true, data = {}, errorMessage = 'Validation error' } = {}) {
  return {
    safeParse: vi.fn((body) => {
      if (success) {
        return { success: true, data: data ?? body };
      }
      return {
        success: false,
        error: { issues: [{ message: errorMessage }] },
      };
    }),
  };
}

describe('validate middleware', () => {
  it('calls next() with no error when body is valid', async () => {
    const schema = createMockSchema({ success: true, data: { name: 'Ali' } });
    const middleware = validate(schema);

    const req = { body: { name: 'Ali' } };
    const res = {};
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
    expect(schema.safeParse).toHaveBeenCalledWith({ name: 'Ali' });
  });

  it('replaces req.body with parsed data', async () => {
    const schema = createMockSchema({ success: true, data: { name: 'Ali', extra: 'stripped' } });
    const middleware = validate(schema);

    const req = { body: { name: 'Ali', extra: 'stripped', unknown: 'field' } };
    const res = {};
    const next = vi.fn();

    await middleware(req, res, next);

    expect(req.body).toEqual({ name: 'Ali', extra: 'stripped' });
  });

  it('calls next with AppError 400 when body is invalid', async () => {
    const schema = createMockSchema({ success: false, errorMessage: 'Name is required' });
    const middleware = validate(schema);

    const req = { body: {} };
    const res = {};
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.message).toBe('Name is required');
    expect(error.status).toBe(400);
  });

  it('uses the first issue message from Zod error', async () => {
    const schema = {
      safeParse: vi.fn(() => ({
        success: false,
        error: {
          issues: [
            { message: 'First error' },
            { message: 'Second error' },
          ],
        },
      })),
    };
    const middleware = validate(schema);

    const req = { body: {} };
    const res = {};
    const next = vi.fn();

    await middleware(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.message).toBe('First error');
  });
});
