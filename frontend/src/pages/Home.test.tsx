import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import Home from './Home'

describe('Главная страница', () => {
  it('показывает название сервиса заголовком', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Календарь звонков' })).toBeDefined()
  })

  it('ведёт на страницу записи', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    const cta = screen.getByRole('link', { name: 'Записаться на звонок' })

    expect(cta.getAttribute('href')).toBe('/booking')
  })
})
