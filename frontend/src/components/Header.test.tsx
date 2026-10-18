import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import Header from './Header'

describe('Шапка сайта', () => {
  it('ведёт на главную, запись и список встреч', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    )

    const links = screen.getAllByRole('link')

    expect(screen.getByRole('link', { name: 'Календарь звонков' }).getAttribute('href')).toBe('/')
    expect(screen.getByRole('link', { name: 'Записаться' }).getAttribute('href')).toBe('/booking')
    expect(screen.getByRole('link', { name: 'Предстоящие события' }).getAttribute('href')).toBe(
      '/owner/bookings',
    )
    expect(links.map((link) => link.textContent)).toEqual([
      'Календарь звонков',
      'Записаться',
      'Предстоящие события',
    ])
  })
})
