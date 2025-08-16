import { useEffect } from 'react'
import { getClient } from '@/lib/supabase/client'
import { useAuthContext } from '@/components/providers/AuthProvider'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeMessages(
  conversationId: string,
  onNewMessage: (message: any) => void
) {
  const { user } = useAuthContext()
  const supabase = getClient()

  useEffect(() => {
    if (!user || !conversationId) return

    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      // Subscribe to new messages for this conversation
      channel = supabase
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
            console.log('New message received:', payload.new)
            
            // Don't add if it's our own message (already added optimistically)
            if (payload.new.sender_id === user.id) {
              return
            }

            // Fetch sender profile
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', payload.new.sender_id)
              .single()

            const messageWithSender = {
              ...payload.new,
              sender: senderProfile,
            }

            onNewMessage(messageWithSender)
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status)
        })
    }

    setupRealtimeSubscription()

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        console.log('Unsubscribing from realtime messages')
        supabase.removeChannel(channel)
      }
    }
  }, [conversationId, user, supabase, onNewMessage])
}