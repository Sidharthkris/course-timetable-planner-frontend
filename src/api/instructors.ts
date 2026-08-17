import { apiFetch } from './client'
import type { Instructor, InstructorRequest } from './types'

export const instructorsApi = {
  list: () => apiFetch<Instructor[]>('/api/instructors'),
  create: (request: InstructorRequest) =>
    apiFetch<Instructor>('/api/instructors', { method: 'POST', body: request }),
  remove: (id: number) => apiFetch<void>(`/api/instructors/${id}`, { method: 'DELETE' }),
}
