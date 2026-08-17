import { describe, expect, it } from 'vitest'
import { buildGrid, rowIndexFor, ROW_COUNT } from './calendarGrid'
import type { Course, Department, Instructor, Room, ScheduleEntry } from '../api/types'

function entry(
  id: number,
  dayOfWeek: ScheduleEntry['dayOfWeek'],
  startTime: string,
  endTime: string,
  courseCode: string,
  instructorName: string,
  roomNumber: string
): ScheduleEntry {
  const department: Department = { id: 1, code: 'CS', name: 'Computer Science' }
  const course: Course = { id, code: courseCode, title: `${courseCode} title`, creditHours: 3, department }
  const instructor: Instructor = {
    id,
    fullName: instructorName,
    email: `${instructorName}@x.com`,
    department,
  }
  const room: Room = { id, roomNumber, building: 'Main', capacity: 40 }
  return { id, course, instructor, room, dayOfWeek, startTime, endTime }
}

describe('calendarGrid', () => {
  it('places an entry in the correct day and hourly row', () => {
    const e1 = entry(1, 'MONDAY', '09:00', '11:00', 'CS101', 'Dr. Rao', '101')
    const grid = buildGrid([e1])

    const row = rowIndexFor('09:00')
    const cell = grid.cellsByDay.MONDAY[row]

    expect(cell).toHaveLength(1)
    expect(cell[0]).toBe(e1)
  })

  it('places a non-hour-aligned start time into its containing hourly row', () => {
    const e = entry(1, 'WEDNESDAY', '14:30', '15:30', 'CS102', 'Dr. Iyer', '102')
    const grid = buildGrid([e])

    const row = rowIndexFor('14:30')
    expect(row).toBe(6) // 14:00 is the 7th row (index 6) counting from 08:00
    expect(grid.cellsByDay.WEDNESDAY[row]).toHaveLength(1)
  })

  it('shows concurrent entries in different rooms in the same cell, not overwriting each other', () => {
    // Same day, same start time, different room/instructor — a legitimate
    // real-world case the backend's conflict detector explicitly allows.
    const e1 = entry(1, 'MONDAY', '09:00', '10:00', 'CS101', 'Dr. Rao', '101')
    const e2 = entry(2, 'MONDAY', '09:00', '10:00', 'DS101', 'Dr. Iyer', '202')

    const grid = buildGrid([e1, e2])
    const cell = grid.cellsByDay.MONDAY[rowIndexFor('09:00')]

    expect(cell).toHaveLength(2)
    expect(cell).toContain(e1)
    expect(cell).toContain(e2)
  })

  it('reports entries before the grid start as out-of-range instead of dropping them', () => {
    const early = entry(1, 'FRIDAY', '07:00', '08:00', 'EARLY', 'Dr. X', '1')
    const grid = buildGrid([early])

    expect(grid.outOfRangeEntries).toContain(early)
    expect(grid.cellsByDay.FRIDAY.every((cell) => cell.length === 0)).toBe(true)
  })

  it('reports entries at or after the grid end as out-of-range', () => {
    const late = entry(1, 'FRIDAY', '20:00', '21:00', 'LATE', 'Dr. Y', '2')
    const grid = buildGrid([late])

    expect(grid.outOfRangeEntries).toContain(late)
  })

  it('treats the grid start boundary as inclusive', () => {
    const onTime = entry(1, 'FRIDAY', '08:00', '09:00', 'ONTIME', 'Dr. Z', '3')
    const grid = buildGrid([onTime])

    expect(grid.outOfRangeEntries).not.toContain(onTime)
    expect(rowIndexFor('08:00')).toBe(0)
  })

  it('has twelve hourly rows from 08:00 to 20:00', () => {
    const grid = buildGrid([])
    expect(grid.rowStartTimes).toHaveLength(ROW_COUNT)
    expect(grid.rowStartTimes[0]).toBe('08:00')
    expect(grid.rowStartTimes[11]).toBe('19:00')
  })

  it('includes every day of the week even with no entries', () => {
    const grid = buildGrid([])
    const days: ScheduleEntry['dayOfWeek'][] = [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
      'SUNDAY',
    ]
    for (const day of days) {
      expect(grid.cellsByDay[day]).toHaveLength(ROW_COUNT)
      expect(grid.cellsByDay[day][0]).toEqual([])
    }
    expect(grid.outOfRangeEntries).toEqual([])
  })

  it('parses HH:mm:ss the same as HH:mm (both are valid Jackson LocalTime serializations)', () => {
    const withSeconds = entry(1, 'MONDAY', '09:00:00', '10:00:00', 'CS101', 'Dr. Rao', '101')
    const grid = buildGrid([withSeconds])

    expect(grid.outOfRangeEntries).toHaveLength(0)
    expect(grid.cellsByDay.MONDAY[rowIndexFor('09:00:00')]).toHaveLength(1)
  })
})
