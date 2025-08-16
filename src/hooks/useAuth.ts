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
// ... imports remain the same

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(/* unchanged */);
  const router = useRouter();
  const supabase = getClient();
  const [isMounted, setIsMounted] = useState(true); // Add mount state

  // Fetch profile (optimized)
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Profile fetch failed:', error);
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    setIsMounted(true);
    
    // Single auth state handler
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        // Skip token events to prevent state reset
        if (event === 'TOKEN_REFRESHED') return;

        try {
          setAuthState(prev => ({ ...prev, loading: true }));
          
          if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            if (!isMounted) return;
            
            setAuthState({
              user: session.user,
              profile,
              session,
              loading: false,
              error: null
            });

            // Redirect ONLY if new sign-in
            if (event === 'SIGNED_IN') router.push('/chat');
          } else {
            setAuthState({
              user: null,
              profile: null,
              session: null,
              loading: false,
              error: null
            });
            if (event === 'SIGNED_OUT') router.push('/sign-in');
          }
        } catch (error) {
          if (isMounted) setAuthState(prev => ({
            ...prev,
            loading: false,
            error: 'Auth state update failed'
          }));
        }
      }
    );

    return () => {
      setIsMounted(false);
      subscription.unsubscribe();
    };
  }, [supabase, router, fetchProfile, isMounted]);

  // Signup without profile update (handled by trigger)
  const signUp = useCallback(async (email: string, password: string) => {
    // ... call supabase.auth.signUp WITHOUT profile update
  }, [supabase]);

  // ... other methods remain mostly unchanged
}


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