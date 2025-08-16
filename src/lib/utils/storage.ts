/**
 * Local storage utilities with type safety
 */

export const storage = {
  get<T>(key: string, defaultValue?: T): T | undefined {
    if (typeof window === 'undefined') return defaultValue

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Error reading from localStorage:`, error)
      return defaultValue
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error writing to localStorage:`, error)
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing from localStorage:`, error)
    }
  },

  clear(): void {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.clear()
    } catch (error) {
      console.error(`Error clearing localStorage:`, error)
    }
  },
}

/**
 * Session storage utilities
 */
export const sessionStorage = {
  get<T>(key: string, defaultValue?: T): T | undefined {
    if (typeof window === 'undefined') return defaultValue

    try {
      const item = window.sessionStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Error reading from sessionStorage:`, error)
      return defaultValue
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return

    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error writing to sessionStorage:`, error)
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return

    try {
      window.sessionStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing from sessionStorage:`, error)
    }
  },
}

/**
 * Cookie utilities
 */
export const cookies = {
  get(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined

    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift()
    }
    
    return undefined
  },

  set(name: string, value: string, days: number = 7): void {
    if (typeof document === 'undefined') return

    const date = new Date()
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
    const expires = `expires=${date.toUTCString()}`
    
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`
  },

  remove(name: string): void {
    if (typeof document === 'undefined') return
    
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
  },
}