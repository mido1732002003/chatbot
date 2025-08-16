'use client'

import { useState, useEffect } from 'react'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { useMessages } from '@/hooks/useMessages'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import { getOtherParticipant } from '@/lib/utils/conversation'
import type { ConversationWithParticipants } from '@/types/chat'

interface ConversationAreaProps {
  conversation: ConversationWithParticipants
  onBack?: () => void
}

export function ConversationArea({ conversation, onBack }: ConversationAreaProps) {
  const { user } = useAuthContext()
  const { messages, loading, error, fetchMessages, addMessage } = useMessages(conversation.id)
  const [isSending, setIsSending] = useState(false)
  
  // Subscribe to realtime messages
  useRealtimeMessages(conversation.id, (newMessage) => {
    addMessage(newMessage)
  })

  useEffect(() => {
    fetchMessages()
  }, [conversation.id])

  if (!user) return null

  const otherUser = getOtherParticipant(conversation, user.id)

  const handleSendMessage = async (messageText: string) => {
    setIsSending(true)
    try {
      await addMessage({
        conversation_id: conversation.id,
        sender_id: user.id,
        body: messageText,
      })
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Conversation Header */}
      <div className="border-b px-4 py-3 flex items-center gap-3 bg-background">
        {/* Back button for mobile */}
        <button
          onClick={onBack}
          className="md:hidden p-1 hover:bg-accent rounded-md transition-colors"
          aria-label="Back to conversations"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 flex-1">
          {otherUser.avatar_url ? (
            <img
              src={otherUser.avatar_url}
              alt={otherUser.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {(otherUser.full_name || otherUser.username)[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium">{otherUser.full_name || otherUser.username}</p>
            <p className="text-xs text-muted-foreground">@{otherUser.username}</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <MessageList
        messages={messages}
        currentUserId={user.id}
        loading={loading}
        error={error}
      />

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isSending}
        placeholder={`Message @${otherUser.username}`}
      />
    </div>
  )
}