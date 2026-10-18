import { useState, type FormEvent } from 'react'

import { calendarApiCreateEventType } from '@/api'
import { Button } from '@/components/ui/button'

function OwnerEventTypesNew() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [createdTitle, setCreatedTitle] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const { data, error: apiError } = await calendarApiCreateEventType({
      body: { title, description, durationMinutes: Number(durationMinutes) },
    })

    if (apiError) {
      setError(apiError.error.message)
      return
    }

    setCreatedTitle(data.title)
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Новый тип события</h1>
      <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4 text-left">
        <label className="flex flex-col gap-1">
          Название
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          Описание
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          Длительность, мин
          <input
            type="number"
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </label>
        <Button type="submit">Создать</Button>
      </form>
      {createdTitle && <p>Тип события «{createdTitle}» создан</p>}
      {error && <p className="text-destructive">{error}</p>}
    </div>
  )
}

export default OwnerEventTypesNew
