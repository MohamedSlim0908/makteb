import { AppError } from './error-handler.js';

export function validate(schema) {
  return async (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new AppError(result.error.issues[0].message, 400));
    }
    req.body = result.data;
    next();
  };
}
