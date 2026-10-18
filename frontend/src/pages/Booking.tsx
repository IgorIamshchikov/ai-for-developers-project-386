import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ru } from 'date-fns/locale'

import { calendarApiCreateBooking, calendarApiListEventTypes, calendarApiListSlots } from '@/api'
import type { Booking as BookingResource, EventType, Slot } from '@/api'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

type Step = 'event-type' | 'schedule' | 'form' | 'confirmation'

type Day = {
  key: string
  date: Date
  label: string
  slots: Slot[]
}

function dayKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function groupByDay(slots: Slot[]): Day[] {
  const days: Day[] = []

  for (const slot of slots) {
    const startsAt = new Date(slot.startsAt)
    const key = dayKeyFromDate(startsAt)
    const day = days.find((candidate) => candidate.key === key)

    if (day) {
      day.slots.push(slot)
    } else {
      days.push({
        key,
        date: new Date(startsAt.getFullYear(), startsAt.getMonth(), startsAt.getDate()),
        label: startsAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
        slots: [slot],
      })
    }
  }

  return days.sort((a, b) => a.date.getTime() - b.date.getTime())
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function nearestAvailableDay(fetchedDays: Day[]): Day | null {
  return fetchedDays[0] ?? null
}

function Booking() {
  const [step, setStep] = useState<Step>('event-type')
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null)
  const [days, setDays] = useState<Day[]>([])
  const [selectedDay, setSelectedDay] = useState<Day | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date())
  const [visitorName, setVisitorName] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')
  const [confirmedBooking, setConfirmedBooking] = useState<BookingResource | null>(null)
  const [slotTaken, setSlotTaken] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableDayKeys = useMemo(() => new Set(days.map((day) => day.key)), [days])

  useEffect(() => {
    calendarApiListEventTypes().then(({ data }) => {
      if (data) setEventTypes(data)
    })
  }, [])

  async function fetchDays(eventType: EventType): Promise<Day[]> {
    const { data } = await calendarApiListSlots({ path: { id: eventType.id } })
    const fetchedDays = data ? groupByDay(data) : []
    setDays(fetchedDays)
    return fetchedDays
  }

  async function selectEventType(eventType: EventType) {
    setSelectedEventType(eventType)
    setSelectedSlot(null)
    setSlotTaken(false)
    setError(null)

    const fetchedDays = await fetchDays(eventType)
    const nearest = nearestAvailableDay(fetchedDays)
    setSelectedDay(nearest)
    setCalendarMonth((previous) => nearest?.date ?? previous)
    setStep('schedule')
  }

  function selectDay(day: Day) {
    setSelectedDay(day)
    setSelectedSlot(null)
    setSlotTaken(false)
  }

  function selectSlot(slot: Slot) {
    setSelectedSlot(slot)
    setSlotTaken(false)
  }

  function continueToForm() {
    setError(null)
    setStep('form')
  }

  function goBackToEventType() {
    setStep('event-type')
  }

  function goBackToSchedule() {
    setSlotTaken(false)
    setError(null)
    setStep('schedule')
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
        setStep('schedule')
        await fetchDays(selectedEventType)
        return
      }

      setError(apiError.error.message)
      return
    }

    setConfirmedBooking(data)
    setStep('confirmation')
  }

  const selectedDaySlots = selectedDay
    ? days.find((day) => day.key === selectedDay.key)?.slots ?? []
    : []

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-8">
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

      {step === 'schedule' && (
        <>
          <div className="flex w-full max-w-2xl self-start">
            <Button type="button" variant="ghost" size="sm" onClick={goBackToEventType}>
              ← Назад
            </Button>
          </div>
          <h1 className="text-2xl font-bold">Выберите дату и время</h1>
          <div className="flex w-full max-w-2xl flex-col gap-6 md:flex-row md:justify-center">
            <Calendar
              mode="single"
              locale={ru}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              selected={selectedDay?.date}
              onSelect={(date) => {
                if (!date) return
                const found = days.find((day) => day.key === dayKeyFromDate(date))
                if (found) selectDay(found)
              }}
              disabled={(date) => !availableDayKeys.has(dayKeyFromDate(date))}
              className="rounded-lg border"
            />
            <div className="flex w-full flex-col gap-4 md:w-56">
              <h2 className="font-medium capitalize">
                {selectedDay ? selectedDay.label : 'Нет доступных дат'}
              </h2>
              {slotTaken && <p className="text-destructive">Слот уже занят, выберите другое время</p>}
              <ul className="flex flex-wrap gap-2">
                {selectedDaySlots.map((slot) => (
                  <li key={slot.startsAt}>
                    <button
                      type="button"
                      onClick={() => selectSlot(slot)}
                      aria-pressed={selectedSlot?.startsAt === slot.startsAt}
                      className={cn(
                        'rounded-md border px-3 py-2',
                        selectedSlot?.startsAt === slot.startsAt && 'border-primary bg-primary/10',
                      )}
                    >
                      {formatTime(slot.startsAt)}
                    </button>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                size="lg"
                disabled={!selectedSlot}
                onClick={continueToForm}
                className="mt-auto"
              >
                Продолжить
              </Button>
            </div>
          </div>
        </>
      )}

      {step === 'form' && (
        <>
          <div className="flex w-full max-w-md self-start">
            <Button type="button" variant="ghost" size="sm" onClick={goBackToSchedule}>
              ← Назад
            </Button>
          </div>
          <h1 className="text-2xl font-bold">Подтверждение записи</h1>
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
