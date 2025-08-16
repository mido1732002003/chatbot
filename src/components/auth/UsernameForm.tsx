'use client'

import { useState } from 'react'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

interface UsernameFormProps {
  onSubmit: (username: string) => Promise<void>
  isLoading?: boolean
  error?: string | null
  currentUsername?: string
}

export function UsernameForm({ 
  onSubmit, 
  isLoading, 
  error,
  currentUsername 
}: UsernameFormProps) {
  const [username, setUsername] = useState(currentUsername || '')
  const [validationError, setValidationError] = useState<string | null>(null)

  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-z0-9_]{3,20}$/
    return usernameRegex.test(username)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!validateUsername(username)) {
      setValidationError(
        'Username must be 3-20 characters, lowercase letters, numbers, and underscores only'
      )
      return
    }

    await onSubmit(username)
  }

  const displayError = validationError || error

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {displayError && <ErrorMessage message={displayError} />}

      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">
          Choose your username
        </label>
        <input
          id="username"
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          className="input-base"
          placeholder="johndoe"
          disabled={isLoading}
          pattern="[a-z0-9_]{3,20}"
        />
        <p className="text-xs text-muted-foreground">
          This will be your unique identifier in chats
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || !username}
        className="button-primary w-full"
      >
        {isLoading ? 'Saving...' : 'Continue'}
      </button>
    </form>
  )
}