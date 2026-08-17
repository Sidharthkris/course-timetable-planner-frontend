// The backend authenticates via HTTP Basic (see SecurityConfig on the
// server) rather than issuing a token, so there's no login endpoint that
// returns a session artifact to store. Instead, the frontend holds the
// base64-encoded "username:password" pair itself and attaches it as an
// Authorization header on every request — the same thing a browser's
// built-in Basic Auth prompt would do, just driven by our own login form.
//
// sessionStorage (not localStorage) is deliberate: it's cleared when the
// tab closes, so credentials don't persist indefinitely on a shared
// machine. This mirrors the backend's own auth model rather than
// introducing a token scheme the API doesn't support — a real production
// deployment would likely move the backend to JWT/OAuth2 and this file
// would be the only place that needs to change.

const STORAGE_KEY = 'ctp_credentials'

export interface StoredCredentials {
  username: string
  basicAuthHeader: string
}

export function storeCredentials(username: string, password: string): StoredCredentials {
  const encoded = btoa(`${username}:${password}`)
  const credentials: StoredCredentials = {
    username,
    basicAuthHeader: `Basic ${encoded}`,
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))
  return credentials
}

export function getStoredCredentials(): StoredCredentials | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredCredentials
  } catch {
    return null
  }
}

export function clearStoredCredentials(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
