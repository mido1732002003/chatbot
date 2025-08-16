import type { Profile, Conversation, Message } from './database'

/**
 * Extended types for chat functionality
 */

// Message with sender profile information
export interface MessageWithSender extends Message {
  sender: Profile
}

// Conversation with participant profiles
export interface ConversationWithParticipants extends Conversation {
  member_one_profile: Profile
  member_two_profile: Profile
  last_message?: Message
  unread_count?: number
}

// Auth user type
export interface AuthUser {
  id: string
  email?: string
  profile?: Profile
}

// Form types
export interface SignUpFormData {
  email: string
  password: string
  username: string
  full_name?: string
}

export interface SignInFormData {
  email: string
  password: string
}

export interface UpdateProfileFormData {
  username?: string
  full_name?: string
  avatar_url?: string
}

// Chat state types
export interface ChatState {
  activeConversation: ConversationWithParticipants | null
  messages: MessageWithSender[]
  isLoadingMessages: boolean
  isLoadingConversation: boolean
  error: string | null
}

// Realtime event types
export type RealtimeMessageEvent = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Message
  old: Message | null
}