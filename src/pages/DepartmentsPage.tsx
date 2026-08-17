import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { departmentsApi } from '../api/departments'
import type { Department } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Alert } from '../components/Alert'
import { ConfirmButton } from '../components/ConfirmButton'
import { ApiHttpError } from '../api/client'

export function DepartmentsPage() {
  const { isCoordinator } = useAuth()
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [code, setCode] = useState('')
  const [name, setName] = useState('')

  async function reload() {
    setIsLoading(true)
    try {
      setDepartments(await departmentsApi.list())
    } catch (err) {
      setError(err instanceof ApiHttpError ? err.message : 'Failed to load departments.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      await departmentsApi.create({ code, name })
      setCode('')
      setName('')
      setSuccess('Department created.')
      await reload()
    } catch (err) {
      setError(err instanceof ApiHttpError ? err.message : 'Failed to create department.')
    }
  }

  async function handleDelete(id: number) {
    setError(null)
    setSuccess(null)
    try {
      await departmentsApi.remove(id)
      setSuccess('Department deleted.')
      await reload()
    } catch (err) {
      setError(err instanceof ApiHttpError ? err.message : 'Failed to delete department.')
    }
  }

  return (
    <div>
      <h1>Departments</h1>

      {error && <Alert kind="error">{error}</Alert>}
      {success && <Alert kind="success">{success}</Alert>}

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              {isCoordinator && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {departments.map((department) => (
              <tr key={department.id}>
                <td>{department.code}</td>
                <td>{department.name}</td>
                {isCoordinator && (
                  <td>
                    <ConfirmButton
                      label="Delete"
                      confirmMessage="Delete this department?"
                      onConfirm={() => handleDelete(department.id)}
                    />
                  </td>
                )}
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={isCoordinator ? 3 : 2}>No departments yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {isCoordinator && (
        <div className="form-card">
          <h2>Add a department</h2>
          <form onSubmit={handleCreate} className="form">
            <label htmlFor="code">Code</label>
            <input id="code" required placeholder="e.g. CS" value={code} onChange={(e) => setCode(e.target.value)} />

            <label htmlFor="name">Name</label>
            <input
              id="name"
              required
              placeholder="e.g. Computer Science"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <button type="submit">Add department</button>
          </form>
        </div>
      )}
    </div>
  )
}
