import { useState, useCallback } from 'react'
import { getClient } from '@/lib/supabase/client'
import { useAuthContext } from '@/components/providers/AuthProvider'
import type { ConversationWithParticipants } from '@/types/chat'

export function useConversation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthContext()
  const supabase = getClient()

  /**
   * Get or create a conversation between current user and another user
   * Uses the pair_key to ensure uniqueness
   */
  const getOrCreateConversation = useCallback(async (
    otherUserId: string
  ): Promise<ConversationWithParticipants | null> => {
    if (!user) {
      setError('User not authenticated')
      return null
    }

    try {
      setLoading(true)
      setError(null)

      // Generate the pair key (handled by database but we can check first)
      const member1 = user.id < otherUserId ? user.id : otherUserId
      const member2 = user.id < otherUserId ? otherUserId : user.id
      const pairKey = `${member1}:${member2}`

      // First, try to find existing conversation
      const { data: existingConversation, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          member_one_profile:profiles!conversations_member_one_fkey(*),
          member_two_profile:profiles!conversations_member_two_fkey(*)
        `)
        .or(`member_one.eq.${user.id},member_two.eq.${user.id}`)
        .or(`member_one.eq.${otherUserId},member_two.eq.${otherUserId}`)
        .single()

      if (existingConversation && !fetchError) {
        return existingConversation as unknown as ConversationWithParticipants
      }

      // If no conversation exists, create one
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          member_one: user.id,
          member_two: otherUserId,
        })
        .select(`
          *,
          member_one_profile:profiles!conversations_member_one_fkey(*),
          member_two_profile:profiles!conversations_member_two_fkey(*)
        `)
        .single()

      if (createError) {
        // If we get a unique violation, try fetching again
        if (createError.code === '23505') {
          const { data: retryConversation } = await supabase
            .from('conversations')
            .select(`
              *,
              member_one_profile:profiles!conversations_member_one_fkey(*),
              member_two_profile:profiles!conversations_member_two_fkey(*)
            `)
            .or(`member_one.eq.${user.id},member_two.eq.${user.id}`)
            .or(`member_one.eq.${otherUserId},member_two.eq.${otherUserId}`)
            .single()

          if (retryConversation) {
            return retryConversation as unknown as ConversationWithParticipants
          }
        }
        throw createError
      }

      return newConversation as unknown as ConversationWithParticipants
    } catch (err: any) {
      console.error('Error managing conversation:', err)
      setError(err.message || 'Failed to load conversation')
      return null
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  /**
   * Get all conversations for the current user
   */
  const getUserConversations = useCallback(async (): Promise<ConversationWithParticipants[]> => {
    if (!user) {
      setError('User not authenticated')
      return []
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          member_one_profile:profiles!conversations_member_one_fkey(*),
          member_two_profile:profiles!conversations_member_two_fkey(*)
        `)
        .or(`member_one.eq.${user.id},member_two.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data as unknown as ConversationWithParticipants[]
    } catch (err: any) {
      console.error('Error fetching conversations:', err)
      setError(err.message || 'Failed to load conversations')
      return []
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  return {
    getOrCreateConversation,
    getUserConversations,
    loading,
    error,
  }
}