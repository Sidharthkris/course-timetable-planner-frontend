import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { scheduleEntriesApi } from '../api/scheduleEntries'
import { coursesApi } from '../api/courses'
import { instructorsApi } from '../api/instructors'
import { roomsApi } from '../api/rooms'
import type { Course, DayOfWeek, Instructor, Room, ScheduleEntry } from '../api/types'
import { ALL_DAYS } from '../api/types'
import { buildGrid } from '../calendar/calendarGrid'
import { useAuth } from '../auth/AuthContext'
import { Alert } from '../components/Alert'
import { ConfirmButton } from '../components/ConfirmButton'
import { ApiHttpError, ScheduleConflictApiError } from '../api/client'

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
}

export function SchedulePage() {
  const { isCoordinator } = useAuth()
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<ScheduleEntry[]>([])

  const [courseId, setCourseId] = useState<number | ''>('')
  const [instructorId, setInstructorId] = useState<number | ''>('')
  const [roomId, setRoomId] = useState<number | ''>('')
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('MONDAY')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')

  async function reload() {
    setIsLoading(true)
    try {
      const [entryPage, courseList, instructorList, roomList] = await Promise.all([
        scheduleEntriesApi.search({}),
        coursesApi.list(),
        instructorsApi.list(),
        roomsApi.list(),
      ])
      setEntries(entryPage.content)
      setCourses(courseList)
      setInstructors(instructorList)
      setRooms(roomList)
      if (courseList.length > 0 && courseId === '') setCourseId(courseList[0].id)
      if (instructorList.length > 0 && instructorId === '') setInstructorId(instructorList[0].id)
      if (roomList.length > 0 && roomId === '') setRoomId(roomList[0].id)
    } catch (err) {
      setError(err instanceof ApiHttpError ? err.message : 'Failed to load the schedule.')
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
    setConflicts([])
    if (courseId === '' || instructorId === '' || roomId === '') {
      setError('Choose a course, instructor, and room first.')
      return
    }
    try {
      await scheduleEntriesApi.create({ courseId, instructorId, roomId, dayOfWeek, startTime, endTime })
      setSuccess('Schedule entry created.')
      await reload()
    } catch (err) {
      if (err instanceof ScheduleConflictApiError) {
        setError(err.message)
        setConflicts(err.conflictingEntries)
      } else {
        setError(err instanceof ApiHttpError ? err.message : 'Failed to create schedule entry.')
      }
    }
  }

  async function handleDelete(id: number) {
    setError(null)
    setSuccess(null)
    try {
      await scheduleEntriesApi.remove(id)
      setSuccess('Schedule entry deleted.')
      await reload()
    } catch (err) {
      setError(err instanceof ApiHttpError ? err.message : 'Failed to delete schedule entry.')
    }
  }

  if (isLoading) {
    return <p>Loading…</p>
  }

  const grid = buildGrid(entries)

  return (
    <div>
      <h1>Weekly Schedule</h1>

      {error && (
        <Alert kind="error">
          {error}
          {conflicts.length > 0 && (
            <ul className="conflict-list">
              {conflicts.map((c) => (
                <li key={c.id}>
                  {DAY_LABELS[c.dayOfWeek]} {c.startTime}–{c.endTime}: {c.course.code} with{' '}
                  {c.instructor.fullName} in room {c.room.roomNumber}
                </li>
              ))}
            </ul>
          )}
        </Alert>
      )}
      {success && <Alert kind="success">{success}</Alert>}

      <div className="calendar-scroll">
        <table className="calendar-table">
          <thead>
            <tr>
              <th className="time-col">Time</th>
              {ALL_DAYS.map((day) => (
                <th key={day}>{DAY_LABELS[day]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rowStartTimes.map((rowLabel, rowIndex) => (
              <tr key={rowLabel}>
                <td className="time-col">{rowLabel}</td>
                {ALL_DAYS.map((day) => (
                  <td key={day}>
                    {grid.cellsByDay[day][rowIndex].map((entry) => (
                      <div className="entry-chip" key={entry.id}>
                        <div className="entry-time">
                          {entry.startTime}–{entry.endTime}
                        </div>
                        <div className="entry-course">{entry.course.code}</div>
                        <div className="entry-meta">{entry.instructor.fullName}</div>
                        <div className="entry-meta">Room {entry.room.roomNumber}</div>
                        {isCoordinator && (
                          <ConfirmButton
                            label="Delete"
                            confirmMessage="Delete this schedule entry?"
                            onConfirm={() => handleDelete(entry.id)}
                            className="link-button danger entry-delete"
                          />
                        )}
                      </div>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {grid.outOfRangeEntries.length > 0 && (
        <div className="form-card" style={{ marginTop: '1.5rem' }}>
          <h2>Outside displayed hours (before 08:00 or at/after 20:00)</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Course</th>
                <th>Instructor</th>
                <th>Room</th>
                {isCoordinator && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {grid.outOfRangeEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{DAY_LABELS[entry.dayOfWeek]}</td>
                  <td>
                    {entry.startTime} - {entry.endTime}
                  </td>
                  <td>
                    {entry.course.code} — {entry.course.title}
                  </td>
                  <td>{entry.instructor.fullName}</td>
                  <td>{entry.room.roomNumber}</td>
                  {isCoordinator && (
                    <td>
                      <ConfirmButton
                        label="Delete"
                        confirmMessage="Delete this schedule entry?"
                        onConfirm={() => handleDelete(entry.id)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCoordinator && (
        <div className="form-card" style={{ marginTop: '1.5rem' }}>
          <h2>Add a schedule entry</h2>
          {courses.length === 0 || instructors.length === 0 || rooms.length === 0 ? (
            <p className="hint">
              Add at least one course, instructor, and room before scheduling an entry.
            </p>
          ) : (
            <form onSubmit={handleCreate} className="form">
              <label htmlFor="courseId">Course</label>
              <select id="courseId" value={courseId} onChange={(e) => setCourseId(Number(e.target.value))}>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} — {course.title}
                  </option>
                ))}
              </select>

              <label htmlFor="instructorId">Instructor</label>
              <select
                id="instructorId"
                value={instructorId}
                onChange={(e) => setInstructorId(Number(e.target.value))}
              >
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.fullName}
                  </option>
                ))}
              </select>

              <label htmlFor="roomId">Room</label>
              <select id="roomId" value={roomId} onChange={(e) => setRoomId(Number(e.target.value))}>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.roomNumber} ({room.building})
                  </option>
                ))}
              </select>

              <label htmlFor="dayOfWeek">Day</label>
              <select
                id="dayOfWeek"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
              >
                {ALL_DAYS.map((day) => (
                  <option key={day} value={day}>
                    {DAY_LABELS[day]}
                  </option>
                ))}
              </select>

              <label htmlFor="startTime">Start time</label>
              <input
                id="startTime"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />

              <label htmlFor="endTime">End time</label>
              <input
                id="endTime"
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />

              <p className="hint">
                Grid displays 08:00–20:00; entries outside that range still save correctly and appear
                in the table above the form.
              </p>

              <button type="submit">Add to schedule</button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
