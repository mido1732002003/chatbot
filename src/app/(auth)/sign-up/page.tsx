'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { useAuth } from '@/hooks/useAuth' // Changed from useAuthContext
import type { SignUpFormData } from '@/types/chat'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp, loading: authLoading } = useAuth() // Get auth loading state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (formData: SignUpFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        formData.username,
        formData.full_name
      )

      if (error) {
        setError(error)
      } else {
        setSuccess(true) // Show success message
        // Let useAuth handle the redirect automatically
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Combined loading state
  const effectiveLoading = isLoading || authLoading

  if (success) {
    return (
      <div className="w-full space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-green-900 mb-2">
            Account created successfully!
          </h2>
          <p className="text-green-700">
            You'll be redirected automatically...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground">
          Enter your details to get started with Chat App
        </p>
      </div>

      <div className="bg-background border rounded-lg shadow-sm p-6">
        <SignUpForm
          onSubmit={handleSignUp}
          isLoading={effectiveLoading} // Use combined loading state
          error={error}
        />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/sign-in"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}