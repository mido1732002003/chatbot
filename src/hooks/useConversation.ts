import { useState, useCallback } from 'react'
import { getClient } from '@/lib/supabase/client'
import { useAuthContext } from '@/components/providers/AuthProvider'
import type { ConversationWithParticipants } from '@/types/chat'

export function useConversation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthContext()
  const supabase = getClient()

  const getOrCreateConversation = useCallback(async (
    otherUserId: string
  ): Promise<ConversationWithParticipants | null> => {
    if (!user) {
      setError('User not authenticated')
      return null
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(otherUserId) || !uuidRegex.test(user.id)) {
      setError('Invalid user ID format')
      return null
    }

    try {
      setLoading(true)
      setError(null)

      // First, try to find existing conversation using both possible member combinations
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          member_one_profile:profiles!conversations_member_one_fkey(*),
          member_two_profile:profiles!conversations_member_two_fkey(*)
        `)
        .or(`and(member_one.eq.${user.id},member_two.eq.${otherUserId}),and(member_one.eq.${otherUserId},member_two.eq.${user.id})`)

      if (!fetchError && existingConversations && existingConversations.length > 0) {
        return existingConversations[0] as unknown as ConversationWithParticipants
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
        // Handle unique constraint violation
        if (createError.code === '23505') {
          // Retry fetching
          const { data: retryData } = await supabase
            .from('conversations')
            .select(`
              *,
              member_one_profile:profiles!conversations_member_one_fkey(*),
              member_two_profile:profiles!conversations_member_two_fkey(*)
            `)
            .or(`and(member_one.eq.${user.id},member_two.eq.${otherUserId}),and(member_one.eq.${otherUserId},member_two.eq.${user.id})`)
            .single()

          if (retryData) {
            return retryData as unknown as ConversationWithParticipants
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
          member_two_profile:profiles!conversations_member_two_fkey(*),
          messages(
            id,
            body,
            created_at,
            sender_id
          )
        `)
        .or(`member_one.eq.${user.id},member_two.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Process to get last message for each conversation
      const conversationsWithLastMessage = data?.map(conv => {
        const messages = conv.messages || []
        const lastMessage = messages.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0] || null

        return {
          ...conv,
          last_message: lastMessage,
          messages: undefined, // Remove messages array from result
        }
      })

      return conversationsWithLastMessage as unknown as ConversationWithParticipants[]
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