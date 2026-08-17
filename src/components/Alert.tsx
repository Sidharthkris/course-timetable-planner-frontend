import type { ReactNode } from 'react'

interface AlertProps {
  kind: 'error' | 'success' | 'info'
  children: ReactNode
}

export function Alert({ kind, children }: AlertProps) {
  return <p className={`alert alert-${kind}`}>{children}</p>
}
