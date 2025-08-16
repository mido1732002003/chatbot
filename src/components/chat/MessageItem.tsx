'use client'

import { formatMessageTime } from '@/lib/utils/conversation'
import type { MessageWithSender } from '@/types/chat'

interface MessageItemProps {
  message: MessageWithSender
  isOwn: boolean
  showSender?: boolean
}

export function MessageItem({ message, isOwn, showSender }: MessageItemProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name (for received messages) */}
        {showSender && !isOwn && (
          <p className="text-xs text-muted-foreground mb-1 ml-2">
            {message.sender.full_name || message.sender.username}
          </p>
        )}

        {/* Message bubble */}
        <div
          className={`
            chat-message
            ${isOwn ? 'chat-message-sent' : 'chat-message-received'}
          `}
        >
          <p className="break-words whitespace-pre-wrap">{message.body}</p>
        </div>

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-1 ml-2">
          {formatMessageTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}