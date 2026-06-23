import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../types/errors.js';

type RequestSource = 'body' | 'query' | 'params';

export function validateRequest(schema: ZodSchema, source: RequestSource = 'query') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.errors.map((err) => err.message).join(', ');
      next(new ValidationError(message));
      return;
    }
    req[source] = result.data;
    next();
  };
}
