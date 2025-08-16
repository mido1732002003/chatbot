import { useState, useCallback } from 'react'
import { getClient } from '@/lib/supabase/client'
import type { MessageWithSender } from '@/types/chat'
import type { MessageInsert } from '@/types/database'

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = getClient()

  /**
   * Fetch messages for a conversation
   */
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(50) // Initial load limit

      if (error) throw error

      setMessages(data as unknown as MessageWithSender[])
    } catch (err: any) {
      console.error('Error fetching messages:', err)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [conversationId, supabase])

  /**
   * Load more messages (pagination)
   */
  const loadMoreMessages = useCallback(async () => {
    if (messages.length === 0) return

    try {
      const oldestMessage = messages[0]
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*)
        `)
        .eq('conversation_id', conversationId)
        .lt('created_at', oldestMessage.created_at)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      if (data && data.length > 0) {
        setMessages(prev => [...(data as unknown as MessageWithSender[]).reverse(), ...prev])
      }
    } catch (err: any) {
      console.error('Error loading more messages:', err)
    }
  }, [messages, conversationId, supabase])

  /**
   * Send a new message
   */
  const sendMessage = useCallback(async (messageData: MessageInsert) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*)
        `)
        .single()

      if (error) throw error

      // Optimistically add the message
      if (data) {
        setMessages(prev => [...prev, data as unknown as MessageWithSender])
      }

      return data
    } catch (err: any) {
      console.error('Error sending message:', err)
      setError('Failed to send message')
      throw err
    }
  }, [supabase])

  /**
   * Add a message to the list (for realtime updates)
   */
  const addMessage = useCallback(async (message: any) => {
    // Check if message already exists
    setMessages(prev => {
      const exists = prev.some(m => m.id === message.id)
      if (exists) return prev
      
      // Fetch sender profile if not included
      if (!message.sender) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', message.sender_id)
          .single()
          .then(({ data }) => {
            if (data) {
              setMessages(current => 
                current.map(m => 
                  m.id === message.id 
                    ? { ...m, sender: data }
                    : m
                )
              )
            }
          })
      }
      
      return [...prev, message]
    })
  }, [supabase])

  return {
    messages,
    loading,
    error,
    fetchMessages,
    loadMoreMessages,
    sendMessage,
    addMessage,
  }
}