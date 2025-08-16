'use client'

import { us  // fetch profile helper with improved SQL query and error handling
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, created_at')  // Explicit column selection
      .eq('id', userId)
      .maybeSingle()  // Better than .single() as it won't error if no row found

    if (error) {
      // Handle specific database errors
      if (error.code === '42P01') {  // Table not found
        console.error('Table "profiles" does not exist:', error.message)
      } else if (error.code === '42703') {  // Column not found
        console.error('Invalid column reference:', error.message)
      } else {
        console.error('Error fetching profile:', error.message)
      }
      return null
    }

    return data
  }, [supabase])ect, useCallback } from 'react'
import { getClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

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
    loading: true, // Start with loading true only for auth state
    error: null,
  })

  // fetch profile helper - now returns immediately with loading state
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error.message)
      return null
    }
    return data
  }, [supabase])

  // init session on mount - non-blocking
  useEffect(() => {
    let mounted = true

    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const session = data.session
      
      if (!mounted) return

      // Update auth state immediately without profile
      setAuthState({
        user: session?.user ?? null,
        profile: null, // Profile will be loaded separately
        session,
        loading: false,
        error: null,
      })

      // Load profile in the background if needed
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            profile
          }))
        }
      }
    }

    init()

    // subscribe to auth changes - now non-blocking
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return

        // Update auth state immediately
        setAuthState(prev => ({
          user: session?.user ?? null,
          profile: null, // Profile will be updated separately
          session,
          loading: false,
          error: null,
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
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  // auth methods with improved state management and error handling
  const signIn = useCallback(async (email: string, password: string) => {
    let mounted = true;
    
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }))
      
      // Attempt sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!mounted) return { error: null };

      if (signInError) {
        setAuthState((prev) => ({ 
          ...prev, 
          error: signInError.message, 
          loading: false 
        }))
        return { error: signInError.message }
      }

      // Update auth state immediately with user and session
      setAuthState((prev) => ({
        ...prev,
        user: data.user,
        session: data.session,
        loading: false,
        error: null,
      }))

      // Fetch profile in the background if needed
      if (data.user) {
        const profile = await fetchProfile(data.user.id)
        if (mounted) {
          setAuthState((prev) => ({
            ...prev,
            profile,
          }))
        }
      }

      return { error: null }
    } catch (err) {
      if (!mounted) return { error: null };
      
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setAuthState((prev) => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false 
      }))
      return { error: errorMessage }
    }
    
    return () => {
      mounted = false
    }
  }, [supabase, fetchProfile])

  const signUp = useCallback(async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, loading: true }))
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setAuthState((prev) => ({ ...prev, error: error.message, loading: false }))
      return { error: error.message }
    }
    const user = data.user
    const profile = user ? await fetchProfile(user.id) : null
    setAuthState({
      user,
      profile,
      session: data.session,
      loading: false,
      error: null,
    })
    return { error: null }
  }, [supabase, fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setAuthState({
      user: null,
      profile: null,
      session: null,
      loading: false,
      error: null,
    })
  }, [supabase])

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
  }
}
