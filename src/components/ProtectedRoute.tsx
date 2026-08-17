import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function ProtectedRoute() {
  const { username, isLoading } = useAuth()

  if (isLoading) {
    // Avoids a flash-of-login-page while we check stored credentials
    // against GET /api/me on initial load.
    return <div className="loading-screen">Loading…</div>
  }

  if (!username) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
