import { expect, test } from '@playwright/test'

test('opens the dashboard and navigates through primary modules', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('把今天过得清楚一点')).toBeVisible()
  await page.getByRole('link', { name: '健康' }).first().click()
  await expect(page.getByText('照顾身体，也看见变化')).toBeVisible()
  await page.getByRole('button', { name: /记饮食/ }).click()
  await expect(page.getByRole('dialog', { name: '记录饮食' })).toBeVisible()
})

test('creates a task and keeps it after reload', async ({ page }) => {
  await page.goto('/tasks')
  await page.getByRole('button', { name: /新建待办/ }).click()
  await page.getByLabel('待办标题').fill('Playwright 验收事项')
  await page.getByRole('button', { name: '保存记录' }).click()
  await expect(page.getByText('Playwright 验收事项')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Playwright 验收事项')).toBeVisible()
})
