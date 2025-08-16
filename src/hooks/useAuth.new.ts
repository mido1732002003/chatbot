'use client'

import { useState, useEffect, useCallback } from 'react'
import { getClient } from '@/lib/supabase/client'
import type { User, Session, PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

type AuthState = {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const supabase = getClient()
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
  })

  // Improved profile fetching with proper error handling and type safety
  const fetchProfile = useCallback(async (userId: string) => {
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          avatar_url,
          created_at
        `)
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error.message)
        return null
      }

      return data
    } catch (err) {
      console.error('Unexpected error during profile fetch:', err)
      return null
    }
  }, [supabase])

  // Non-blocking session initialization
  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          setAuthState(prev => ({
            ...prev,
            error: error.message,
            loading: false
          }))
          return
        }

        // Update auth state immediately without profile
        setAuthState(prev => ({
          ...prev,
          user: session?.user ?? null,
          session,
          loading: false,
          error: null
        }))

        // Load profile in background if needed
        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          if (mounted) {
            setAuthState(prev => ({
              ...prev,
              profile
            }))
          }
        }
      } catch (err) {
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            error: err instanceof Error ? err.message : 'Failed to initialize auth state',
            loading: false
          }))
        }
      }
    }

    init()

    // Subscribe to auth changes with improved error handling
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return

        try {
          // Update auth state immediately
          setAuthState(prev => ({
            ...prev,
            user: session?.user ?? null,
            session,
            loading: false,
            error: null
          }))

          // Load profile in background if needed
          if (session?.user) {
            const profile = await fetchProfile(session.user.id)
            if (mounted) {
              setAuthState(prev => ({
                ...prev,
                profile
              }))
            }
          }
        } catch (err) {
          if (mounted) {
            setAuthState(prev => ({
              ...prev,
              error: err instanceof Error ? err.message : 'Failed to update auth state',
              loading: false
            }))
          }
        }
      }
    )

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setAuthState(prev => ({ 
          ...prev, 
          error: signInError.message, 
          loading: false 
        }))
        return { error: signInError.message }
      }

      // Update auth state immediately with user and session
      setAuthState(prev => ({
        ...prev,
        user: data.user,
        session: data.session,
        loading: false,
        error: null,
      }))

      // Fetch profile in background if needed
      if (data.user) {
        const profile = await fetchProfile(data.user.id)
        setAuthState(prev => ({
          ...prev,
          profile,
        }))
      }

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setAuthState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false 
      }))
      return { error: errorMessage }
    }
  }, [supabase, fetchProfile])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setAuthState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        error: null,
      })
    } catch (err) {
      setAuthState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to sign out',
      }))
    }
  }, [supabase])

  return {
    ...authState,
    signIn,
    signOut,
  }
}
