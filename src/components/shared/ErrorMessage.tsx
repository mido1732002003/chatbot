interface ErrorMessageProps {
  message: string
  className?: string
}

export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  return (
    <div
      className={`bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-3 text-sm ${className}`}
      role="alert"
    >
      <p>{message}</p>
    </div>
  )
}