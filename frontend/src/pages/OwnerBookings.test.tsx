import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { calendarApiListBookings, calendarApiListEventTypes } from '@/api'

import OwnerBookings from './OwnerBookings'

vi.mock('@/api', () => ({
  calendarApiListBookings: vi.fn(),
  calendarApiListEventTypes: vi.fn(),
}))

describe('Страница владельца: предстоящие встречи', () => {
  it('показывает предстоящие бронирования с типом события, длительностью, временем, именем и email', async () => {
    vi.mocked(calendarApiListEventTypes).mockResolvedValue({
      data: [
        { id: 'et-1', title: 'Знакомство', description: 'Короткий звонок', durationMinutes: 15 },
        { id: 'et-2', title: 'Консультация', description: 'Подробный разбор', durationMinutes: 45 },
      ],
      error: undefined,
    })
    vi.mocked(calendarApiListBookings).mockResolvedValue({
      data: [
        {
          id: 'b-1',
          eventTypeId: 'et-1',
          startsAt: '2026-01-01T10:30:00Z',
          visitorName: 'Алекс',
          visitorEmail: 'alex@example.com',
        },
        {
          id: 'b-2',
          eventTypeId: 'et-2',
          startsAt: '2026-01-02T09:00:00Z',
          visitorName: 'Борис',
          visitorEmail: 'boris@example.com',
        },
      ],
      error: undefined,
    })

    render(<OwnerBookings />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Предстоящие встречи' }),
    ).toBeDefined()

    expect(await screen.findByText('Алекс')).toBeDefined()
    expect(screen.getByText('alex@example.com')).toBeDefined()
    expect(screen.getByText('Знакомство')).toBeDefined()
    expect(screen.getByText('15 минут')).toBeDefined()
    const firstStartsAt = new Date('2026-01-01T10:30:00Z')
    const firstStartsAtText = `${firstStartsAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}, ${firstStartsAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
    expect(screen.getByText(firstStartsAtText)).toBeDefined()

    expect(screen.getByText('Борис')).toBeDefined()
    expect(screen.getByText('boris@example.com')).toBeDefined()
    expect(screen.getByText('Консультация')).toBeDefined()
    expect(screen.getByText('45 минут')).toBeDefined()
  })
})
