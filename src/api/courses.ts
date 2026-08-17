import { apiFetch } from './client'
import type { Course, CourseRequest } from './types'

export const coursesApi = {
  list: () => apiFetch<Course[]>('/api/courses'),
  create: (request: CourseRequest) =>
    apiFetch<Course>('/api/courses', { method: 'POST', body: request }),
  remove: (id: number) => apiFetch<void>(`/api/courses/${id}`, { method: 'DELETE' }),
}
