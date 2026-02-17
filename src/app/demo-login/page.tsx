'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DemoLoginPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      if (response.ok) {
        router.push('/')
        router.refresh()
      } else {
        setError('Invalid access code. Please try again.')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-primary">
      <div className="w-full max-w-md p-8 space-y-6 bg-bg-elevated rounded-lg border border-bg-surface">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Screen Print Pro</h1>
          <p className="mt-2 text-sm text-text-secondary">4Ink Demo Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-text-primary">
              Access Code
            </label>
            <input
              id="code"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter access code"
              className="w-full px-3 py-2 mt-1 border border-bg-surface rounded-md bg-bg-primary text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-action"
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || !code}
            className="w-full px-4 py-2 font-medium text-bg-primary bg-action rounded-md hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Verifying...' : 'Access Demo'}
          </button>
        </form>

        <p className="text-xs text-text-muted text-center">
          Demo access required. Contact support for access code.
        </p>
      </div>
    </div>
  )
}
