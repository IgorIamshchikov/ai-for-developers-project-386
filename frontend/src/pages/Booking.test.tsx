import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { calendarApiListEventTypes } from '@/api'

import Booking from './Booking'

vi.mock('@/api', () => ({
  calendarApiListEventTypes: vi.fn(),
}))

describe('Страница записи', () => {
  it('показывает список типов событий: название, описание, длительность', async () => {
    vi.mocked(calendarApiListEventTypes).mockResolvedValue({
      data: [
        {
          id: '1',
          title: 'Знакомство',
          description: 'Короткий звонок на 15 минут',
          durationMinutes: 15,
        },
      ],
      error: undefined,
    })

    render(<Booking />)

    expect(await screen.findByText('Знакомство')).toBeDefined()
    expect(screen.getByText('Короткий звонок на 15 минут')).toBeDefined()
    expect(screen.getByText('15 минут')).toBeDefined()
  })
})
