import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { calendarApiCreateEventType } from '@/api'

import OwnerEventTypesNew from './OwnerEventTypesNew'

vi.mock('@/api', () => ({
  calendarApiCreateEventType: vi.fn(),
}))

function fillForm() {
  fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Знакомство' } })
  fireEvent.change(screen.getByLabelText('Описание'), {
    target: { value: 'Короткий звонок на 15 минут' },
  })
  fireEvent.change(screen.getByLabelText('Длительность, мин'), { target: { value: '15' } })
  fireEvent.click(screen.getByRole('button', { name: 'Создать' }))
}

describe('Страница владельца: создание типа события', () => {
  it('создаёт тип события и показывает подтверждение', async () => {
    vi.mocked(calendarApiCreateEventType).mockResolvedValue({
      data: {
        id: '1',
        title: 'Знакомство',
        description: 'Короткий звонок на 15 минут',
        durationMinutes: 15,
      },
      error: undefined,
    })

    render(<OwnerEventTypesNew />)
    fillForm()

    expect(await screen.findByText('Тип события «Знакомство» создан')).toBeDefined()
    expect(calendarApiCreateEventType).toHaveBeenCalledWith({
      body: {
        title: 'Знакомство',
        description: 'Короткий звонок на 15 минут',
        durationMinutes: 15,
      },
    })
  })

  it('показывает сообщение об ошибке валидации от сервера', async () => {
    vi.mocked(calendarApiCreateEventType).mockResolvedValue({
      data: undefined,
      error: { error: { code: 'validation', message: "Title can't be blank" } },
    })

    render(<OwnerEventTypesNew />)
    fillForm()

    expect(await screen.findByText("Title can't be blank")).toBeDefined()
  })
})
