import Dexie, { type EntityTable } from 'dexie'
import { z } from 'zod'
import type { Account, AppSettings, BackupFile, BodyMetric, Budget, Category, FoodPreset, MealEntry, ScheduleEvent, Task, TimeEntry, Transaction } from './types'
import { fromLocalInput, localDateKey, monthKey, newBase, nowIso, toLocalInput } from './utils'

export class LifeFlowDatabase extends Dexie {
  settings!: EntityTable<AppSettings, 'key'>
  categories!: EntityTable<Category, 'id'>
  foodPresets!: EntityTable<FoodPreset, 'id'>
  mealEntries!: EntityTable<MealEntry, 'id'>
  bodyMetrics!: EntityTable<BodyMetric, 'id'>
  tasks!: EntityTable<Task, 'id'>
  scheduleEvents!: EntityTable<ScheduleEvent, 'id'>
  timeEntries!: EntityTable<TimeEntry, 'id'>
  accounts!: EntityTable<Account, 'id'>
  transactions!: EntityTable<Transaction, 'id'>
  budgets!: EntityTable<Budget, 'id'>

  constructor() {
    super('lifeflow')
    this.version(1).stores({
      settings: '&key',
      categories: '&id, domain, deletedAt',
      foodPresets: '&id, name, deletedAt',
      mealEntries: '&id, occurredAt, mealType, deletedAt',
      bodyMetrics: '&id, measuredAt, deletedAt',
      tasks: '&id, status, dueAt, deletedAt',
      scheduleEvents: '&id, startAt, endAt, deletedAt',
      timeEntries: '&id, startAt, endAt, deletedAt',
      accounts: '&id, name, deletedAt',
      transactions: '&id, occurredAt, accountId, type, deletedAt',
      budgets: '&id, month, categoryId, deletedAt'
    })
  }
}

export const db = new LifeFlowDatabase()

const profile: AppSettings = {
  key: 'profile', calorieTarget: 2000, targetWeightKg: 65, currency: 'CNY',
  weekStartsOn: 1, timezone: 'Asia/Shanghai', seeded: true, birthDate: '', birthTime: '', gender: 'unknown'
}

const active = <T extends { deletedAt: string | null }>(rows: T[]) => rows.filter(row => !row.deletedAt)

export async function ensureSeeded(sample = true) {
  if (await db.settings.get('profile')) return
  await seedStarter(sample)
}

export async function seedStarter(sample: boolean) {
  const baseCategories: Category[] = [
    ['task', '工作', '#2c7be5'], ['task', '生活', '#1e9b68'], ['task', '健康', '#ff765d'],
    ['finance', '餐饮', '#ff765d'], ['finance', '交通', '#2c7be5'], ['finance', '购物', '#8b6de9'], ['finance', '工资', '#1e9b68'],
    ['time', '专注', '#2c7be5'], ['time', '运动', '#1e9b68'], ['time', '休息', '#ffd15c']
  ].map(([domain, name, color]) => ({ ...newBase(), domain: domain as Category['domain'], name, color }))
  const account: Account = { ...newBase(), name: '日常账户', type: 'digital', openingBalance: 5000 }
  const presets: FoodPreset[] = [
    { ...newBase(), name: '燕麦牛奶', portion: 1, unit: '杯', calories: 280 },
    { ...newBase(), name: '鸡胸肉饭', portion: 1, unit: '份', calories: 520 },
    { ...newBase(), name: '香蕉', portion: 1, unit: '根', calories: 105 }
  ]
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map(table => table.clear()))
    await db.settings.put(profile)
    await db.categories.bulkAdd(baseCategories)
    await db.accounts.add(account)
    await db.foodPresets.bulkAdd(presets)
    if (!sample) return

    const today = new Date()
    const at = (hour: number, minute = 0) => {
      const value = new Date(today)
      value.setHours(hour, minute, 0, 0)
      return value.toISOString()
    }
    const taskCategory = baseCategories.find(x => x.domain === 'task' && x.name === '工作')!
    const financeFood = baseCategories.find(x => x.domain === 'finance' && x.name === '餐饮')!
    const timeFocus = baseCategories.find(x => x.domain === 'time' && x.name === '专注')!
    const demoTask: Task = { ...newBase(), title: '整理本周计划', categoryId: taskCategory.id, priority: 'high', dueAt: at(18), recurrence: 'weekly', status: 'todo', completedAt: null, note: '' }
    await db.mealEntries.bulkAdd([
      { ...newBase(), name: '燕麦牛奶', portion: 1, unit: '杯', calories: 280, mealType: 'breakfast', occurredAt: at(8, 10), note: '' },
      { ...newBase(), name: '鸡胸肉饭', portion: 1, unit: '份', calories: 520, mealType: 'lunch', occurredAt: at(12, 20), note: '' }
    ])
    await db.bodyMetrics.bulkAdd([
      { ...newBase(), measuredAt: new Date(today.getTime() - 6 * 86400000).toISOString(), heightCm: 172, weightKg: 68.4, note: '' },
      { ...newBase(), measuredAt: at(7, 30), heightCm: 172, weightKg: 67.8, note: '' }
    ])
    await db.tasks.bulkAdd([
      demoTask,
      { ...newBase(), title: '晚饭后散步 30 分钟', categoryId: baseCategories.find(x => x.name === '健康')!.id, priority: 'medium', dueAt: at(20), recurrence: 'daily', status: 'todo', completedAt: null, note: '' },
      { ...newBase(), title: '回复重要消息', categoryId: taskCategory.id, priority: 'medium', dueAt: at(11), recurrence: 'none', status: 'done', completedAt: at(10, 35), note: '' }
    ])
    await db.scheduleEvents.add({ ...newBase(), title: '深度工作', startAt: at(14), endAt: at(16), categoryId: timeFocus.id, linkedTaskId: demoTask.id, note: '' })
    await db.timeEntries.add({ ...newBase(), title: '晨间专注', startAt: at(9), endAt: at(10, 25), durationMinutes: 85, categoryId: timeFocus.id, linkedTaskId: null, source: 'manual', note: '' })
    await db.transactions.add({ ...newBase(), type: 'expense', amount: 32, accountId: account.id, categoryId: financeFood.id, occurredAt: at(12, 25), note: '午餐' })
    await db.budgets.add({ ...newBase(), month: monthKey(), categoryId: null, amount: 3000 })
  })
}

export async function readAll() {
  const [settings, categories, foodPresets, mealEntries, bodyMetrics, tasks, scheduleEvents, timeEntries, accounts, transactions, budgets] = await Promise.all([
    db.settings.toArray(), db.categories.toArray(), db.foodPresets.toArray(), db.mealEntries.toArray(), db.bodyMetrics.toArray(),
    db.tasks.toArray(), db.scheduleEvents.toArray(), db.timeEntries.toArray(), db.accounts.toArray(), db.transactions.toArray(), db.budgets.toArray()
  ])
  return { settings, categories: active(categories), foodPresets: active(foodPresets), mealEntries: active(mealEntries), bodyMetrics: active(bodyMetrics), tasks: active(tasks), scheduleEvents: active(scheduleEvents), timeEntries: active(timeEntries), accounts: active(accounts), transactions: active(transactions), budgets: active(budgets) }
}

export async function exportBackup(): Promise<BackupFile> {
  const data = await readAll()
  return { formatVersion: 1, exportedAt: nowIso(), appVersion: '1.0.0', data }
}

const backupSchema = z.object({
  formatVersion: z.literal(1),
  exportedAt: z.string(),
  appVersion: z.string(),
  data: z.object({
    settings: z.array(z.object({ key: z.literal('profile') }).passthrough()),
    categories: z.array(z.object({ id: z.string(), domain: z.enum(['task', 'finance', 'time']) }).passthrough()),
    foodPresets: z.array(z.object({ id: z.string(), calories: z.number() }).passthrough()),
    mealEntries: z.array(z.object({ id: z.string(), calories: z.number(), occurredAt: z.string() }).passthrough()),
    bodyMetrics: z.array(z.object({ id: z.string(), weightKg: z.number(), heightCm: z.number() }).passthrough()),
    tasks: z.array(z.object({ id: z.string(), title: z.string(), status: z.enum(['todo', 'done']) }).passthrough()),
    scheduleEvents: z.array(z.object({ id: z.string(), startAt: z.string(), endAt: z.string() }).passthrough()),
    timeEntries: z.array(z.object({ id: z.string(), startAt: z.string(), durationMinutes: z.number() }).passthrough()),
    accounts: z.array(z.object({ id: z.string(), openingBalance: z.number() }).passthrough()),
    transactions: z.array(z.object({ id: z.string(), amount: z.number(), accountId: z.string() }).passthrough()),
    budgets: z.array(z.object({ id: z.string(), month: z.string(), amount: z.number() }).passthrough())
  })
})

export async function importBackup(raw: unknown) {
  const parsed = backupSchema.parse(raw) as unknown as BackupFile
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map(table => table.clear()))
    await db.settings.bulkAdd(parsed.data.settings)
    await db.categories.bulkAdd(parsed.data.categories)
    await db.foodPresets.bulkAdd(parsed.data.foodPresets)
    await db.mealEntries.bulkAdd(parsed.data.mealEntries)
    await db.bodyMetrics.bulkAdd(parsed.data.bodyMetrics)
    await db.tasks.bulkAdd(parsed.data.tasks)
    await db.scheduleEvents.bulkAdd(parsed.data.scheduleEvents)
    await db.timeEntries.bulkAdd(parsed.data.timeEntries)
    await db.accounts.bulkAdd(parsed.data.accounts)
    await db.transactions.bulkAdd(parsed.data.transactions)
    await db.budgets.bulkAdd(parsed.data.budgets)
  })
}

export const seedDateTime = (hour: number) => {
  const value = toLocalInput(new Date())
  return fromLocalInput(`${localDateKey(new Date())}T${String(hour).padStart(2, '0')}:${value.slice(14, 16)}`)
}
