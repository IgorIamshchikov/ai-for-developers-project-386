import { useEffect, useState } from 'react'

import { calendarApiListEventTypes } from '@/api'
import type { EventType } from '@/api'

function Booking() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([])

  useEffect(() => {
    calendarApiListEventTypes().then(({ data }) => {
      if (data) setEventTypes(data)
    })
  }, [])

  return (
    <div className="flex min-h-svh flex-col items-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Выберите тип события</h1>
      <ul className="flex w-full max-w-md flex-col gap-4">
        {eventTypes.map((eventType) => (
          <li key={eventType.id} className="rounded-lg border p-4 text-left">
            <p className="font-medium">{eventType.title}</p>
            <p className="text-sm text-muted-foreground">{eventType.description}</p>
            <p className="text-sm text-muted-foreground">{eventType.durationMinutes} минут</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Booking
