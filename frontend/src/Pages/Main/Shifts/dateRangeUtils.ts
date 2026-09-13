export type RangeOption = {
  label: string
  value: string
  unit: 'day' | 'week' | 'month'
  amount: number
}

export type WeekDay = {
  day: string
  date: string
  fullDate: Date
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)
const addDays = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
const addMonths = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth() + amount, 1)

// Monday-based week start (getDay(): 0=Sunday..6=Saturday).
const startOfWeek = (date: Date) => addDays(startOfDay(date), -((date.getDay() + 6) % 7))

export const formatDayDate = (date: Date) =>
  `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`

const toWeekDay = (fullDate: Date): WeekDay => ({day: DAY_LABELS[fullDate.getDay()], date: formatDayDate(fullDate), fullDate})

// Day views anchor to the first displayed day, week views to that week's
// Monday, and month views to the 1st of the starting month, so paging by a
// whole unit always lands back on a clean boundary.
export const normalizeAnchor = (date: Date, option: RangeOption) => {
  if (option.unit === 'month') return startOfMonth(date)
  if (option.unit === 'week') return startOfWeek(date)
  return startOfDay(date)
}

export const getRangeDays = (anchor: Date, option: RangeOption): WeekDay[] => {
  if (option.unit === 'day') {
    return Array.from({length: option.amount}, (_, i) => toWeekDay(addDays(anchor, i)))
  }
  if (option.unit === 'week') {
    return Array.from({length: option.amount * 7}, (_, i) => toWeekDay(addDays(anchor, i)))
  }

  const rangeEnd = addMonths(anchor, option.amount)
  const days: WeekDay[] = []
  for (let cursor = anchor; cursor.getTime() < rangeEnd.getTime(); cursor = addDays(cursor, 1)) {
    days.push(toWeekDay(cursor))
  }
  return days
}

// Pages by the full width of the current view (e.g. "5 days" jumps 5 days,
// "Week" jumps 7, "Month" jumps a whole calendar month), so consecutive
// views never overlap.
export const shiftAnchor = (anchor: Date, option: RangeOption, direction: 1 | -1) => {
  if (option.unit === 'month') return addMonths(anchor, option.amount * direction)
  if (option.unit === 'week') return addDays(anchor, option.amount * 7 * direction)
  return addDays(anchor, option.amount * direction)
}

export const DAY_MS = 24 * 60 * 60 * 1000

const isSameCalendarDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

// Shared pixel <-> date coordinate space for the day-columns grid, used both
// for positioning shift events and for the current-time indicator line.
export const dateToPx = (date: Date, days: WeekDay[], dayWidth: number) => {
  const dayIndex = days.findIndex((d) => isSameCalendarDay(d.fullDate, date))
  if (dayIndex === -1) {
    return date.getTime() < days[0].fullDate.getTime() ? 0 : days.length * dayWidth
  }
  const fraction = (date.getTime() - days[dayIndex].fullDate.getTime()) / DAY_MS
  return dayIndex * dayWidth + fraction * dayWidth
}

export const pxToDate = (x: number, days: WeekDay[], dayWidth: number) => {
  const clamped = Math.min(Math.max(x, 0), days.length * dayWidth)
  const dayIndex = Math.min(Math.floor(clamped / dayWidth), days.length - 1)
  const fraction = (clamped - dayIndex * dayWidth) / dayWidth
  return new Date(days[dayIndex].fullDate.getTime() + fraction * DAY_MS)
}

export const isWithinRange = (date: Date, days: WeekDay[]) => {
  if (days.length === 0) return false
  const rangeStart = days[0].fullDate.getTime()
  const rangeEnd = days[days.length - 1].fullDate.getTime() + DAY_MS
  return date.getTime() >= rangeStart && date.getTime() < rangeEnd
}
