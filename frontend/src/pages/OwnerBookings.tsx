import { useEffect, useState } from 'react'

import { calendarApiListBookings } from '@/api'
import type { Booking } from '@/api'

function formatStartsAt(iso: string) {
  const date = new Date(iso)
  const day = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  return `${day}, ${time}`
}

function OwnerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    calendarApiListBookings().then(({ data }) => {
      if (data) setBookings(data)
    })
  }, [])

  return (
    <div className="flex min-h-svh flex-col items-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Предстоящие встречи</h1>
      <ul className="flex w-full max-w-md flex-col gap-4">
        {bookings.map((booking) => (
          <li key={booking.id} className="rounded-lg border p-4">
            <p className="font-medium">{formatStartsAt(booking.startsAt)}</p>
            <p className="text-sm text-muted-foreground">
              <span>{booking.visitorName}</span>, <span>{booking.visitorEmail}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default OwnerBookings
