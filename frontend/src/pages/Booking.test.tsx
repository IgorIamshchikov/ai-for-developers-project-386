import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { calendarApiCreateBooking, calendarApiListEventTypes, calendarApiListSlots } from '@/api'

import Booking from './Booking'

vi.mock('@/api', () => ({
  calendarApiListEventTypes: vi.fn(),
  calendarApiListSlots: vi.fn(),
  calendarApiCreateBooking: vi.fn(),
}))

const eventType = {
  id: 'event-type-1',
  title: 'Знакомство',
  description: 'Короткий звонок на 15 минут',
  durationMinutes: 15,
}

const slot = { startsAt: '2026-01-01T10:30:00Z', endsAt: '2026-01-01T10:45:00Z' }
const dayLabel = new Date(slot.startsAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
const timeLabel = new Date(slot.startsAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

async function selectSlot() {
  render(<Booking />)

  fireEvent.click(await screen.findByText('Знакомство'))
  fireEvent.click(await screen.findByText(dayLabel))
  fireEvent.click(await screen.findByText(timeLabel))

  fireEvent.change(await screen.findByLabelText('Имя'), { target: { value: 'Алекс' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alex@example.com' } })
}

describe('Гостевой флоу бронирования', () => {
  it('проходит тип → день → слот → форму и показывает подтверждение', async () => {
    vi.mocked(calendarApiListEventTypes).mockResolvedValue({ data: [eventType], error: undefined })
    vi.mocked(calendarApiListSlots).mockResolvedValue({ data: [slot], error: undefined })
    vi.mocked(calendarApiCreateBooking).mockResolvedValue({
      data: {
        id: 'booking-1',
        eventTypeId: eventType.id,
        startsAt: slot.startsAt,
        visitorName: 'Алекс',
        visitorEmail: 'alex@example.com',
      },
      error: undefined,
    })

    await selectSlot()
    fireEvent.click(screen.getByRole('button', { name: 'Записаться' }))

    expect(await screen.findByText('Бронирование подтверждено')).toBeDefined()
    expect(calendarApiCreateBooking).toHaveBeenCalledWith({
      body: {
        eventTypeId: eventType.id,
        startsAt: slot.startsAt,
        visitorName: 'Алекс',
        visitorEmail: 'alex@example.com',
      },
    })
  })

  it('при slot_taken возвращает к выбору слота с сообщением', async () => {
    vi.mocked(calendarApiListEventTypes).mockResolvedValue({ data: [eventType], error: undefined })
    vi.mocked(calendarApiListSlots).mockResolvedValue({ data: [slot], error: undefined })
    vi.mocked(calendarApiCreateBooking).mockResolvedValue({
      data: undefined,
      error: { error: { code: 'slot_taken', message: 'This slot is already booked' } },
    })

    await selectSlot()
    fireEvent.click(screen.getByRole('button', { name: 'Записаться' }))

    expect(await screen.findByText('Слот уже занят, выберите другое время')).toBeDefined()
    expect(screen.getByText('Выберите время')).toBeDefined()
    expect(calendarApiListSlots).toHaveBeenCalledTimes(2)
  })
})
