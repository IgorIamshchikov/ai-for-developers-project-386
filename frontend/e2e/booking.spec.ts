import { expect, test } from '@playwright/test'

// Сквозной тест против настоящего бекенда (SDK не замокан): владелец
// создаёт тип события, гость через реальный флоу бронирует его, и запись
// должна появиться в списке владельца — так проверяется совместная работа
// фронтенда и Rails-API, а не только компонент в изоляции.
test('владелец создаёт тип события, гость бронирует его, и запись видна владельцу', async ({ page }) => {
  const stamp = Date.now()
  const title = `E2E встреча ${stamp}`
  const visitorName = 'Плейрайт Тестов'
  const visitorEmail = `e2e-${stamp}@example.com`

  await page.goto('/owner/event-types/new')
  await page.getByLabel('Название').fill(title)
  await page.getByLabel('Описание').fill('Создано сквозным тестом Playwright')
  await page.getByLabel('Длительность, мин').fill('15')
  await page.getByRole('button', { name: 'Создать' }).click()
  await expect(page.getByText(`Тип события «${title}» создан`)).toBeVisible()

  await page.goto('/booking')
  await page.getByText(title, { exact: true }).click()

  const firstSlot = page.locator('button[aria-pressed]').first()
  await firstSlot.waitFor()
  await firstSlot.click()
  await page.getByRole('button', { name: 'Продолжить' }).click()

  await page.getByLabel('Имя').fill(visitorName)
  await page.getByLabel('Email').fill(visitorEmail)
  await page.getByRole('button', { name: 'Записаться' }).click()
  await expect(page.getByRole('heading', { name: 'Бронирование подтверждено' })).toBeVisible()

  await page.goto('/owner/bookings')
  const bookingItem = page.locator('li', { hasText: title })
  await expect(bookingItem).toContainText(visitorName)
  await expect(bookingItem).toContainText(visitorEmail)
})
