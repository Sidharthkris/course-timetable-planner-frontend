import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { instructorsApi } from '../api/instructors'
import { departmentsApi } from '../api/departments'
import type { Department, Instructor } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Alert } from '../components/Alert'
import { ConfirmButton } from '../components/ConfirmButton'
import { ApiHttpError } from '../api/client'

export function InstructorsPage() {
  const { isCoordinator } = useAuth()
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [departmentId, setDepartmentId] = useState<number | ''>('')

  async function reload() {
    setIsLoading(true)
    try {
      const [instructorList, departmentList] = await Promise.all([
        instructorsApi.list(),
        departmentsApi.list(),
      ])
      setInstructors(instructorList)
      setDepartments(departmentList)
      if (departmentList.length > 0 && departmentId === '') {
        setDepartmentId(departmentList[0].id)
      }
    } catch (err) {
      setError(err instanceof ApiHttpError ? err.message : 'Failed to load instructors.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    if (departmentId === '') {
      setError('Choose a department first.')
      return
    }
    try {
      await instructorsApi.create({ fullName, email: email || null, departmentId })
      setFullName('')
      setEmail('')
      setSuccess('Instructor added.')
      await reload()
    } catch (err) {
      setError(err instanceof ApiHttpError ? err.message : 'Failed to create instructor.')
    }
  }

  async function handleDelete(id: number) {
    setError(null)
    setSuccess(null)
    try {
      await instructorsApi.remove(id)
      setSuccess('Instructor deleted.')
      await reload()
    } catch (err) {
      setError(err instanceof ApiHttpError ? err.message : 'Failed to delete instructor.')
    }
  }

  return (
    <div>
      <h1>Instructors</h1>

      {error && <Alert kind="error">{error}</Alert>}
      {success && <Alert kind="success">{success}</Alert>}

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              {isCoordinator && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {instructors.map((instructor) => (
              <tr key={instructor.id}>
                <td>{instructor.fullName}</td>
                <td>{instructor.email}</td>
                <td>{instructor.department?.name ?? '—'}</td>
                {isCoordinator && (
                  <td>
                    <ConfirmButton
                      label="Delete"
                      confirmMessage="Delete this instructor?"
                      onConfirm={() => handleDelete(instructor.id)}
                    />
                  </td>
                )}
              </tr>
            ))}
            {instructors.length === 0 && (
              <tr>
                <td colSpan={isCoordinator ? 4 : 3}>No instructors yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {isCoordinator && (
        <div className="form-card">
          <h2>Add an instructor</h2>
          {departments.length === 0 ? (
            <p className="hint">Add a department first.</p>
          ) : (
            <form onSubmit={handleCreate} className="form">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

              <label htmlFor="departmentId">Department</label>
              <select
                id="departmentId"
                required
                value={departmentId}
                onChange={(e) => setDepartmentId(Number(e.target.value))}
              >
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>

              <button type="submit">Add instructor</button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
