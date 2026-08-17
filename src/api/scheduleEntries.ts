import { apiFetch } from './client'
import type { DayOfWeek, Page, ScheduleEntry, ScheduleEntryRequest } from './types'

export const scheduleEntriesApi = {
  /**
   * Mirrors GET /api/schedule-entries?instructorId=&roomId=&courseId=&dayOfWeek=&size=&sort=
   * The frontend's calendar view calls this with a large page size to fetch
   * "everything" in one request, same simplification the Thymeleaf GUI makes.
   */
  search: (params: {
    instructorId?: number
    roomId?: number
    courseId?: number
    dayOfWeek?: DayOfWeek
    size?: number
  }) =>
    apiFetch<Page<ScheduleEntry>>('/api/schedule-entries', {
      query: {
        instructorId: params.instructorId,
        roomId: params.roomId,
        courseId: params.courseId,
        dayOfWeek: params.dayOfWeek,
        size: params.size ?? 200,
        sort: 'dayOfWeek,startTime',
      },
    }),

  create: (request: ScheduleEntryRequest) =>
    apiFetch<ScheduleEntry>('/api/schedule-entries', { method: 'POST', body: request }),

  checkConflicts: (request: ScheduleEntryRequest) =>
    apiFetch<ScheduleEntry[]>('/api/schedule-entries/check-conflicts', {
      method: 'POST',
      body: request,
    }),

  remove: (id: number) => apiFetch<void>(`/api/schedule-entries/${id}`, { method: 'DELETE' }),
}
