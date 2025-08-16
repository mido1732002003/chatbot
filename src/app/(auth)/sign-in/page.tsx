'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SignInForm } from '@/components/auth/SignInForm'
import { useAuthContext } from '@/components/providers/AuthProvider'
import type { SignInFormData } from '@/types/chat'

export default function SignInPage() {
  const router = useRouter()
  const { signIn } = useAuthContext()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async (formData: SignInFormData) => {
    setIsLoading(true)
    setError(null)

    const { error } = await signIn(formData.email, formData.password)

    if (error) {
      setError(error)
      setIsLoading(false)
    } else {
      // Redirect handled by auth hook
      router.push('/chat')
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">
          Sign in to your account to continue chatting
        </p>
      </div>

      <div className="bg-background border rounded-lg shadow-sm p-6">
        <SignInForm
          onSubmit={handleSignIn}
          isLoading={isLoading}
          error={error}
        />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link
          href="/sign-up"
          className="font-medium text-primary hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}