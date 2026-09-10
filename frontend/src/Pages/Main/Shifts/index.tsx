import { useEffect, useState } from 'react'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import ButtonPrimary from '../../../Components/Buttons/ButtonPrimary'
import SelectSecondary from '../../../Components/Inputs/SelectSecondary'
import { shiftDateRangesOptions, shiftEventTypes } from '../../../Constants/options'
import ShiftTable from './components/ShiftTable'
import type { SelectedShiftEvent } from './components/UserRow'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateShift, deleteShift } from '../../../Services/shifts'
import { toast } from "react-toastify";
import { getRangeDays, normalizeAnchor, shiftAnchor, type RangeOption } from './dateRangeUtils'

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

  const [selectedEvent, setSelectedEvent] = useState<SelectedShiftEvent | null>(null)
  const [editType, setEditType] = useState('')
  const [editComment, setEditComment] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')

  useEffect(() => {
    if (!selectedEvent) return
    setEditType(selectedEvent.type)
    setEditComment(selectedEvent.comment ?? '')
    setEditStart(toDatetimeLocalValue(selectedEvent.startDate))
    setEditEnd(toDatetimeLocalValue(selectedEvent.endDate))
  }, [selectedEvent])

  const updateMutation = useMutation({
    mutationFn: ({id, payload}: {id: string, payload: any}) => updateShift(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['shifts']})
      setSelectedEvent(null)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Nie udało się zapisać zmian')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['shifts']})
      setSelectedEvent(null)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Nie udało się usunąć eventu')
    },
  })

  const switchDateRange = (option: RangeOption) => {
    setRangeOption(option)
    setAnchor((prev) => normalizeAnchor(prev, option))
  }

  const goToPrevious = () => setAnchor((prev) => shiftAnchor(prev, rangeOption, -1))
  const goToNext = () => setAnchor((prev) => shiftAnchor(prev, rangeOption, 1))

  const handleSave = () => {
    if (!selectedEvent) return
    updateMutation.mutate({
      id: selectedEvent.id,
      payload: {
        type: editType,
        comment: editComment || null,
        startDate: new Date(editStart),
        endDate: new Date(editEnd),
      },
    })
  }

  const handleDelete = () => {
    if (!selectedEvent) return
    deleteMutation.mutate(selectedEvent.id)
  }

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
          days={getRangeDays(anchor, rangeOption)}
          fillWidth={rangeOption.unit !== 'month'}
          activeType={activeType}
          selectedEventId={selectedEvent?.id ?? null}
          onSelectEvent={setSelectedEvent}
        />
        <div className="w-[250px] shrink-0 bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mt-2 mr-2">
          {selectedEvent ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[14px] text-[#3C3C3C]">{selectedEvent.employeeName}</span>
                <button type="button" onClick={() => setSelectedEvent(null)} className="text-[#3C3C3C] text-[16px] cursor-pointer leading-none">×</button>
              </div>

              <SelectSecondary
                label="Type"
                options={shiftEventTypes}
                value={shiftEventTypes.find((t) => t.value === editType)}
                onSelect={(option: any) => setEditType(option.value)}
              />

              <div>
                <label className="font-bold text-[#3C3C3C] text-[13px] block mb-1">Start</label>
                <input
                  type="datetime-local"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  className="w-full border border-[#E0E0E0] rounded-[10px] p-2 text-[13px] outline-none focus:border-[#2B9AE9]"
                />
              </div>

              <div>
                <label className="font-bold text-[#3C3C3C] text-[13px] block mb-1">End</label>
                <input
                  type="datetime-local"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                  className="w-full border border-[#E0E0E0] rounded-[10px] p-2 text-[13px] outline-none focus:border-[#2B9AE9]"
                />
              </div>

              <div>
                <label className="font-bold text-[#3C3C3C] text-[13px] block mb-1">Comment</label>
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  rows={4}
                  className="w-full border border-[#E0E0E0] rounded-[10px] p-2 text-[13px] outline-none focus:border-[#2B9AE9] resize-none"
                />
              </div>

              <div className="flex gap-2">
                <ButtonPrimary color="blue" text="Save" onClick={handleSave} disabled={updateMutation.isPending} className="flex-1 justify-center"/>
                <ButtonPrimary color="red" text="Delete" onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 justify-center"/>
              </div>
            </div>
          ) : (
            <div className="text-[13px] text-[#9A9A9A] text-center py-6">Select an event to edit it</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Shifts
