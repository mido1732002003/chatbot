'use client'

import { useState, useEffect } from 'react'
import { UserList } from './UserList'
import { ConversationArea } from './ConversationArea'
import { Header } from '@/components/shared/Header'
import { useConversation } from '@/hooks/useConversation'
import type { Profile, Conversation } from '@/types/database'
import type { ConversationWithParticipants } from '@/types/chat'

export function ChatLayout() {
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [activeConversation, setActiveConversation] = useState<ConversationWithParticipants | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { getOrCreateConversation, loading: conversationLoading } = useConversation()

  // Handle user selection
  const handleUserSelect = async (user: Profile) => {
    setSelectedUser(user)
    setIsMobileMenuOpen(false) // Close mobile menu on selection

    // Get or create conversation with selected user
    const conversation = await getOrCreateConversation(user.id)
    if (conversation) {
      setActiveConversation(conversation)
    }
  }

  // Handle closing conversation (mobile)
  const handleCloseConversation = () => {
    setSelectedUser(null)
    setActiveConversation(null)
    setIsMobileMenuOpen(true)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - User List */}
        <aside
          className={`
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0 
            fixed md:relative
            z-20 md:z-0
            w-full md:w-80 lg:w-96
            h-full
            bg-background
            border-r
            transition-transform duration-200 ease-in-out
          `}
        >
          <UserList
            onUserSelect={handleUserSelect}
            selectedUserId={selectedUser?.id}
          />
        </aside>

        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {activeConversation ? (
            <ConversationArea
              conversation={activeConversation}
              onBack={handleCloseConversation}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <svg
                  className="w-16 h-16 mx-auto text-muted-foreground/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <h2 className="text-lg font-medium">Select a conversation</h2>
                <p className="text-sm">Choose a user from the list to start chatting</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}