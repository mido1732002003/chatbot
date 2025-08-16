/**
 * Error handling utilities
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const ErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RATE_LIMIT: 'RATE_LIMIT',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

/**
 * Map Supabase errors to user-friendly messages
 */
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error
  }

  if (error?.message) {
    // Handle specific Supabase auth errors
    if (error.message.includes('Invalid login credentials')) {
      return 'Invalid email or password'
    }
    if (error.message.includes('User already registered')) {
      return 'An account with this email already exists'
    }
    if (error.message.includes('Password should be at least')) {
      return 'Password must be at least 6 characters'
    }
    if (error.message.includes('duplicate key value')) {
      if (error.message.includes('username')) {
        return 'This username is already taken'
      }
      return 'This record already exists'
    }
    if (error.message.includes('violates foreign key constraint')) {
      return 'Referenced record not found'
    }
    if (error.message.includes('JWT')) {
      return 'Session expired. Please sign in again'
    }
    
    return error.message
  }

  if (error?.error_description) {
    return error.error_description
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Log errors with context
 */
export function logError(error: any, context?: Record<string, any>): void {
  console.error('Error occurred:', {
    message: error?.message || error,
    stack: error?.stack,
    context,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Handle async errors in API routes
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args)
    } catch (error) {
      logError(error)
      throw error
    }
  }) as T
}

/**
 * Retry failed operations with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}