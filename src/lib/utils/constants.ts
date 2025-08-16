/**
 * Application constants
 */

export const APP_NAME = 'Chat App'
export const APP_DESCRIPTION = 'Real-time messaging application'

export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  CHAT: '/chat',
  PROFILE: '/profile',
} as const

export const LIMITS = {
  MESSAGE_MAX_LENGTH: 2000,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  PASSWORD_MIN_LENGTH: 6,
  MESSAGES_PER_LOAD: 50,
  USERS_PER_PAGE: 20,
} as const

export const TIMEOUTS = {
  DEBOUNCE_SEARCH: 300,
  TYPING_INDICATOR: 1000,
  RECONNECT_DELAY: 5000,
  MESSAGE_RETRY: 3000,
} as const

export const STORAGE_KEYS = {
  THEME: 'chat-app-theme',
  DRAFT_MESSAGE: 'chat-app-draft',
  USER_PREFERENCES: 'chat-app-preferences',
} as const

export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  AUTH_REQUIRED: 'Please sign in to continue.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  USERNAME_TAKEN: 'This username is already taken.',
  MESSAGE_FAILED: 'Failed to send message. Please try again.',
} as const