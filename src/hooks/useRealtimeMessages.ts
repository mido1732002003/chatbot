import { useEffect, useRef, useCallback } from 'react'
import { getClient } from '@/lib/supabase/client'
import { useAuthContext } from '@/components/providers/AuthProvider'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeMessages(
  conversationId: string,
  onNewMessage: (message: any) => void
) {
  const { user } = useAuthContext()
  const supabase = getClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const onNewMessageRef = useRef(onNewMessage)

  // Update ref to avoid stale closure
  useEffect(() => {
    onNewMessageRef.current = onNewMessage
  }, [onNewMessage])

  useEffect(() => {
    if (!user || !conversationId) return

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const setupRealtimeSubscription = async () => {
      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          async (payload) => {
            // Skip our own messages (already added optimistically)
            if (payload.new.sender_id === user.id) {
              return
            }

            try {
              const { data: senderProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', payload.new.sender_id)
                .single()

              const messageWithSender = {
                ...payload.new,
                sender: senderProfile,
              }

              onNewMessageRef.current(messageWithSender)
            } catch (error) {
              console.error('Error fetching sender profile:', error)
              // Still add message even if profile fetch fails
              onNewMessageRef.current(payload.new)
            }
          }
        )
        .subscribe()

      channelRef.current = channel
    }

    setupRealtimeSubscription()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId, user?.id, supabase])
}