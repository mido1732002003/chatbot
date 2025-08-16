import type { ConversationWithParticipants, MessageWithSender } from '@/types/chat'
import type { Profile } from '@/types/database'

/**
 * Get the other participant in a conversation
 */
export function getOtherParticipant(
  conversation: ConversationWithParticipants,
  currentUserId: string
): Profile {
  if (conversation.member_one === currentUserId) {
    return conversation.member_two_profile
  }
  return conversation.member_one_profile
}

/**
 * Get display name for a conversation
 */
export function getConversationDisplayName(
  conversation: ConversationWithParticipants,
  currentUserId: string
): string {
  const otherUser = getOtherParticipant(conversation, currentUserId)
  return otherUser.full_name || otherUser.username
}

/**
 * Format timestamp for display
 */
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

/**
 * Format a full timestamp
 */
export function formatFullTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Group messages by sender for display optimization
 */
export function groupMessagesBySender(messages: MessageWithSender[]): MessageWithSender[][] {
  const groups: MessageWithSender[][] = []
  let currentGroup: MessageWithSender[] = []
  let lastSenderId: string | null = null

  messages.forEach(message => {
    if (message.sender_id !== lastSenderId && currentGroup.length > 0) {
      groups.push(currentGroup)
      currentGroup = []
    }
    currentGroup.push(message)
    lastSenderId = message.sender_id
  })

  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }

  return groups
}

/**
 * Check if two messages are from the same day
 */
export function isSameDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

/**
 * Get initials from a name or username
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Sanitize message content (basic XSS prevention)
 */
export function sanitizeMessage(message: string): string {
  return message
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Parse URLs in message text (for future link preview feature)
 */
export function parseMessageUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.match(urlRegex) || []
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}