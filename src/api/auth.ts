import { apiFetch } from './client'
import type { CurrentUser } from './types'

/**
 * Calls GET /api/me — a small addition to the backend beyond what it
 * already had, returning the authenticated user's username and roles.
 * There's no dedicated /login endpoint to call: with HTTP Basic auth,
 * "logging in" just means attaching credentials and trying a request
 * that requires authentication. If they're wrong, this throws
 * UnauthorizedApiError, which the login form catches directly.
 */
export const authApi = {
  me: () => apiFetch<CurrentUser>('/api/me'),
}
