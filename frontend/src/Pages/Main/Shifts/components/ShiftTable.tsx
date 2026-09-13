import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { findHelpdesk } from '../../../../Services/users';
import { getShifts } from '../../../../Services/shifts';
import DayCell from './DayCell'
import UserRow, { type SelectedShiftEvent } from './UserRow'
import { dateToPx, isWithinRange, type WeekDay } from '../dateRangeUtils'

type Props = {
  days: WeekDay[]
  fillWidth: boolean
  activeType: string
  selectedEventIds: string[]
  manageableUserIds: Set<string>
  onSelectEvent: (event: SelectedShiftEvent, additive: boolean) => void
  onEventUpdated: (event: SelectedShiftEvent) => void
  onRowHover: (userId: string, dayIndex: number | null) => void
}

const AGENT_COLUMN_WIDTH = 200
const FIXED_DAY_WIDTH = 200
const MIN_FILL_DAY_WIDTH = 150
const NOW_REFRESH_MS = 30_000

const ShiftTable = ({days, fillWidth, activeType, selectedEventIds, manageableUserIds, onSelectEvent, onEventUpdated, onRowHover}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => setContainerWidth(entries[0].contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), NOW_REFRESH_MS)
    return () => clearInterval(interval)
  }, [])

  const dayWidth = fillWidth
    ? Math.max((containerWidth - AGENT_COLUMN_WIDTH) / days.length, MIN_FILL_DAY_WIDTH)
    : FIXED_DAY_WIDTH

    const usersQuery = useQuery({
    queryKey: ["shifts-helpdesk-users"],
    queryFn: () => findHelpdesk(),
    staleTime: 30000,
  });

  const shiftsQuery = useQuery({
    queryKey: ["shifts"],
    queryFn: () => getShifts(),
    staleTime: 30000,
  });

  const users = usersQuery.data ?? []
  const shifts = shiftsQuery.data ?? []

  const shiftsByUser = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const shift of shifts) {
      if (!map[shift.userId]) map[shift.userId] = []
      map[shift.userId].push(shift)
    }
    return map
  }, [shifts])

  const showNowLine = isWithinRange(now, days)
  const nowLeft = AGENT_COLUMN_WIDTH + dateToPx(now, days, dayWidth)

  return (
      <div ref={containerRef} className="p-2 w-full overflow-x-auto">
        <div className={`relative ${fillWidth ? '' : 'w-fit'}`}>
          <div className="flex rounded-[10px] bg-[#FFFFFF] shadow-xl">
            <div className="w-[200px] h-[50px] shrink-0"></div>
            {days.map((weekDay) => (
              <DayCell key={weekDay.fullDate.toISOString()} day={weekDay.day} date={weekDay.date} width={dayWidth}/>
            ))}
          </div>
          {users && users.length > 0 && users.map((user:any) => (
            <UserRow
              key={user.id}
              {...user}
              days={days}
              dayWidth={dayWidth}
              shifts={shiftsByUser[user.id] ?? []}
              activeType={activeType}
              selectedEventIds={selectedEventIds}
              canEdit={manageableUserIds.has(user.id)}
              onSelectEvent={onSelectEvent}
              onEventUpdated={onEventUpdated}
              onHover={(dayIndex) => onRowHover(user.id, dayIndex)}
            />
          ))}
          {showNowLine && (
            <div style={{left: nowLeft}} className="absolute top-0 bottom-0 w-[2px] bg-red-500 pointer-events-none z-30"/>
          )}
        </div>
      </div>
  )
}

export default ShiftTable
