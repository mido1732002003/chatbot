'use client'

import { useState, useEffect, useCallback } from 'react'
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
    loading: false, // 👈 ما تبدأش بلودينج
    error: null,
  })

  // fetch profile helper
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

  // init session on mount
  useEffect(() => {
    const init = async () => {
      setAuthState((prev) => ({ ...prev, loading: true }))
      const { data } = await supabase.auth.getSession()
      const session = data.session
      setAuthState({
        user: session?.user ?? null,
        profile: session?.user ? await fetchProfile(session.user.id) : null,
        session,
        loading: false,
        error: null,
      })
    }

    init()

    // subscribe to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setAuthState({
          user: session?.user ?? null,
          profile: session?.user ? await fetchProfile(session.user.id) : null,
          session,
          loading: false,
          error: null,
        })
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  // auth methods
  const signIn = useCallback(async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, loading: true }))
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
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
