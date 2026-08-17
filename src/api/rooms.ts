import { apiFetch } from './client'
import type { Room, RoomRequest } from './types'

export const roomsApi = {
  list: () => apiFetch<Room[]>('/api/rooms'),
  create: (request: RoomRequest) => apiFetch<Room>('/api/rooms', { method: 'POST', body: request }),
  remove: (id: number) => apiFetch<void>(`/api/rooms/${id}`, { method: 'DELETE' }),
}
