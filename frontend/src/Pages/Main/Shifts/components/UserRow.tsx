import AgentCell from './AgentCell'
import { useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createShift } from '../../../../Services/shifts'
import { shiftEventTypes } from '../../../../Constants/options'
import { toast } from 'react-toastify'
import { pxToDate, dateToPx, type WeekDay } from '../dateRangeUtils'

export type SelectedShiftEvent = {
    id: string
    type: string
    comment: string | null
    startDate: string
    endDate: string
    employeeName: string
}

type Props = {
    id: string
    name: string
    surname: string
    title: string
    days: WeekDay[]
    dayWidth: number
    shifts: any[]
    activeType: string
    selectedEventId: string | null
    onSelectEvent: (event: SelectedShiftEvent) => void
}

type ShiftEvent = {
    id: string
    left: number
    width: number
    type: string
}

const SNAP_THRESHOLD = 20
const MIN_DRAG_WIDTH = 10
const DEFAULT_TYPE_COLOR = '#7F8C8D'

const TYPE_COLOR_MAP: Record<string, string> = Object.fromEntries(shiftEventTypes.map((t) => [t.value, t.color]))
const TYPE_LABEL_MAP: Record<string, string> = Object.fromEntries(shiftEventTypes.map((t) => [t.value, t.label]))
const getTypeColor = (type: string) => TYPE_COLOR_MAP[type] ?? DEFAULT_TYPE_COLOR
const getTypeLabel = (type: string) => TYPE_LABEL_MAP[type] ?? type

// Genuine overlap only — two events that merely touch at the same edge
// (one ends exactly where the next begins) are back-to-back, not colliding.
const rangesOverlap = (aLeft: number, aRight: number, bLeft: number, bRight: number) => aLeft < bRight && aRight > bLeft

const formatTime = (date: Date) => `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`

const UserRow = ({id, name, surname, title, days, dayWidth, shifts, activeType, selectedEventId, onSelectEvent}: Props) => {
  const rowRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef<number | null>(null)
  const [dragRange, setDragRange] = useState<{left: number, width: number} | null>(null)
  const [tooltip, setTooltip] = useState<{x: number, text: string} | null>(null)
  const [pendingEvents, setPendingEvents] = useState<ShiftEvent[]>([])
  const queryClient = useQueryClient()

  const rowWidth = days.length * dayWidth

  const getTimeRangeLabel = (left: number, width: number) => {
    const start = formatTime(pxToDate(left, days, dayWidth))
    const end = formatTime(pxToDate(left + width, days, dayWidth))
    if (start === '00:00' && end === '00:00') return 'All day'
    return `${start} - ${end}`
  }

  // Shifts already saved on the server, mapped from real dates back onto
  // this week's pixel grid at the exact position they were created at.
  const persistedEvents: ShiftEvent[] = useMemo(() => {
    return shifts
      .map((shift): ShiftEvent | null => {
        const left = dateToPx(new Date(shift.startDate), days, dayWidth)
        const width = dateToPx(new Date(shift.endDate), days, dayWidth) - left
        if (width <= 0) return null
        return {id: shift.id, left, width, type: shift.type}
      })
      .filter((event): event is ShiftEvent => event !== null)
  }, [shifts, days, dayWidth])

  const allEvents = [...persistedEvents, ...pendingEvents]

  const shiftMutation = useMutation({
    mutationFn: (vars: {payload: any, tempId: string}) => createShift(vars.payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({queryKey: ['shifts']})
      setPendingEvents((prev) => prev.filter((event) => event.id !== vars.tempId))
    },
    onError: (err: any, vars) => {
      setPendingEvents((prev) => prev.filter((event) => event.id !== vars.tempId))
      toast.error(err?.response?.data?.message ?? 'Nie udało się utworzyć eventu')
    },
  })

  // Free pixel positioning, but the edge snaps once the cursor gets close to
  // a day boundary or the edge of an existing event, so it's easy to line
  // events up with full days or place them flush against a neighbour.
  const snapX = (x: number) => {
    const clamped = Math.min(Math.max(x, 0), rowWidth)

    const candidates: number[] = []
    for (let i = 0; i <= days.length; i++) candidates.push(i * dayWidth)
    for (const event of allEvents) {
      candidates.push(event.left)
      candidates.push(event.left + event.width)
    }

    let nearest = clamped
    let nearestDistance = SNAP_THRESHOLD
    for (const candidate of candidates) {
      const distance = Math.abs(clamped - candidate)
      if (distance <= nearestDistance) {
        nearest = candidate
        nearestDistance = distance
      }
    }
    return nearest
  }

  const getRelativeX = (clientX: number) => {
    const bounds = rowRef.current?.getBoundingClientRect()
    return bounds ? clientX - bounds.left : 0
  }

  const tryCreateEvent = (left: number, right: number) => {
    if (right - left < MIN_DRAG_WIDTH) return

    const hasConflict = allEvents.some((event) => rangesOverlap(left, right, event.left, event.left + event.width))
    if (hasConflict) {
      toast.error('Wybrany zakres nakłada się na istniejący event')
      return
    }

    const tempId = `pending-${Date.now()}`
    setPendingEvents((prev) => [...prev, {id: tempId, left, width: right - left, type: activeType}])

    shiftMutation.mutate({
      payload: {
        userId: id,
        type: activeType,
        startDate: pxToDate(left, days, dayWidth),
        endDate: pxToDate(right, days, dayWidth),
      },
      tempId,
    })
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    const dayIndex = Math.min(Math.max(Math.floor(getRelativeX(e.clientX) / dayWidth), 0), days.length - 1)
    tryCreateEvent(dayIndex * dayWidth, (dayIndex + 1) * dayWidth)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    const startX = snapX(getRelativeX(e.clientX))
    dragStartX.current = startX
    setDragRange({left: startX, width: 0})
    setTooltip({x: startX, text: formatTime(pxToDate(startX, days, dayWidth))})

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (dragStartX.current === null) return
      const currentX = snapX(getRelativeX(moveEvent.clientX))
      setDragRange({
        left: Math.min(dragStartX.current, currentX),
        width: Math.abs(currentX - dragStartX.current),
      })
      setTooltip({
        x: currentX,
        text: `${formatTime(pxToDate(dragStartX.current, days, dayWidth))} - ${formatTime(pxToDate(currentX, days, dayWidth))}`,
      })
    }

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      setDragRange(null)
      setTooltip(null)

      if (dragStartX.current === null) return
      const endX = snapX(getRelativeX(upEvent.clientX))
      const left = Math.min(dragStartX.current, endX)
      const right = Math.max(dragStartX.current, endX)
      dragStartX.current = null

      tryCreateEvent(left, right)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleSelectEvent = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation()
    const shift = shifts.find((s) => s.id === eventId)
    if (!shift) return
    onSelectEvent({
      id: shift.id,
      type: shift.type,
      comment: shift.comment ?? null,
      startDate: shift.startDate,
      endDate: shift.endDate,
      employeeName: `${name} ${surname}`,
    })
  }

  return (
    <div className="h-[50px] flex w-full rounded-[10px] bg-[#FFFFFF] mt-2 shadow-xl">
      <AgentCell name={name} surname={surname} title={title} />
      <div ref={rowRef} onMouseDown={handleMouseDown} onDoubleClick={handleDoubleClick} style={{width: rowWidth}} className="shrink-0 flex flex-col items-center justify-center border-[#F6F6F6] border-l-3 relative select-none">
        {persistedEvents.map((event) => {
          const color = getTypeColor(event.type)
          const isSelected = event.id === selectedEventId
          return (
            <div
              key={event.id}
              onMouseDown={(e) => handleSelectEvent(e, event.id)}
              style={{
                left: event.left,
                width: event.width,
                backgroundColor: color,
                boxShadow: isSelected ? '0 0 0 2px #1F1F1F' : undefined,
              }}
              className="h-full absolute top-0 flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[16px] px-2 text-white text-center cursor-pointer"
            >
              <div className="min-w-0 max-w-full truncate text-[11px]">{getTypeLabel(event.type)}</div>
              <div className="min-w-0 max-w-full truncate font-bold text-[15px] leading-none">{getTimeRangeLabel(event.left, event.width)}</div>
            </div>
          )
        })}
        {pendingEvents.map((event) => {
          const color = getTypeColor(event.type)
          return (
            <div
              key={event.id}
              style={{left: event.left, width: event.width, backgroundColor: color}}
              className="h-full absolute top-0 flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[16px] px-2 text-white text-center opacity-70"
            >
              <div className="min-w-0 max-w-full truncate text-[11px]">{getTypeLabel(event.type)}</div>
              <div className="min-w-0 max-w-full truncate font-bold text-[15px] leading-none">{getTimeRangeLabel(event.left, event.width)}</div>
            </div>
          )
        })}
        {dragRange && (
          <div
            style={{left: dragRange.left, width: dragRange.width, backgroundColor: `${getTypeColor(activeType)}4D`, borderColor: getTypeColor(activeType)}}
            className="h-full absolute top-0 rounded-[10px] border-2 border-dashed pointer-events-none"
          />
        )}
        {tooltip && (
          <div style={{left: tooltip.x}} className="absolute -top-6 -translate-x-1/2 whitespace-nowrap rounded-[4px] bg-[#1F1F1F] text-white text-[10px] px-2 py-0.5 pointer-events-none z-10">
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserRow
