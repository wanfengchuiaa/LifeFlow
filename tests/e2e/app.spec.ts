import { expect, test } from '@playwright/test'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/')
  if (await page.getByLabel('用户名').isVisible().catch(() => false)) {
    await page.getByLabel('用户名').fill(process.env.E2E_USERNAME || 'admin')
    await page.getByLabel('密码').fill(process.env.E2E_PASSWORD || 'change-this-password')
    await page.getByRole('button', { name: '登录' }).click()
  }
  await expect(page.locator('.app-shell')).toBeVisible()
}

test('opens the dashboard and navigates through primary modules', async ({ page }) => {
  await login(page)
  await expect(page.getByText('人生进度条')).toBeVisible()
  await expect(page.getByRole('button', { name: '换一句' })).toBeVisible()
  await page.getByRole('link', { name: '健康' }).first().click()
  await expect(page.getByText('照顾身体，也看见变化')).toBeVisible()
  await page.getByRole('button', { name: /记饮食/ }).click()
  await expect(page.getByRole('dialog', { name: '记录饮食' })).toBeVisible()
})

test('creates a task and keeps it after reload', async ({ page }) => {
  await login(page)
  await page.goto('/tasks')
  await page.getByRole('button', { name: /新建待办/ }).click()
  await page.getByLabel('待办标题').fill('Playwright 验收事项')
  await page.getByRole('button', { name: '保存记录' }).click()
  await expect(page.getByText('Playwright 验收事项')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Playwright 验收事项')).toBeVisible()
})
