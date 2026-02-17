'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { logger } from '@shared/lib/logger'
import { cn } from '@shared/lib/cn'

type ErrorBoundaryProps = {
  children: React.ReactNode
  /** Custom fallback UI. Receives the caught error. */
  fallback?: (error: Error) => React.ReactNode
  /** Called when an error is caught, in addition to logging. */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** Optional className applied to the default fallback wrapper. */
  className?: string
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

const boundaryLogger = logger.child({ domain: 'error-boundary' })

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    boundaryLogger.error('Unhandled render error caught by boundary', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack ?? undefined,
    })

    this.props.onError?.(error, errorInfo)
  }

  render(): React.ReactNode {
    const { hasError, error } = this.state
    const { children, fallback, className } = this.props

    if (!hasError || !error) return children

    if (fallback) return fallback(error)

    return <DefaultFallback error={error} className={className} />
  }
}

// --- Default fallback UI ---

type DefaultFallbackProps = {
  error: Error
  className?: string
}

function DefaultFallback({ error, className }: DefaultFallbackProps) {
  return (
    <div
      className={cn(
        'flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-border bg-elevated p-8 text-center',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-error/30 bg-error/10">
        <AlertTriangle className="h-6 w-6 text-error" aria-hidden="true" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Something went wrong</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          An unexpected error occurred. Try refreshing the page — if the problem persists, contact
          support.
        </p>
      </div>

      {process.env.NODE_ENV !== 'production' && (
        <details className="mt-2 max-w-sm text-left">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            Error details (dev only)
          </summary>
          <pre className="mt-2 overflow-auto rounded border border-border bg-surface p-3 text-xs text-error">
            {error.message}
            {error.stack ? `\n\n${error.stack}` : ''}
          </pre>
        </details>
      )}
    </div>
  )
}
