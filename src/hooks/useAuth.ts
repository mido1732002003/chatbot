import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
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
  const supabase = getClient()

  // Fetch user profile
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

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get initial session
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
          setAuthState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Failed to initialize authentication' 
        }))
      }
    }

    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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

      // Handle auth events
      if (event === 'SIGNED_IN') {
        router.push('/chat')
      } else if (event === 'SIGNED_OUT') {
        router.push('/sign-in')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, fetchProfile])

  // Sign up function
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    username: string,
    fullName?: string
  ) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      // Update username if needed (the trigger creates a temporary one)
      if (data.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ username, full_name: fullName })
          .eq('id', data.user.id)

        if (updateError) {
          console.error('Error updating profile:', updateError)
        }
      }

      return { data, error: null }
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }))
      return { data: null, error: error.message }
    }
  }, [supabase])

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }))
      return { data: null, error: error.message }
    }
  }, [supabase])

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error: any) {
      console.error('Sign out error:', error)
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }))
    }
  }, [supabase])

  // Update profile function
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!authState.user) return { data: null, error: 'No user logged in' }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authState.user.id)
        .select()
        .single()

      if (error) throw error
      
      setAuthState(prev => ({ ...prev, profile: data }))
      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  }, [supabase, authState.user])

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }
}