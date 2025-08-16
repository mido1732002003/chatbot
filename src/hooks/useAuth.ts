'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface AuthState {
  user: any | null
  profile: any | null
  session: any | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
  })

  const router = useRouter()
  const supabase = createClientComponentClient()

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }, [supabase])

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error

        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          setAuthState({
            user: session.user,
            profile,
            session,
            loading: false,
            error: null,
          })
        } else {
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: null,
          })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setAuthState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          error: 'Failed to initialize authentication',
        })
      }
    }

    initAuth()

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)

        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          setAuthState({
            user: session.user,
            profile,
            session,
            loading: false,
            error: null,
          })
        } else {
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: null,
          })
        }

        if (event === 'SIGNED_IN') {
          router.push('/chat')
        } else if (event === 'SIGNED_OUT') {
          router.push('/sign-in')
        }
      }
    )

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [supabase, router, fetchProfile])

  return authState
}
