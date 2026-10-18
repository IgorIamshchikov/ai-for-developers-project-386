import { useEffect, useState, type FormEvent } from 'react'

import { calendarApiCreateBooking, calendarApiListEventTypes, calendarApiListSlots } from '@/api'
import type { Booking as BookingResource, EventType, Slot } from '@/api'
import { Button } from '@/components/ui/button'

type Step = 'event-type' | 'day' | 'slot' | 'form' | 'confirmation'

type Day = {
  key: string
  label: string
  slots: Slot[]
}

function dayKey(iso: string) {
  const date = new Date(iso)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function groupByDay(slots: Slot[]): Day[] {
  const days: Day[] = []

  for (const slot of slots) {
    const key = dayKey(slot.startsAt)
    const day = days.find((candidate) => candidate.key === key)

    if (day) {
      day.slots.push(slot)
    } else {
      days.push({
        key,
        label: new Date(slot.startsAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
        slots: [slot],
      })
    }
  }

  return days
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function Booking() {
  const [step, setStep] = useState<Step>('event-type')
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null)
  const [days, setDays] = useState<Day[]>([])
  const [selectedDay, setSelectedDay] = useState<Day | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [visitorName, setVisitorName] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')
  const [confirmedBooking, setConfirmedBooking] = useState<BookingResource | null>(null)
  const [slotTaken, setSlotTaken] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    calendarApiListEventTypes().then(({ data }) => {
      if (data) setEventTypes(data)
    })
  }, [])

  async function fetchDays(eventType: EventType) {
    const { data } = await calendarApiListSlots({ path: { id: eventType.id } })
    setDays(data ? groupByDay(data) : [])
  }

  async function selectEventType(eventType: EventType) {
    setSelectedEventType(eventType)
    await fetchDays(eventType)
    setStep('day')
  }

  function selectDay(day: Day) {
    setSelectedDay(day)
    setStep('slot')
  }

  function selectSlot(slot: Slot) {
    setSelectedSlot(slot)
    setSlotTaken(false)
    setStep('form')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!selectedEventType || !selectedSlot) return

    const { data, error: apiError } = await calendarApiCreateBooking({
      body: {
        eventTypeId: selectedEventType.id,
        startsAt: selectedSlot.startsAt,
        visitorName,
        visitorEmail,
      },
    })

    if (apiError) {
      if (apiError.error.code === 'slot_taken') {
        setSlotTaken(true)
        setSelectedSlot(null)
        setStep('slot')
        await fetchDays(selectedEventType)
        return
      }

      setError(apiError.error.message)
      return
    }

    setConfirmedBooking(data)
    setStep('confirmation')
  }

  return (
    <div className="flex min-h-svh flex-col items-center gap-6 p-8">
      {step === 'event-type' && (
        <>
          <h1 className="text-2xl font-bold">Выберите тип события</h1>
          <ul className="flex w-full max-w-md flex-col gap-4">
            {eventTypes.map((eventType) => (
              <li key={eventType.id}>
                <button
                  type="button"
                  onClick={() => selectEventType(eventType)}
                  className="w-full rounded-lg border p-4 text-left"
                >
                  <p className="font-medium">{eventType.title}</p>
                  <p className="text-sm text-muted-foreground">{eventType.description}</p>
                  <p className="text-sm text-muted-foreground">{eventType.durationMinutes} минут</p>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {step === 'day' && (
        <>
          <h1 className="text-2xl font-bold">Выберите день</h1>
          <ul className="flex w-full max-w-md flex-col gap-2">
            {days.map((day) => (
              <li key={day.key}>
                <button
                  type="button"
                  onClick={() => selectDay(day)}
                  className="w-full rounded-lg border p-3 text-left capitalize"
                >
                  {day.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {step === 'slot' && selectedDay && (
        <>
          <h1 className="text-2xl font-bold">Выберите время</h1>
          {slotTaken && <p className="text-destructive">Слот уже занят, выберите другое время</p>}
          <ul className="flex w-full max-w-md flex-wrap gap-2">
            {(days.find((day) => day.key === selectedDay.key)?.slots ?? []).map((slot) => (
              <li key={slot.startsAt}>
                <button type="button" onClick={() => selectSlot(slot)} className="rounded-md border px-3 py-2">
                  {formatTime(slot.startsAt)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {step === 'form' && (
        <>
          <h1 className="text-2xl font-bold">Ваши данные</h1>
          <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4 text-left">
            <label className="flex flex-col gap-1">
              Имя
              <input
                value={visitorName}
                onChange={(event) => setVisitorName(event.target.value)}
                className="rounded-md border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              Email
              <input
                type="email"
                value={visitorEmail}
                onChange={(event) => setVisitorEmail(event.target.value)}
                className="rounded-md border px-3 py-2"
              />
            </label>
            <Button type="submit">Записаться</Button>
          </form>
          {error && <p className="text-destructive">{error}</p>}
        </>
      )}

      {step === 'confirmation' && confirmedBooking && (
        <>
          <h1 className="text-2xl font-bold">Бронирование подтверждено</h1>
          <p>
            {selectedEventType?.title} — {formatTime(confirmedBooking.startsAt)}
          </p>
          <p className="text-sm text-muted-foreground">
            {confirmedBooking.visitorName}, {confirmedBooking.visitorEmail}
          </p>
        </>
      )}
    </div>
  )
}

export default Booking
