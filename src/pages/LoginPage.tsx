import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Alert } from '../components/Alert'

export function LoginPage() {
  const { username, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [usernameInput, setUsernameInput] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (username) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/schedule'
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(usernameInput, password)
      navigate('/schedule', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-body">
      <div className="auth-card">
        <h1>Course Timetable Planner</h1>
        <p className="subtitle">Sign in to continue</p>

        {error && <Alert kind="error">{error}</Alert>}

        <form onSubmit={handleSubmit} className="form">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            autoFocus
            required
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="demo-creds">
          <p>
            <strong>Demo accounts</strong>
          </p>
          <p>
            Coordinator (full access): <code>coordinator</code> / <code>coordinator123</code>
          </p>
          <p>
            Instructor (view only): <code>instructor</code> / <code>instructor123</code>
          </p>
        </div>
      </div>
    </div>
  )
}
