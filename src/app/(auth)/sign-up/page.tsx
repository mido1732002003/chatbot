'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { useAuthContext } from '@/components/providers/AuthProvider'
import type { SignUpFormData } from '@/types/chat'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuthContext()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (formData: SignUpFormData) => {
    setIsLoading(true)
    setError(null)

    const { data, error } = await signUp(
      formData.email,
      formData.password,
      formData.username,
      formData.full_name
    )

    setIsLoading(false)

    if (error) {
      setError(error)
    } else if (data?.user) {
      setSuccess(true)
      // Auto sign in after successful registration
      setTimeout(() => {
        router.push('/chat')
      }, 2000)
    }
  }

  if (success) {
    return (
      <div className="w-full space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-green-900 mb-2">
            Account created successfully!
          </h2>
          <p className="text-green-700">
            Redirecting you to the chat...
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
          isLoading={isLoading}
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