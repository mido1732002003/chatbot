/**
 * Validation utilities for forms and user input
 */

export const validation = {
  username: {
    pattern: /^[a-z0-9_]{3,20}$/,
    message: 'Username must be 3-20 characters, lowercase letters, numbers, and underscores only',
    validate: (username: string): boolean => {
      return validation.username.pattern.test(username)
    },
  },
  
  password: {
    minLength: 6,
    message: 'Password must be at least 6 characters',
    validate: (password: string): boolean => {
      return password.length >= validation.password.minLength
    },
  },
  
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
    validate: (email: string): boolean => {
      return validation.email.pattern.test(email)
    },
  },
  
  message: {
    minLength: 1,
    maxLength: 2000,
    message: 'Message must be between 1 and 2000 characters',
    validate: (message: string): boolean => {
      const trimmed = message.trim()
      return trimmed.length >= validation.message.minLength && 
             trimmed.length <= validation.message.maxLength
    },
  },
}

export function getValidationError(field: keyof typeof validation, value: string): string | null {
  if (!validation[field].validate(value)) {
    return validation[field].message
  }
  return null
}