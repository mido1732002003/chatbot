'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { validation } from '@/lib/utils/validation'

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({ 
  onSendMessage, 
  disabled, 
  placeholder = 'Type a message...' 
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async () => {
    const trimmedMessage = message.trim()
    
    if (!trimmedMessage || !validation.message.validate(trimmedMessage)) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSendMessage(trimmedMessage)
      setMessage('')
      
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSubmitting(false)
      // Refocus input after sending
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    
    // Enforce max length
    if (value.length <= validation.message.maxLength) {
      setMessage(value)
      
      // Auto-resize textarea
      e.target.style.height = 'auto'
      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
    }
  }

  const isDisabled = disabled || isSubmitting

  return (
    <div className="border-t p-4 bg-background">
      <form 
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        className="flex gap-2"
      >
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            rows={1}
            className="
              w-full resize-none rounded-lg border border-input bg-background 
              px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground 
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
              focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
              min-h-[40px] max-h-[120px]
            "
            aria-label="Message input"
          />
          
          {/* Character count */}
          {message.length > validation.message.maxLength * 0.9 && (
            <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {message.length}/{validation.message.maxLength}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isDisabled || !message.trim()}
          className="
            button-primary self-end
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          aria-label="Send message"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </form>
    </div>
  )
}