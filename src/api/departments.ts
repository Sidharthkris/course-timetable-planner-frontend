import { apiFetch } from './client'
import type { Department, DepartmentRequest } from './types'

export const departmentsApi = {
  list: () => apiFetch<Department[]>('/api/departments'),
  create: (request: DepartmentRequest) =>
    apiFetch<Department>('/api/departments', { method: 'POST', body: request }),
  remove: (id: number) => apiFetch<void>(`/api/departments/${id}`, { method: 'DELETE' }),
}
