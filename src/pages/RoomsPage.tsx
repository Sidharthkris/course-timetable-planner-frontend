import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { roomsApi } from '../api/rooms'
import type { Room } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Alert } from '../components/Alert'
import { ConfirmButton } from '../components/ConfirmButton'
import { ApiHttpError } from '../api/client'

export function RoomsPage() {
  const { isCoordinator } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [roomNumber, setRoomNumber] = useState('')
  const [building, setBuilding] = useState('')
  const [capacity, setCapacity] = useState(30)

  async function reload() {
    setIsLoading(true)
    try {
      setRooms(await roomsApi.list())
    } catch (err) {
      setError(err instanceof ApiHttpError ? err.message : 'Failed to load rooms.')
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
      await roomsApi.create({ roomNumber, building: building || null, capacity })
      setRoomNumber('')
      setBuilding('')
      setCapacity(30)
      setSuccess('Room created.')
      await reload()
    } catch (err) {
      setError(err instanceof ApiHttpError ? err.message : 'Failed to create room.')
    }
  }

  async function handleDelete(id: number) {
    setError(null)
    setSuccess(null)
    try {
      await roomsApi.remove(id)
      setSuccess('Room deleted.')
      await reload()
    } catch (err) {
      setError(err instanceof ApiHttpError ? err.message : 'Failed to delete room.')
    }
  }

  return (
    <div>
      <h1>Rooms</h1>

      {error && <Alert kind="error">{error}</Alert>}
      {success && <Alert kind="success">{success}</Alert>}

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Room number</th>
              <th>Building</th>
              <th>Capacity</th>
              {isCoordinator && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id}>
                <td>{room.roomNumber}</td>
                <td>{room.building}</td>
                <td>{room.capacity}</td>
                {isCoordinator && (
                  <td>
                    <ConfirmButton
                      label="Delete"
                      confirmMessage="Delete this room?"
                      onConfirm={() => handleDelete(room.id)}
                    />
                  </td>
                )}
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td colSpan={isCoordinator ? 4 : 3}>No rooms yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {isCoordinator && (
        <div className="form-card">
          <h2>Add a room</h2>
          <form onSubmit={handleCreate} className="form">
            <label htmlFor="roomNumber">Room number</label>
            <input
              id="roomNumber"
              required
              placeholder="e.g. 101"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
            />

            <label htmlFor="building">Building</label>
            <input
              id="building"
              placeholder="e.g. Main Building"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
            />

            <label htmlFor="capacity">Capacity</label>
            <input
              id="capacity"
              type="number"
              min={1}
              required
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />

            <button type="submit">Add room</button>
          </form>
        </div>
      )}
    </div>
  )
}
