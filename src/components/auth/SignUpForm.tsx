'use client'

import { useState } from 'react'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import type { SignUpFormData } from '@/types/chat'

interface SignUpFormProps {
  onSubmit: (data: SignUpFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export function SignUpForm({ onSubmit, isLoading, error }: SignUpFormProps) {
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    username: '',
    full_name: '',
  })
  const [validationError, setValidationError] = useState<string | null>(null)

  const validateUsername = (username: string): boolean => {
    // Username must be lowercase, alphanumeric with underscores, 3-20 chars
    const usernameRegex = /^[a-z0-9_]{3,20}$/
    return usernameRegex.test(username)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    // Validate username
    if (!validateUsername(formData.username)) {
      setValidationError(
        'Username must be 3-20 characters, lowercase letters, numbers, and underscores only'
      )
      return
    }

    // Validate password
    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters')
      return
    }

    await onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Auto-lowercase username as user types
    if (name === 'username') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toLowerCase(),
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const displayError = validationError || error

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {displayError && <ErrorMessage message={displayError} />}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="input-base"
          placeholder="you@example.com"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          value={formData.username}
          onChange={handleChange}
          className="input-base"
          placeholder="johndoe"
          disabled={isLoading}
          pattern="[a-z0-9_]{3,20}"
          title="3-20 characters, lowercase letters, numbers, and underscores only"
        />
        <p className="text-xs text-muted-foreground">
          Choose a unique username (lowercase, 3-20 characters)
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="full_name" className="text-sm font-medium">
          Full Name (optional)
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          value={formData.full_name || ''}
          onChange={handleChange}
          className="input-base"
          placeholder="John Doe"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={formData.password}
          onChange={handleChange}
          className="input-base"
          placeholder="••••••••"
          disabled={isLoading}
          minLength={6}
        />
        <p className="text-xs text-muted-foreground">
          Must be at least 6 characters
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="button-primary w-full"
      >
        {isLoading ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  )
}