import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { coursesApi } from '../api/courses'
import { departmentsApi } from '../api/departments'
import type { Course, Department } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Alert } from '../components/Alert'
import { ConfirmButton } from '../components/ConfirmButton'
import { ApiHttpError } from '../api/client'

export function CoursesPage() {
  const { isCoordinator } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [creditHours, setCreditHours] = useState(3)
  const [departmentId, setDepartmentId] = useState<number | ''>('')

  async function reload() {
    setIsLoading(true)
    try {
      const [courseList, departmentList] = await Promise.all([
        coursesApi.list(),
        departmentsApi.list(),
      ])
      setCourses(courseList)
      setDepartments(departmentList)
      if (departmentList.length > 0 && departmentId === '') {
        setDepartmentId(departmentList[0].id)
      }
    } catch (err) {
      setError(err instanceof ApiHttpError ? err.message : 'Failed to load courses.')
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
      await coursesApi.create({ code, title, creditHours, departmentId })
      setCode('')
      setTitle('')
      setCreditHours(3)
      setSuccess('Course added.')
      await reload()
    } catch (err) {
      setError(err instanceof ApiHttpError ? err.message : 'Failed to create course.')
    }
  }

  async function handleDelete(id: number) {
    setError(null)
    setSuccess(null)
    try {
      await coursesApi.remove(id)
      setSuccess('Course deleted.')
      await reload()
    } catch (err) {
      setError(err instanceof ApiHttpError ? err.message : 'Failed to delete course.')
    }
  }

  return (
    <div>
      <h1>Courses</h1>

      {error && <Alert kind="error">{error}</Alert>}
      {success && <Alert kind="success">{success}</Alert>}

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Title</th>
              <th>Credit hours</th>
              <th>Department</th>
              {isCoordinator && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.code}</td>
                <td>{course.title}</td>
                <td>{course.creditHours}</td>
                <td>{course.department?.name ?? '—'}</td>
                {isCoordinator && (
                  <td>
                    <ConfirmButton
                      label="Delete"
                      confirmMessage="Delete this course?"
                      onConfirm={() => handleDelete(course.id)}
                    />
                  </td>
                )}
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={isCoordinator ? 5 : 4}>No courses yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {isCoordinator && (
        <div className="form-card">
          <h2>Add a course</h2>
          {departments.length === 0 ? (
            <p className="hint">Add a department first.</p>
          ) : (
            <form onSubmit={handleCreate} className="form">
              <label htmlFor="code">Code</label>
              <input id="code" required placeholder="e.g. CS101" value={code} onChange={(e) => setCode(e.target.value)} />

              <label htmlFor="title">Title</label>
              <input
                id="title"
                required
                placeholder="e.g. Java Programming"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <label htmlFor="creditHours">Credit hours</label>
              <input
                id="creditHours"
                type="number"
                min={1}
                required
                value={creditHours}
                onChange={(e) => setCreditHours(Number(e.target.value))}
              />

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

              <button type="submit">Add course</button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
