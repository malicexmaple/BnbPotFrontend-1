/**
 * Structured error handling with consistent logging and HTTP status codes
 */

import { Response } from "express";
import { ZodError } from "zod";

/**
 * Base application error class with HTTP status code
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, code || 'VALIDATION_ERROR');
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, 'AUTH_ERROR');
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = "Access forbidden") {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super("Too many requests. Please try again later.", 429, 'RATE_LIMIT');
    if (retryAfter) {
      (this as any).retryAfter = retryAfter;
    }
  }
}

/**
 * Format Zod validation errors into user-friendly messages
 */
export function formatZodError(error: ZodError): string {
  const issues = error.issues.map(issue => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });
  return issues.join('; ');
}

/**
 * Centralized error response handler
 * Logs error details and sends consistent JSON response
 */
export function handleError(error: unknown, res: Response, context?: string): void {
  // Log error with context
  const contextPrefix = context ? `[${context}] ` : '';
  
  if (error instanceof AppError) {
    // Structured application error
    console.warn(`⚠️ ${contextPrefix}${error.name}: ${error.message}`);
    
    const response: any = {
      message: error.message,
      code: error.code
    };
    
    if ((error as any).retryAfter) {
      response.retryAfter = (error as any).retryAfter;
    }
    
    res.status(error.statusCode).json(response);
  } else if (error instanceof ZodError) {
    // Validation error from Zod schemas
    const message = formatZodError(error);
    console.warn(`⚠️ ${contextPrefix}Validation error: ${message}`);
    
    res.status(400).json({
      message: "Validation failed",
      code: 'VALIDATION_ERROR',
      details: message
    });
  } else if (error instanceof Error) {
    // Generic JavaScript error
    console.error(`🚨 ${contextPrefix}Unexpected error:`, error.message);
    console.error(error.stack);
    
    // Don't expose internal error details in production
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      message: isDev ? error.message : "Internal server error",
      code: 'INTERNAL_ERROR',
      ...(isDev && { stack: error.stack })
    });
  } else {
    // Unknown error type
    console.error(`🚨 ${contextPrefix}Unknown error:`, error);
    
    res.status(500).json({
      message: "Internal server error",
      code: 'UNKNOWN_ERROR'
    });
  }
}
