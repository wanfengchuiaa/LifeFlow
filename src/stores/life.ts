import { computed, ref } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { db, ensureSeeded, exportBackup, importBackup, readAll, seedStarter } from '@/db'
import type { Account, AppSettings, BodyMetric, Budget, Category, ComposerKind, FoodPreset, MealEntry, ScheduleEvent, Task, TimeEntry, Transaction } from '@/types'
import { addRecurrence, localDateKey, monthKey, newBase, nowIso } from '@/utils'

type ComposerSeed = Record<string, string | number | null>

export const useLifeStore = defineStore('life', () => {
  const ready = ref(false)
  const composerKind = ref<ComposerKind | null>(null)
  const composerSeed = ref<ComposerSeed>({})
  const settings = ref<AppSettings>({ key: 'profile', calorieTarget: 2000, targetWeightKg: 65, currency: 'CNY', weekStartsOn: 1, timezone: 'Asia/Shanghai', seeded: true, birthDate: '', birthTime: '', gender: 'unknown' })
  const categories = ref<Category[]>([])
  const foodPresets = ref<FoodPreset[]>([])
  const mealEntries = ref<MealEntry[]>([])
  const bodyMetrics = ref<BodyMetric[]>([])
  const tasks = ref<Task[]>([])
  const scheduleEvents = ref<ScheduleEvent[]>([])
  const timeEntries = ref<TimeEntry[]>([])
  const accounts = ref<Account[]>([])
  const transactions = ref<Transaction[]>([])
  const budgets = ref<Budget[]>([])

  const today = computed(() => localDateKey(new Date()))
  const todayMeals = computed(() => mealEntries.value.filter(x => localDateKey(x.occurredAt) === today.value))
  const caloriesToday = computed(() => todayMeals.value.reduce((sum, x) => sum + x.calories, 0))
  const latestBody = computed(() => [...bodyMetrics.value].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))[0])
  const todayTasks = computed(() => tasks.value.filter(x => x.status === 'todo' && (!x.dueAt || localDateKey(x.dueAt) <= today.value)).sort((a, b) => (a.dueAt || '').localeCompare(b.dueAt || '')))
  const completedToday = computed(() => tasks.value.filter(x => x.status === 'done' && x.completedAt && localDateKey(x.completedAt) === today.value).length)
  const todayEvents = computed(() => scheduleEvents.value.filter(x => localDateKey(x.startAt) === today.value).sort((a, b) => a.startAt.localeCompare(b.startAt)))
  const todayTime = computed(() => timeEntries.value.filter(x => localDateKey(x.startAt) === today.value).reduce((sum, x) => sum + (x.endAt ? x.durationMinutes : elapsedMinutes(x.startAt)), 0))
  const activeTimer = computed(() => timeEntries.value.find(x => x.source === 'timer' && !x.endAt))
  const currentMonthTransactions = computed(() => transactions.value.filter(x => monthKey(new Date(x.occurredAt)) === monthKey()))
  const monthExpense = computed(() => currentMonthTransactions.value.filter(x => x.type === 'expense').reduce((sum, x) => sum + x.amount, 0))
  const monthIncome = computed(() => currentMonthTransactions.value.filter(x => x.type === 'income').reduce((sum, x) => sum + x.amount, 0))
  const monthBudget = computed(() => budgets.value.find(x => x.month === monthKey() && !x.categoryId)?.amount || 0)

  async function init() {
    await ensureSeeded(true)
    await refresh()
    ready.value = true
  }

  async function refresh() {
    const data = await readAll()
    settings.value = data.settings[0] || settings.value
    categories.value = data.categories
    foodPresets.value = data.foodPresets
    mealEntries.value = data.mealEntries
    bodyMetrics.value = data.bodyMetrics
    tasks.value = data.tasks
    scheduleEvents.value = data.scheduleEvents
    timeEntries.value = data.timeEntries
    accounts.value = data.accounts
    transactions.value = data.transactions
    budgets.value = data.budgets
  }

  function openComposer(kind: ComposerKind, seed: ComposerSeed = {}) {
    composerKind.value = kind
    composerSeed.value = seed
  }
  function closeComposer() { composerKind.value = null; composerSeed.value = {} }

  async function addMeal(input: Omit<MealEntry, keyof ReturnType<typeof newBase>>) {
    await db.mealEntries.add({ ...newBase(), ...input })
    await refresh()
  }
  async function addFoodPreset(input: Pick<FoodPreset, 'name' | 'portion' | 'unit' | 'calories'>) {
    await db.foodPresets.add({ ...newBase(), ...input })
    await refresh()
  }
  async function addBody(input: Omit<BodyMetric, keyof ReturnType<typeof newBase>>) { await db.bodyMetrics.add({ ...newBase(), ...input }); await refresh() }
  async function addTask(input: Omit<Task, keyof ReturnType<typeof newBase>>) { await db.tasks.add({ ...newBase(), ...input }); await refresh() }
  async function addEvent(input: Omit<ScheduleEvent, keyof ReturnType<typeof newBase>>) { await db.scheduleEvents.add({ ...newBase(), ...input }); await refresh() }
  async function addTime(input: Omit<TimeEntry, keyof ReturnType<typeof newBase>>) { await db.timeEntries.add({ ...newBase(), ...input }); await refresh() }
  async function addAccount(input: Omit<Account, keyof ReturnType<typeof newBase>>) { await db.accounts.add({ ...newBase(), ...input }); await refresh() }
  async function addTransaction(input: Omit<Transaction, keyof ReturnType<typeof newBase>>) { await db.transactions.add({ ...newBase(), ...input }); await refresh() }
  async function addBudget(input: Omit<Budget, keyof ReturnType<typeof newBase>>) {
    const current = budgets.value.find(x => x.month === input.month && x.categoryId === input.categoryId)
    if (current) await db.budgets.update(current.id, { amount: input.amount, updatedAt: nowIso() })
    else await db.budgets.add({ ...newBase(), ...input })
    await refresh()
  }

  async function toggleTask(task: Task) {
    const completing = task.status === 'todo'
    await db.tasks.update(task.id, { status: completing ? 'done' : 'todo', completedAt: completing ? nowIso() : null, updatedAt: nowIso() })
    if (completing && task.recurrence !== 'none' && task.dueAt) {
      await db.tasks.add({ ...task, ...newBase(), dueAt: addRecurrence(task.dueAt, task.recurrence), status: 'todo', completedAt: null })
    }
    await refresh()
  }

  async function remove(table: 'mealEntries' | 'bodyMetrics' | 'tasks' | 'scheduleEvents' | 'timeEntries' | 'transactions', id: string) {
    await db[table].update(id, { deletedAt: nowIso(), updatedAt: nowIso() })
    await refresh()
  }

  async function startTimer(title: string, categoryId: string | null) {
    if (activeTimer.value) return
    await addTime({ title, startAt: nowIso(), endAt: null, durationMinutes: 0, categoryId, linkedTaskId: null, source: 'timer', note: '' })
  }
  async function stopTimer() {
    if (!activeTimer.value) return
    const endAt = nowIso()
    await db.timeEntries.update(activeTimer.value.id, { endAt, durationMinutes: elapsedMinutes(activeTimer.value.startAt, endAt), updatedAt: endAt })
    await refresh()
  }

  async function updateSettings(patch: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...patch }
    await db.settings.put(settings.value)
  }

  async function downloadBackup() {
    const backup = await exportBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `lifeflow-backup-${localDateKey(new Date())}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  async function restoreBackup(raw: unknown) { await importBackup(raw); await refresh() }
  async function reset(sample = false) { await seedStarter(sample); await refresh() }

  return {
    ready, settings, categories, foodPresets, mealEntries, bodyMetrics, tasks, scheduleEvents, timeEntries, accounts, transactions, budgets,
    composerKind, composerSeed, todayMeals, caloriesToday, latestBody, todayTasks, completedToday, todayEvents, todayTime, activeTimer,
    currentMonthTransactions, monthExpense, monthIncome, monthBudget,
    init, refresh, openComposer, closeComposer, addMeal, addFoodPreset, addBody, addTask, addEvent, addTime, addAccount, addTransaction, addBudget,
    toggleTask, remove, startTimer, stopTimer, updateSettings, downloadBackup, restoreBackup, reset
  }
})

function elapsedMinutes(startAt: string, endAt = nowIso()) {
  return Math.max(1, Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000))
}

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useLifeStore, import.meta.hot))
