/**
 * Comprehensive error handling utilities for API routes
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface RouteError extends Error {
  statusCode?: number;
  details?: any;
}

/**
 * Async route wrapper - catches all errors and forwards to error handler
 * Use this to wrap all async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create a custom error with status code
 */
export function createError(message: string, statusCode: number = 500, details?: any): RouteError {
  const error = new Error(message) as RouteError;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

/**
 * Global error handler middleware - should be last middleware
 */
export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error for debugging
  console.error('API Error:', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Handle custom errors with status codes
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details
    });
  }

  // Handle database errors
  if (err.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      error: 'Duplicate entry',
      details: err.detail
    });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      error: 'Invalid reference',
      details: err.detail
    });
  }

  // Default to 500 for unknown errors
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

/**
 * Handle 404 errors for undefined routes
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
}

/**
 * Validation helper - throws error if condition is false
 */
export function validate(condition: boolean, message: string, statusCode: number = 400): void {
  if (!condition) {
    throw createError(message, statusCode);
  }
}

/**
 * Safely get authenticated user from request
 */
export function requireUser(req: any): any {
  validate(!!req.user, 'Authentication required', 401);
  return req.user;
}

/**
 * Safely get owner user from request
 */
export function requireOwner(req: any): any {
  const user = requireUser(req);
  validate(user.isOwner === 'true', 'Owner privileges required', 403);
  return user;
}
