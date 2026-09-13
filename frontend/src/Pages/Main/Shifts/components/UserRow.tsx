import AgentCell from './AgentCell'
import { useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createShift, updateShift } from '../../../../Services/shifts'
import { shiftEventTypes } from '../../../../Constants/options'
import { toast } from 'react-toastify'
import { pxToDate, dateToPx, formatDayDate, DAY_MS, type WeekDay } from '../dateRangeUtils'

export type SelectedShiftEvent = {
    id: string
    type: string
    comment: string | null
    startDate: string
    endDate: string
    employeeName: string
    canEdit: boolean
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
    selectedEventIds: string[]
    canEdit: boolean
    onSelectEvent: (event: SelectedShiftEvent, additive: boolean) => void
    onEventUpdated: (event: SelectedShiftEvent) => void
    onHover: (dayIndex: number | null) => void
}

type ShiftEvent = {
    id: string
    left: number
    width: number
    type: string
}

// One event rendered across N day columns becomes N segments — only the
// segment touching the shift's true start gets a rounded left corner, only
// the one touching its true end gets a rounded right one, so a 3-day event
// reads as a single continuous bar with square joins in the middle.
type EventSegment = {
    key: string
    event: ShiftEvent
    left: number
    width: number
    roundLeft: boolean
    roundRight: boolean
    label: string
}

type EditDragMode = 'move' | 'resize-left' | 'resize-right'

const SNAP_THRESHOLD = 20
const MIN_DRAG_WIDTH = 10
const CLICK_THRESHOLD = 3
const DEFAULT_TYPE_COLOR = '#7F8C8D'

const TYPE_COLOR_MAP: Record<string, string> = Object.fromEntries(shiftEventTypes.map((t) => [t.value, t.color]))
const TYPE_LABEL_MAP: Record<string, string> = Object.fromEntries(shiftEventTypes.map((t) => [t.value, t.label]))
const getTypeColor = (type: string) => TYPE_COLOR_MAP[type] ?? DEFAULT_TYPE_COLOR
const getTypeLabel = (type: string) => TYPE_LABEL_MAP[type] ?? type

// Genuine overlap only — two events that merely touch at the same edge
// (one ends exactly where the next begins) are back-to-back, not colliding.
const rangesOverlap = (aLeft: number, aRight: number, bLeft: number, bRight: number) => aLeft < bRight && aRight > bLeft

const formatTime = (date: Date) => `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`

const formatDateTimeLabel = (date: Date) => {
  const time = formatTime(date)
  return time === '00:00' ? formatDayDate(date) : `${formatDayDate(date)} ${time}`
}

const roundingClass = (roundLeft: boolean, roundRight: boolean) =>
  `${roundLeft ? 'rounded-l-[16px]' : ''} ${roundRight ? 'rounded-r-[16px]' : ''}`.trim()

const UserRow = ({id, name, surname, title, days, dayWidth, shifts, activeType, selectedEventIds, canEdit, onSelectEvent, onEventUpdated, onHover}: Props) => {
  const rowRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef<number | null>(null)
  const editDragRef = useRef<{id: string, mode: EditDragMode, originalLeft: number, originalRight: number, left: number, width: number, moved: boolean, additive: boolean} | null>(null)
  const [dragRange, setDragRange] = useState<{left: number, width: number} | null>(null)
  const [editDragState, setEditDragState] = useState<{id: string, left: number, width: number} | null>(null)
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

  const getMultiDayRangeLabel = (start: Date, end: Date) => `${formatDateTimeLabel(start)} - ${formatDateTimeLabel(end)}`

  // Splits one event into per-day-column segments based on its true
  // (unclamped) start/end, so a multi-day shift renders as a continuous bar
  // with correct corner rounding instead of one box stretched over the gap.
  const buildSegments = (event: ShiftEvent, shiftStart: Date, shiftEnd: Date): EventSegment[] => {
    const segments: EventSegment[] = []
    for (let i = 0; i < days.length; i++) {
      const dayStart = days[i].fullDate
      const dayEnd = new Date(dayStart.getTime() + DAY_MS)
      if (shiftStart.getTime() >= dayEnd.getTime() || shiftEnd.getTime() <= dayStart.getTime()) continue

      const segStartDate = shiftStart.getTime() > dayStart.getTime() ? shiftStart : dayStart
      const segEndDate = shiftEnd.getTime() < dayEnd.getTime() ? shiftEnd : dayEnd
      const left = dateToPx(segStartDate, days, dayWidth)
      const right = dateToPx(segEndDate, days, dayWidth)
      if (right - left <= 0) continue

      const roundLeft = segStartDate.getTime() === shiftStart.getTime()
      const roundRight = segEndDate.getTime() === shiftEnd.getTime()
      const label = roundLeft && roundRight ? getTimeRangeLabel(left, right - left) : getMultiDayRangeLabel(shiftStart, shiftEnd)

      segments.push({key: `${event.id}-${i}`, event, left, width: right - left, roundLeft, roundRight, label})
    }
    return segments
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

  const persistedSegments = useMemo(() => {
    return persistedEvents.flatMap((event) => {
      const shift = shifts.find((s) => s.id === event.id)
      if (!shift) return []
      return buildSegments(event, new Date(shift.startDate), new Date(shift.endDate))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistedEvents, shifts, days, dayWidth])

  const pendingSegments = useMemo(() => {
    return pendingEvents.flatMap((event) =>
      buildSegments(event, pxToDate(event.left, days, dayWidth), pxToDate(event.left + event.width, days, dayWidth)),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEvents, days, dayWidth])

  const groupSegmentsByEvent = (segments: EventSegment[]) => {
    const map = new Map<string, EventSegment[]>()
    for (const segment of segments) {
      const list = map.get(segment.event.id) ?? []
      list.push(segment)
      map.set(segment.event.id, list)
    }
    return map
  }

  const persistedGroups = useMemo(
    () => groupSegmentsByEvent(persistedSegments.filter((s) => s.event.id !== editDragState?.id)),
    [persistedSegments, editDragState],
  )
  const pendingGroups = useMemo(() => groupSegmentsByEvent(pendingSegments), [pendingSegments])

  // A multi-day event is drawn as several flush segments (for correct corner
  // rounding), but the label is only ever shown once — as a separate,
  // click-through overlay spanning the whole bar — instead of repeating the
  // same "type + date range" text in every segment.
  const renderEventGroup = (segments: EventSegment[], options: {interactive: boolean, dimmed?: boolean}) => {
    if (segments.length === 0) return []
    const isMultiSegment = segments.length > 1
    const event = segments[0].event
    const color = getTypeColor(event.type)
    const isSelected = options.interactive && selectedEventIds.includes(event.id)
    const dimClass = options.dimmed ? 'opacity-70' : ''
    // Read-only rows can still select an event (to view it) but never drag it.
    const showHandles = options.interactive && canEdit
    const cursorClass = options.interactive ? (canEdit ? 'cursor-move' : 'cursor-pointer') : ''

    const elements = segments.map((segment) => (
      <div
        key={segment.key}
        onMouseDown={options.interactive ? (e) => handleEventDragStart(e, segment.event, 'move') : undefined}
        style={{
          left: segment.left,
          width: segment.width,
          backgroundColor: color,
          boxShadow: isSelected ? '0 0 0 2px #1F1F1F' : undefined,
        }}
        className={`h-full absolute top-0 overflow-hidden text-white ${cursorClass} ${dimClass} ${roundingClass(segment.roundLeft, segment.roundRight)} ${isMultiSegment ? '' : 'flex flex-col items-center justify-center gap-0.5 px-2 text-center'}`}
      >
        {!isMultiSegment && (
          <>
            <div className="min-w-0 max-w-full truncate text-[11px]">{getTypeLabel(segment.event.type)}</div>
            <div className="min-w-0 max-w-full truncate font-bold text-[15px] leading-none">{segment.label}</div>
          </>
        )}
        {showHandles && segment.roundLeft && (
          <div onMouseDown={(e) => handleEventDragStart(e, segment.event, 'resize-left')} className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"/>
        )}
        {showHandles && segment.roundRight && (
          <div onMouseDown={(e) => handleEventDragStart(e, segment.event, 'resize-right')} className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"/>
        )}
      </div>
    ))

    if (!isMultiSegment) return elements

    const overlayLeft = segments[0].left
    const lastSegment = segments[segments.length - 1]
    const overlayWidth = lastSegment.left + lastSegment.width - overlayLeft
    elements.push(
      <div
        key={`${event.id}-label`}
        style={{left: overlayLeft, width: overlayWidth}}
        className={`h-full absolute top-0 flex flex-col items-center justify-center gap-0.5 px-2 text-white text-center pointer-events-none ${dimClass}`}
      >
        <div className="min-w-0 max-w-full truncate text-[11px]">{getTypeLabel(event.type)}</div>
        <div className="min-w-0 max-w-full truncate font-bold text-[15px] leading-none">{segments[0].label}</div>
      </div>,
    )
    return elements
  }

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

  const updateMutation = useMutation({
    mutationFn: (vars: {id: string, payload: any}) => updateShift(vars.id, vars.payload),
    onSuccess: (updatedShift: any) => {
      queryClient.invalidateQueries({queryKey: ['shifts']})
      setEditDragState(null)
      // Dragging bypasses the edit panel's own inputs, so its snapshot of
      // this event (start/end shown there) would otherwise go stale.
      onEventUpdated({
        id: updatedShift.id,
        type: updatedShift.type,
        comment: updatedShift.comment ?? null,
        startDate: updatedShift.startDate,
        endDate: updatedShift.endDate,
        employeeName: `${name} ${surname}`,
        canEdit: true,
      })
    },
    onError: (err: any) => {
      setEditDragState(null)
      toast.error(err?.response?.data?.message ?? 'Nie udało się zapisać zmian')
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

  // Keeps the parent informed of which day column the cursor is over, purely
  // so a paste (Ctrl+V) can target the row/day the user is hovering — this
  // has nothing to do with dragging.
  const handleHoverMove = (e: React.MouseEvent) => {
    const dayIndex = Math.min(Math.max(Math.floor(getRelativeX(e.clientX) / dayWidth), 0), days.length - 1)
    onHover(dayIndex)
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

  const selectEventById = (eventId: string, additive: boolean) => {
    const shift = shifts.find((s) => s.id === eventId)
    if (!shift) return
    onSelectEvent({
      id: shift.id,
      type: shift.type,
      comment: shift.comment ?? null,
      startDate: shift.startDate,
      endDate: shift.endDate,
      employeeName: `${name} ${surname}`,
      canEdit,
    }, additive)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!canEdit) return
    const dayIndex = Math.min(Math.max(Math.floor(getRelativeX(e.clientX) / dayWidth), 0), days.length - 1)
    tryCreateEvent(dayIndex * dayWidth, (dayIndex + 1) * dayWidth)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canEdit) return
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

  // Editing an existing event: grabbing either edge resizes that side only,
  // grabbing the body drags the whole thing while keeping its duration. A
  // press that never moves is treated as a click and opens the edit panel
  // instead of touching the shift's dates.
  const handleEventDragStart = (e: React.MouseEvent, event: ShiftEvent, mode: EditDragMode) => {
    if (e.button !== 0) return
    e.stopPropagation()

    if (!canEdit) {
      // Read-only row: clicking an event still opens it (so an agent can see
      // its details), but dragging to resize/move it is not available.
      selectEventById(event.id, e.shiftKey)
      return
    }

    const startClientX = e.clientX
    const originalLeft = event.left
    const originalRight = event.left + event.width
    const additive = e.shiftKey

    editDragRef.current = {id: event.id, mode, originalLeft, originalRight, left: originalLeft, width: event.width, moved: false, additive}
    setEditDragState({id: event.id, left: originalLeft, width: event.width})

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const drag = editDragRef.current
      if (!drag) return
      const delta = moveEvent.clientX - startClientX
      if (Math.abs(delta) > CLICK_THRESHOLD) drag.moved = true

      if (drag.mode === 'resize-left') {
        const newLeft = Math.min(Math.max(snapX(drag.originalLeft + delta), 0), drag.originalRight - MIN_DRAG_WIDTH)
        drag.left = newLeft
        drag.width = drag.originalRight - newLeft
      } else if (drag.mode === 'resize-right') {
        const newRight = Math.max(Math.min(snapX(drag.originalRight + delta), rowWidth), drag.originalLeft + MIN_DRAG_WIDTH)
        drag.left = drag.originalLeft
        drag.width = newRight - drag.originalLeft
      } else {
        const width = drag.originalRight - drag.originalLeft
        const snappedLeft = snapX(drag.originalLeft + delta)
        drag.left = Math.min(Math.max(snappedLeft, 0), rowWidth - width)
        drag.width = width
      }

      setEditDragState({id: drag.id, left: drag.left, width: drag.width})
      setTooltip({x: getRelativeX(moveEvent.clientX), text: getTimeRangeLabel(drag.left, drag.width)})
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      setTooltip(null)

      const drag = editDragRef.current
      editDragRef.current = null
      if (!drag) return

      if (!drag.moved) {
        setEditDragState(null)
        selectEventById(drag.id, drag.additive)
        return
      }

      const otherEvents = allEvents.filter((ev) => ev.id !== drag.id)
      const hasConflict = otherEvents.some((ev) => rangesOverlap(drag.left, drag.left + drag.width, ev.left, ev.left + ev.width))
      if (hasConflict) {
        toast.error('Wybrany zakres nakłada się na istniejący event')
        setEditDragState(null)
        return
      }

      updateMutation.mutate({
        id: drag.id,
        payload: {
          startDate: pxToDate(drag.left, days, dayWidth),
          endDate: pxToDate(drag.left + drag.width, days, dayWidth),
        },
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const editedEvent = editDragState ? persistedEvents.find((e) => e.id === editDragState.id) : undefined

  return (
    <div className="h-[50px] flex w-full rounded-[10px] bg-[#FFFFFF] mt-2 shadow-xl">
      <AgentCell name={name} surname={surname} title={title} />
      <div ref={rowRef} onMouseDown={handleMouseDown} onDoubleClick={handleDoubleClick} onMouseMove={handleHoverMove} onMouseLeave={() => onHover(null)} style={{width: rowWidth}} className="shrink-0 flex flex-col items-center justify-center border-[#F6F6F6] border-l-3 relative select-none">
        {[...persistedGroups.values()].flatMap((segments) => renderEventGroup(segments, {interactive: true}))}
        {editDragState && editedEvent && (
          <div
            style={{left: editDragState.left, width: editDragState.width, backgroundColor: getTypeColor(editedEvent.type), boxShadow: '0 0 0 2px #1F1F1F'}}
            className="h-full absolute top-0 flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[16px] px-2 text-white text-center cursor-move"
          >
            <div className="min-w-0 max-w-full truncate text-[11px]">{getTypeLabel(editedEvent.type)}</div>
            <div className="min-w-0 max-w-full truncate font-bold text-[15px] leading-none">{getTimeRangeLabel(editDragState.left, editDragState.width)}</div>
          </div>
        )}
        {[...pendingGroups.values()].flatMap((segments) => renderEventGroup(segments, {interactive: false, dimmed: true}))}
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
