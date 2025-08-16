import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
  const supabase = createClient()
  const mountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

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
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error

        if (session?.user && mounted) {
          const profile = await fetchProfile(session.user.id)
          if (mounted) {
            setAuthState({
              user: session.user,
              profile,
              session,
              loading: false,
              error: null,
            })
          }
        } else if (mounted) {
          // لازم هنا نوقف اللف ونقول انه مش لوج ان
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
        if (mounted) {
          setAuthState({ 
            user: null,
            profile: null,
            session: null,
            loading: false, 
            error: 'Failed to initialize authentication' 
          })
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('Auth event:', event)
        
        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          if (mounted) {
            setAuthState({
              user: session.user,
              profile,
              session,
              loading: false,
              error: null,
            })
          }
        } else if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: null,
          })
        }

        if (event === 'SIGNED_IN' && mounted) {
          router.push('/chat')
        } else if (event === 'SIGNED_OUT' && mounted) {
          router.push('/sign-in')
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, router, fetchProfile])

  return authState
}
