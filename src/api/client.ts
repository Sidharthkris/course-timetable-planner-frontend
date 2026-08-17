import { getStoredCredentials, clearStoredCredentials } from '../auth/credentials'
import type { ApiError, ScheduleConflictError } from './types'

/** Base error for any non-2xx API response that isn't a schedule conflict. */
export class ApiHttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiHttpError'
    this.status = status
  }
}

/** Thrown specifically for 409 responses from schedule-entry writes, carrying the entries it clashed with. */
export class ScheduleConflictApiError extends ApiHttpError {
  readonly conflictingEntries: ScheduleConflictError['conflictingEntries']

  constructor(body: ScheduleConflictError) {
    super(409, body.message)
    this.name = 'ScheduleConflictApiError'
    this.conflictingEntries = body.conflictingEntries
  }
}

/** Thrown on 401 — credentials are missing or rejected. Callers should send the user back to login. */
export class UnauthorizedApiError extends ApiHttpError {
  constructor(message: string) {
    super(401, message)
    this.name = 'UnauthorizedApiError'
  }
}

/** Thrown on 403 — authenticated, but the current role isn't allowed to do this (e.g. instructor writing). */
export class ForbiddenApiError extends ApiHttpError {
  constructor(message: string) {
    super(403, message)
    this.name = 'ForbiddenApiError'
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | undefined>
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(path, window.location.origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.pathname + url.search
}

/**
 * Typed fetch wrapper used by every api/*.ts module. Attaches the stored
 * Basic Auth header, parses JSON responses, and translates non-2xx
 * responses into the specific error classes above so callers can
 * `catch` and branch on error type rather than re-parsing status codes
 * everywhere.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const credentials = getStoredCredentials()
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (credentials) {
    headers.Authorization = credentials.basicAuthHeader
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : undefined

  if (response.ok) {
    return payload as T
  }

  if (response.status === 401) {
    clearStoredCredentials()
    throw new UnauthorizedApiError((payload as ApiError)?.message ?? 'Please log in again.')
  }

  if (response.status === 403) {
    throw new ForbiddenApiError(
      (payload as ApiError)?.message ?? 'Only a coordinator can perform this action.'
    )
  }

  if (response.status === 409 && payload && 'conflictingEntries' in payload) {
    throw new ScheduleConflictApiError(payload as ScheduleConflictError)
  }

  throw new ApiHttpError(response.status, (payload as ApiError)?.message ?? response.statusText)
}
