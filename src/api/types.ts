// Mirrors the Java records in com.portfolio.timetable.dto on the backend.
// Keeping these as plain interfaces (not classes) since they're pure data
// shapes coming back from JSON — there's no behavior to attach.

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export const ALL_DAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

export interface Department {
  id: number
  code: string
  name: string
}

export interface Instructor {
  id: number
  fullName: string
  email: string | null
  department: Department | null
}

export interface Room {
  id: number
  roomNumber: string
  building: string | null
  capacity: number
}

export interface Course {
  id: number
  code: string
  title: string
  creditHours: number
  department: Department | null
}

export interface ScheduleEntry {
  id: number
  course: Course
  instructor: Instructor
  room: Room
  dayOfWeek: DayOfWeek
  startTime: string // "HH:mm" or "HH:mm:ss" as returned by Jackson for LocalTime
  endTime: string
}

/** Request payload shapes — what the frontend sends, not what it receives. */
export interface DepartmentRequest {
  code: string
  name: string
}

export interface InstructorRequest {
  fullName: string
  email: string | null
  departmentId: number
}

export interface RoomRequest {
  roomNumber: string
  building: string | null
  capacity: number
}

export interface CourseRequest {
  code: string
  title: string
  creditHours: number
  departmentId: number
}

export interface ScheduleEntryRequest {
  courseId: number
  instructorId: number
  roomId: number
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
}

/** Spring Data's Page<T> JSON shape — only the fields this app actually reads. */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
}

export interface ApiError {
  timestamp: string
  status: number
  error: string
  message: string
}

export interface ScheduleConflictError extends ApiError {
  conflictingEntries: ScheduleEntry[]
}

export interface CurrentUser {
  username: string
  roles: string[]
}
