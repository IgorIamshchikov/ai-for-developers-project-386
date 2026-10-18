import { useEffect, useState } from 'react'

import { calendarApiListBookings, calendarApiListEventTypes } from '@/api'
import type { Booking, EventType } from '@/api'

function formatStartsAt(iso: string) {
  const date = new Date(iso)
  const day = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  return `${day}, ${time}`
}

function OwnerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [eventTypes, setEventTypes] = useState<EventType[]>([])

  useEffect(() => {
    calendarApiListBookings().then(({ data }) => {
      if (data) setBookings(data)
    })
    calendarApiListEventTypes().then(({ data }) => {
      if (data) setEventTypes(data)
    })
  }, [])

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Предстоящие встречи</h1>
      <ul className="flex w-full max-w-md flex-col gap-4">
        {bookings.map((booking) => {
          const eventType = eventTypes.find((candidate) => candidate.id === booking.eventTypeId)

          return (
            <li key={booking.id} className="rounded-lg border p-4">
              <p className="font-medium">{eventType?.title}</p>
              <p className="text-sm text-muted-foreground">
                <span>{formatStartsAt(booking.startsAt)}</span>
                {eventType && <> · <span>{eventType.durationMinutes} минут</span></>}
              </p>
              <p className="text-sm text-muted-foreground">
                <span>{booking.visitorName}</span>, <span>{booking.visitorEmail}</span>
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default OwnerBookings
