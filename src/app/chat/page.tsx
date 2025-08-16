'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { ChatLayout } from '@/components/chat/ChatLayout'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useRouter } from 'next/navigation'

export default function ChatPage() {
  const { user, profile, loading } = useAuthContext()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/sign-in')
      } else if (!profile) {
        // Handle case where profile doesn't exist
        console.error('No profile found for user')
      } else {
        setIsReady(true)
      }
    }
  }, [user, profile, loading, router])

  if (loading || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return <ChatLayout />
}