import type { DayOfWeek, ScheduleEntry } from '../api/types'
import { ALL_DAYS } from '../api/types'

/**
 * Ports the backend's CalendarGridBuilder (Java) logic to TypeScript,
 * deliberately kept identical in behavior: same 08:00–20:00 hourly
 * window, same "list per cell, not rowspan" design.
 *
 * Two courses can legitimately run at the same time in different rooms
 * — the conflict detector only forbids the same instructor or room
 * being double-booked, not the calendar slot itself. So each cell holds
 * a *list* of entries rather than at most one, and entries are anchored
 * to their starting hour rather than visually stretched across rows
 * (which can't cleanly represent two different-duration concurrent
 * entries in the same column). Entries outside the display window are
 * never dropped — they're returned separately so the caller can show
 * them in a fallback list.
 */

export const GRID_START_MINUTES = 8 * 60 // 08:00
export const GRID_END_MINUTES = 20 * 60 // 20:00
export const ROW_COUNT = (GRID_END_MINUTES - GRID_START_MINUTES) / 60 // 12 hourly rows

export interface CalendarGrid {
  /** "08:00", "09:00", ... one label per row, in display order. */
  rowStartTimes: string[]
  cellsByDay: Record<DayOfWeek, ScheduleEntry[][]>
  outOfRangeEntries: ScheduleEntry[]
}

/** Parses "HH:mm" or "HH:mm:ss" (both are valid Jackson serializations of a Java LocalTime) into minutes since midnight. */
export function toMinutesSinceMidnight(time: string): number {
  const [hoursStr, minutesStr] = time.split(':')
  const hours = Number(hoursStr)
  const minutes = Number(minutesStr)
  return hours * 60 + minutes
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

/** @returns the row index for a time within [GRID_START, GRID_END), or -1 if outside that window. */
export function rowIndexFor(time: string): number {
  const minutes = toMinutesSinceMidnight(time)
  if (minutes < GRID_START_MINUTES || minutes >= GRID_END_MINUTES) {
    return -1
  }
  return Math.floor((minutes - GRID_START_MINUTES) / 60)
}

function emptyCellsByDay(): Record<DayOfWeek, ScheduleEntry[][]> {
  const result = {} as Record<DayOfWeek, ScheduleEntry[][]>
  for (const day of ALL_DAYS) {
    result[day] = Array.from({ length: ROW_COUNT }, () => [])
  }
  return result
}

export function buildGrid(entries: ScheduleEntry[]): CalendarGrid {
  const rowStartTimes = Array.from({ length: ROW_COUNT }, (_, i) =>
    formatHour(GRID_START_MINUTES / 60 + i)
  )
  const cellsByDay = emptyCellsByDay()
  const outOfRangeEntries: ScheduleEntry[] = []

  const sorted = [...entries].sort(
    (a, b) => toMinutesSinceMidnight(a.startTime) - toMinutesSinceMidnight(b.startTime)
  )

  for (const entry of sorted) {
    const rowIndex = rowIndexFor(entry.startTime)
    if (rowIndex < 0) {
      outOfRangeEntries.push(entry)
      continue
    }
    cellsByDay[entry.dayOfWeek][rowIndex].push(entry)
  }

  return { rowStartTimes, cellsByDay, outOfRangeEntries }
}
