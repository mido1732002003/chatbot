'use client'

import { useState } from 'react'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import type { SignInFormData } from '@/types/chat'

interface SignInFormProps {
  onSubmit: (data: SignInFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export function SignInForm({ onSubmit, isLoading, error }: SignInFormProps) {
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorMessage message={error} />}

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
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={formData.password}
          onChange={handleChange}
          className="input-base"
          placeholder="••••••••"
          disabled={isLoading}
          minLength={6}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="button-primary w-full"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}