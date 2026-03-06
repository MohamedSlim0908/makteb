import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, errorHandler } from './error-handler.js';

beforeEach(() => vi.clearAllMocks());

describe('AppError', () => {
  it('constructs with message and status', () => {
    const error = new AppError('Not found', 404);

    expect(error.message).toBe('Not found');
    expect(error.status).toBe(404);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('sets status to given value', () => {
    expect(new AppError('Bad', 400).status).toBe(400);
    expect(new AppError('Forbidden', 403).status).toBe(403);
    expect(new AppError('Conflict', 409).status).toBe(409);
  });
});

describe('errorHandler middleware', () => {
  function mockRes() {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    return res;
  }

  it('handles AppError and returns correct status and message', () => {
    const err = new AppError('Community not found', 404);
    const res = mockRes();

    errorHandler(err, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Community not found' });
  });

  it('handles generic Error and returns 500', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('Something broke');
    const res = mockRes();

    errorHandler(err, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    expect(consoleErrorSpy).toHaveBeenCalledWith(err);
    consoleErrorSpy.mockRestore();
  });

  it('uses statusCode if status is not set', () => {
    const err = new Error('Zod error');
    err.statusCode = 422;
    const res = mockRes();

    errorHandler(err, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ error: 'Zod error' });
  });

  it('returns 500 when neither status nor statusCode is set', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('Unexpected');
    const res = mockRes();

    errorHandler(err, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    consoleErrorSpy.mockRestore();
  });

  it('hides error message for 500 errors', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new AppError('sensitive info', 500);
    const res = mockRes();

    errorHandler(err, {}, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    consoleErrorSpy.mockRestore();
  });
});
