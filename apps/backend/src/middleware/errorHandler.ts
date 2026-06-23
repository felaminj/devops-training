import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';
import { AppError } from '../types/errors.js';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        message: error.errors.map((err) => err.message).join(', '),
        code: 'VALIDATION_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.error({ err: error }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    timestamp: new Date().toISOString(),
  });
}
