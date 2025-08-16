'use client'

import { useState, useEffect } from 'react'
import { getClient } from '@/lib/supabase/client'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import type { Profile } from '@/types/database'

interface UserListProps {
  onUserSelect: (user: Profile) => void
  selectedUserId?: string
}

export function UserList({ onUserSelect, selectedUserId }: UserListProps) {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { user: currentUser } = useAuthContext()
  const supabase = getClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser?.id) // Exclude current user
        .order('username')

      if (error) throw error

      setUsers(data || [])
    } catch (err: any) {
      console.error('Error fetching users:', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase()
    return (
      user.username.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query)
    )
  })

  const getUserDisplayName = (user: Profile) => {
    return user.full_name || user.username
  }

  const getUserInitials = (user: Profile) => {
    const name = getUserDisplayName(user)
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Messages</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base pl-10"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorMessage message={error} />
            <button
              onClick={fetchUsers}
              className="button-secondary w-full mt-2"
            >
              Retry
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? 'No users found matching your search' : 'No users available'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => onUserSelect(user)}
                className={`
                  w-full p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors
                  ${selectedUserId === user.id ? 'bg-accent' : ''}
                `}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={getUserDisplayName(user)}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {getUserInitials(user)}
                      </span>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium truncate">
                    {getUserDisplayName(user)}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{user.username}
                  </p>
                </div>

                {/* Online Status (placeholder for future) */}
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User count */}
      {!loading && !error && (
        <div className="p-3 border-t text-xs text-muted-foreground text-center">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} available
        </div>
      )}
    </div>
  )
}