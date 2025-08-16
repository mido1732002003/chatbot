'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center space-y-4 max-w-md">
              <h2 className="text-2xl font-bold text-destructive">
                Something went wrong
              </h2>
              <p className="text-muted-foreground">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="button-primary"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}