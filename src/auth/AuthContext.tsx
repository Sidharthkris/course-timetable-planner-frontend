import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../api/auth'
import { clearStoredCredentials, getStoredCredentials, storeCredentials } from './credentials'
import { UnauthorizedApiError } from '../api/client'

interface AuthState {
  username: string | null
  roles: string[]
  isCoordinator: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  // Starts true: on first load we don't yet know if stored credentials
  // (from an earlier tab session) are still valid, so routes should wait
  // rather than briefly flashing the login page.
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = getStoredCredentials()
    if (!stored) {
      setIsLoading(false)
      return
    }
    authApi
      .me()
      .then((user) => {
        setUsername(user.username)
        setRoles(user.roles)
      })
      .catch(() => {
        // Stored credentials were rejected (expired session, wrong
        // password changed elsewhere, etc.) — apiFetch already cleared
        // them on the 401; just reflect that here.
        setUsername(null)
        setRoles([])
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (usernameInput: string, password: string) => {
    storeCredentials(usernameInput, password)
    try {
      const user = await authApi.me()
      setUsername(user.username)
      setRoles(user.roles)
    } catch (err) {
      clearStoredCredentials()
      if (err instanceof UnauthorizedApiError) {
        throw new Error('Incorrect username or password.')
      }
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    clearStoredCredentials()
    setUsername(null)
    setRoles([])
  }, [])

  const isCoordinator = roles.includes('ROLE_COORDINATOR')

  return (
    <AuthContext.Provider value={{ username, roles, isCoordinator, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
