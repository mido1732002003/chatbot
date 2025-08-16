'use client'

import { useAuthContext } from '@/components/providers/AuthProvider'

interface HeaderProps {
  onMenuToggle?: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, profile, signOut } = useAuthContext()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="bg-background border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 hover:bg-accent rounded-md transition-colors"
            aria-label="Toggle menu"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* App Title */}
          <h1 className="text-xl font-semibold">Chat App</h1>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          {profile && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {profile.full_name || profile.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  @{profile.username}
                </p>
              </div>
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {(profile.full_name || profile.username)[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="button-ghost text-sm"
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}