import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import ButtonPrimary from '../../../Components/Buttons/ButtonPrimary'
import SelectSecondary from '../../../Components/Inputs/SelectSecondary'
import { shiftDateRangesOptions, shiftEventTypes } from '../../../Constants/options'
import ShiftTable from './components/ShiftTable'
import type { SelectedShiftEvent } from './components/UserRow'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createShift, updateShift, deleteShift } from '../../../Services/shifts'
import { findHelpdesk } from '../../../Services/users'
import { useCurrentUser } from '../../../Hooks/useCurrentUser'
import { usePermissions } from '../../../Hooks/usePermissions'
import { hasPermission } from '../../../Constants/navigation'
import { toast } from "react-toastify";
import { getRangeDays, normalizeAnchor, shiftAnchor, DAY_MS, type RangeOption } from './dateRangeUtils'

type ClipboardEntry = {
  type: string
  dayOffset: number
  startTimeOfDayMs: number
  durationMs: number
}

type Props = {}

const DEFAULT_RANGE_OPTION = shiftDateRangesOptions[1] as RangeOption
const DEFAULT_EVENT_TYPE = shiftEventTypes[3]

const toDatetimeLocalValue = (iso: string) => {
  const date = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const Shifts = (props: Props) => {
  const queryClient = useQueryClient()

  const [rangeOption, setRangeOption] = useState<RangeOption>(DEFAULT_RANGE_OPTION)
  const [anchor, setAnchor] = useState<Date>(() => normalizeAnchor(new Date(), DEFAULT_RANGE_OPTION))
  const [activeType, setActiveType] = useState<string>(DEFAULT_EVENT_TYPE.value)
  const days = useMemo(() => getRangeDays(anchor, rangeOption), [anchor, rangeOption])

  const currentUserQuery = useCurrentUser()
  const currentUser: any = currentUserQuery.data
  const permissionsQuery = usePermissions()
  const helpdeskUsersQuery = useQuery({
    queryKey: ["shifts-helpdesk-users"],
    queryFn: () => findHelpdesk(),
    staleTime: 30000,
  })
  const helpdeskUsers: any[] = helpdeskUsersQuery.data ?? []

  // Only an admin, or the specific employee's manager (matched against the
  // employee's free-text `manager` field), may edit that employee's shifts —
  // everyone else gets a read-only view. See ShiftsService.assertCanManage
  // for the server-side mirror of this same check.
  const manageableUserIds = useMemo(() => {
    if (!currentUser) return new Set<string>()
    if (hasPermission("shifts.edit", permissionsQuery.data)) return new Set(helpdeskUsers.map((u) => u.id))
    const callerIdentifiers = [currentUser.username, currentUser.distinguishedName, currentUser.id].filter(Boolean)
    return new Set(
      helpdeskUsers.filter((u) => u.manager && callerIdentifiers.includes(u.manager)).map((u) => u.id),
    )
  }, [helpdeskUsers, currentUser, permissionsQuery.data])

  const [selectedEvents, setSelectedEvents] = useState<SelectedShiftEvent[]>([])
  const [editType, setEditType] = useState('')
  const [editComment, setEditComment] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')

  const isMultiSelect = selectedEvents.length > 1

  // Which day column, in which row, the cursor is currently over — a ref
  // (not state) since it updates on every mousemove and is only ever read
  // once, at the moment Ctrl+V fires.
  const hoverRef = useRef<{userId: string, dayIndex: number} | null>(null)
  const handleRowHover = useCallback((userId: string, dayIndex: number | null) => {
    hoverRef.current = dayIndex === null ? null : {userId, dayIndex}
  }, [])

  const clipboardRef = useRef<ClipboardEntry[]>([])
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (selectedEvents.length === 0) return
    const first = selectedEvents[0]
    setEditType(first.type)
    if (selectedEvents.length === 1) {
      setEditComment(first.comment ?? '')
      setEditStart(toDatetimeLocalValue(first.startDate))
      setEditEnd(toDatetimeLocalValue(first.endDate))
    }
  }, [selectedEvents])

  const updateMutation = useMutation({
    mutationFn: ({id, payload}: {id: string, payload: any}) => updateShift(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['shifts']})
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Nie udało się zapisać zmian')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['shifts']})
      setSelectedEvents([])
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Nie udało się usunąć eventu')
    },
  })

  const bulkUpdateTypeMutation = useMutation({
    mutationFn: async ({ids, type}: {ids: string[], type: string}) => {
      await Promise.all(ids.map((eventId) => updateShift(eventId, {type})))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['shifts']})
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Nie udało się zapisać zmian')
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((eventId) => deleteShift(eventId)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['shifts']})
      setSelectedEvents([])
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Nie udało się usunąć eventów')
    },
  })

  const pasteMutation = useMutation({
    mutationFn: (payload: any) => createShift(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['shifts']})
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Nie udało się wkleić eventu')
    },
  })

  const switchDateRange = (option: RangeOption) => {
    setRangeOption(option)
    setAnchor((prev) => normalizeAnchor(prev, option))
  }

  const goToPrevious = () => setAnchor((prev) => shiftAnchor(prev, rangeOption, -1))
  const goToNext = () => setAnchor((prev) => shiftAnchor(prev, rangeOption, 1))

  // Plain click replaces the selection with just that event; shift-click
  // toggles it in/out of a multi-select, like a file manager or spreadsheet.
  const handleSelectEvent = (event: SelectedShiftEvent, additive: boolean) => {
    setSelectedEvents((prev) => {
      if (!additive) return [event]
      const alreadySelected = prev.some((e) => e.id === event.id)
      if (alreadySelected) return prev.filter((e) => e.id !== event.id)
      return [...prev, event]
    })
  }

  // Dragging (resize/move) saves directly from UserRow, bypassing the panel's
  // own inputs — if the dragged event is currently open here, refresh this
  // copy too so Start/End reflect the drag instead of going stale.
  const handleEventUpdated = (event: SelectedShiftEvent) => {
    setSelectedEvents((prev) => {
      if (!prev.some((e) => e.id === event.id)) return prev
      return prev.map((e) => (e.id === event.id ? event : e))
    })
  }

  // Ctrl+C / Ctrl+V over the table: copy snapshots each selected event's
  // type, duration and time-of-day, plus its day offset relative to the
  // earliest one, so a multi-event copy keeps its shape when pasted onto
  // whichever row/day the cursor is hovering at paste time.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      const target = e.target as HTMLElement
      const isEditableTarget = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (isEditableTarget) return

      const key = e.key.toLowerCase()

      if (key === 'c') {
        if (selectedEvents.length === 0) return
        e.preventDefault()

        const sorted = [...selectedEvents].sort(
          (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        )
        const referenceDayStart = new Date(sorted[0].startDate)
        referenceDayStart.setHours(0, 0, 0, 0)

        clipboardRef.current = sorted.map((event) => {
          const start = new Date(event.startDate)
          const end = new Date(event.endDate)
          const dayStart = new Date(start)
          dayStart.setHours(0, 0, 0, 0)
          return {
            type: event.type,
            dayOffset: Math.round((dayStart.getTime() - referenceDayStart.getTime()) / DAY_MS),
            startTimeOfDayMs: start.getTime() - dayStart.getTime(),
            durationMs: end.getTime() - start.getTime(),
          }
        })
        toast.success(`Skopiowano ${sorted.length === 1 ? 'event' : `${sorted.length} eventy`}`)
      } else if (key === 'v') {
        const hover = hoverRef.current
        const clipboard = clipboardRef.current
        if (!hover || clipboard.length === 0) return
        e.preventDefault()

        if (!manageableUserIds.has(hover.userId)) {
          toast.error('Nie masz uprawnień do edycji zmian tego pracownika')
          return
        }

        let pasted = 0
        for (const entry of clipboard) {
          const targetDayIndex = hover.dayIndex + entry.dayOffset
          if (targetDayIndex < 0 || targetDayIndex >= days.length) continue

          const dayStart = days[targetDayIndex].fullDate
          const startDate = new Date(dayStart.getTime() + entry.startTimeOfDayMs)
          const endDate = new Date(startDate.getTime() + entry.durationMs)

          pasteMutation.mutate({userId: hover.userId, type: entry.type, startDate, endDate})
          pasted += 1
        }
        if (pasted === 0) {
          toast.error('Poza zakresem widoku — nie ma gdzie wkleić')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedEvents, days, pasteMutation.mutate, manageableUserIds])

  // No Save button — each field schedules a debounced autosave on its own
  // onChange, so fast typing/tabbing coalesces into one request instead of
  // firing on every keystroke. `overrides` carries the value that just
  // changed, since the state setter for it hasn't flushed yet at this point.
  const scheduleAutosave = (overrides: {type?: string, comment?: string, start?: string, end?: string}) => {
    if (selectedEvents.length === 0) return
    if (!selectedEvents.every((e) => e.canEdit)) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

    saveTimeoutRef.current = setTimeout(() => {
      const type = overrides.type ?? editType
      if (isMultiSelect) {
        bulkUpdateTypeMutation.mutate({ids: selectedEvents.map((e) => e.id), type})
        return
      }
      updateMutation.mutate({
        id: selectedEvents[0].id,
        payload: {
          type,
          comment: (overrides.comment ?? editComment) || null,
          startDate: new Date(overrides.start ?? editStart),
          endDate: new Date(overrides.end ?? editEnd),
        },
      })
    }, 500)
  }

  const handleDelete = () => {
    if (selectedEvents.length === 0) return
    if (!selectedEvents.every((e) => e.canEdit)) return
    if (isMultiSelect) {
      bulkDeleteMutation.mutate(selectedEvents.map((e) => e.id))
      return
    }
    deleteMutation.mutate(selectedEvents[0].id)
  }

  const isSaving = updateMutation.isPending || bulkUpdateTypeMutation.isPending
  const isDeleting = deleteMutation.isPending || bulkDeleteMutation.isPending
  const canEditSelection = selectedEvents.length > 0 && selectedEvents.every((e) => e.canEdit)

  return (
    <div>
      <div className="p-2 flex items-center gap-3 flex-wrap">
        <ButtonPrimary color="white" icon={faChevronLeft} className="shadow-xl h-[42px] w-[42px] px-0 justify-center" onClick={goToPrevious}/>
        <div className="w-[300px]">
          <SelectSecondary defaultValue={rangeOption} onSelect={switchDateRange} options={shiftDateRangesOptions}/>
        </div>
        <ButtonPrimary color="white" icon={faChevronRight} className="shadow-xl h-[42px] w-[42px] px-0 justify-center" onClick={goToNext}/>
        <div className="flex items-center gap-2 flex-wrap ml-2">
          {shiftEventTypes.map((eventType) => (
            <div key={eventType.value} className="relative group">
              <button
                type="button"
                onClick={() => setActiveType(eventType.value)}
                style={{backgroundColor: eventType.color}}
                className={`w-[22px] h-[22px] rounded-full cursor-pointer transition-transform ${activeType === eventType.value ? 'ring-2 ring-offset-2 ring-[#1F1F1F] scale-110' : ''}`}
              />
              <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-[4px] bg-[#1F1F1F] text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                {eventType.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-start">
        <ShiftTable
          days={days}
          fillWidth={rangeOption.unit !== 'month'}
          activeType={activeType}
          selectedEventIds={selectedEvents.map((e) => e.id)}
          manageableUserIds={manageableUserIds}
          onSelectEvent={handleSelectEvent}
          onEventUpdated={handleEventUpdated}
          onRowHover={handleRowHover}
        />
        <div className="w-[250px] shrink-0 bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mt-2 mr-2">
          {selectedEvents.length === 0 ? (
            <div className="text-[13px] text-[#9A9A9A] text-center py-6">Select an event to edit it</div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[14px] text-[#3C3C3C]">
                  {isMultiSelect ? `Multiple events (${selectedEvents.length})` : selectedEvents[0].employeeName}
                </span>
                <div className="flex items-center gap-2">
                  {isSaving && <span className="text-[11px] text-[#9A9A9A]">Saving…</span>}
                  {!canEditSelection && <span className="text-[11px] text-[#9A9A9A]">Read only</span>}
                  <button type="button" onClick={() => setSelectedEvents([])} className="text-[#3C3C3C] text-[16px] cursor-pointer leading-none">×</button>
                </div>
              </div>

              <SelectSecondary
                label="Type"
                options={shiftEventTypes}
                value={shiftEventTypes.find((t) => t.value === editType)}
                isDisabled={!canEditSelection}
                onSelect={(option: any) => {
                  setEditType(option.value)
                  scheduleAutosave({type: option.value})
                }}
              />

              {!isMultiSelect && (
                <>
                  <div>
                    <label className="font-bold text-[#3C3C3C] text-[13px] block mb-1">Start</label>
                    <input
                      type="datetime-local"
                      value={editStart}
                      disabled={!canEditSelection}
                      onChange={(e) => {
                        setEditStart(e.target.value)
                        scheduleAutosave({start: e.target.value})
                      }}
                      className="w-full border border-[#E0E0E0] rounded-[10px] p-2 text-[13px] outline-none focus:border-[#2B9AE9] disabled:bg-[#F6F6F6] disabled:text-[#9A9A9A]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#3C3C3C] text-[13px] block mb-1">End</label>
                    <input
                      type="datetime-local"
                      value={editEnd}
                      disabled={!canEditSelection}
                      onChange={(e) => {
                        setEditEnd(e.target.value)
                        scheduleAutosave({end: e.target.value})
                      }}
                      className="w-full border border-[#E0E0E0] rounded-[10px] p-2 text-[13px] outline-none focus:border-[#2B9AE9] disabled:bg-[#F6F6F6] disabled:text-[#9A9A9A]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#3C3C3C] text-[13px] block mb-1">Comment</label>
                    <textarea
                      value={editComment}
                      disabled={!canEditSelection}
                      onChange={(e) => {
                        setEditComment(e.target.value)
                        scheduleAutosave({comment: e.target.value})
                      }}
                      rows={4}
                      className="w-full border border-[#E0E0E0] rounded-[10px] p-2 text-[13px] outline-none focus:border-[#2B9AE9] resize-none disabled:bg-[#F6F6F6] disabled:text-[#9A9A9A]"
                    />
                  </div>
                </>
              )}

              {canEditSelection && (
                <ButtonPrimary color="red" text="Delete" onClick={handleDelete} disabled={isDeleting} className="w-full justify-center"/>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Shifts
