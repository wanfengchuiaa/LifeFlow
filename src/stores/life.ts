import { computed, ref } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { api, ApiError } from '@/services/api'
import type { Account, AppSettings, BodyMetric, Budget, Category, ComposerKind, FoodPreset, MealEntry, ScheduleEvent, Task, TimeEntry, Transaction } from '@/types'
import { addRecurrence, localDateKey, monthKey, newBase, nowIso } from '@/utils'

type ComposerSeed = Record<string, string | number | null>

export const useLifeStore = defineStore('life', () => {
  const ready = ref(false)
  const authenticated = ref(false)
  const user = ref<{ id: string; username: string; role: string } | null>(null)
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
    try { user.value = await api.me(); authenticated.value = true; await refresh(); ready.value = true }
    catch (error) { if (!(error instanceof ApiError && error.status === 401)) console.error(error); ready.value = true }
  }

  async function refresh() {
    const data = await api.data() as Record<string, any[]>
    settings.value = data.settings?.[0] ? { ...settings.value, ...data.settings[0] } : settings.value
    categories.value = (data.categories || []) as Category[]
    foodPresets.value = (data.foodPresets || []) as FoodPreset[]
    mealEntries.value = (data.mealEntries || []) as MealEntry[]
    bodyMetrics.value = (data.bodyMetrics || []) as BodyMetric[]
    tasks.value = (data.tasks || []) as Task[]
    scheduleEvents.value = (data.scheduleEvents || []) as ScheduleEvent[]
    timeEntries.value = (data.timeEntries || []) as TimeEntry[]
    accounts.value = (data.accounts || []) as Account[]
    transactions.value = (data.transactions || []) as Transaction[]
    budgets.value = (data.budgets || []) as Budget[]
  }

  function openComposer(kind: ComposerKind, seed: ComposerSeed = {}) {
    composerKind.value = kind
    composerSeed.value = seed
  }
  function closeComposer() { composerKind.value = null; composerSeed.value = {} }

  async function addMeal(input: Omit<MealEntry, keyof ReturnType<typeof newBase>>) {
    await api.create('mealEntries', input)
    await refresh()
  }
  async function addFoodPreset(input: Pick<FoodPreset, 'name' | 'portion' | 'unit' | 'calories'>) {
    await api.create('foodPresets', input)
    await refresh()
  }
  async function addBody(input: Omit<BodyMetric, keyof ReturnType<typeof newBase>>) { await api.create('bodyMetrics', input); await refresh() }
  async function addTask(input: Omit<Task, keyof ReturnType<typeof newBase>>) { await api.create('tasks', input); await refresh() }
  async function addEvent(input: Omit<ScheduleEvent, keyof ReturnType<typeof newBase>>) { await api.create('scheduleEvents', input); await refresh() }
  async function addTime(input: Omit<TimeEntry, keyof ReturnType<typeof newBase>>) { await api.create('timeEntries', input); await refresh() }
  async function addAccount(input: Omit<Account, keyof ReturnType<typeof newBase>>) { await api.create('accounts', input); await refresh() }
  async function addTransaction(input: Omit<Transaction, keyof ReturnType<typeof newBase>>) { await api.create('transactions', input); await refresh() }
  async function addBudget(input: Omit<Budget, keyof ReturnType<typeof newBase>>) {
    const current = budgets.value.find(x => x.month === input.month && x.categoryId === input.categoryId)
    if (current) await api.update('budgets', current.id, { ...current, amount: input.amount })
    else await api.create('budgets', input)
    await refresh()
  }

  async function toggleTask(task: Task) {
    const completing = task.status === 'todo'
    await api.update('tasks', task.id, { ...task, status: completing ? 'done' : 'todo', completedAt: completing ? nowIso() : null })
    if (completing && task.recurrence !== 'none' && task.dueAt) {
      await api.create('tasks', { ...task, dueAt: addRecurrence(task.dueAt, task.recurrence), status: 'todo', completedAt: null })
    }
    await refresh()
  }

  async function remove(table: 'mealEntries' | 'bodyMetrics' | 'tasks' | 'scheduleEvents' | 'timeEntries' | 'transactions', id: string) {
    await api.remove(table, id)
    await refresh()
  }

  async function startTimer(title: string, categoryId: string | null) {
    if (activeTimer.value) return
    await addTime({ title, startAt: nowIso(), endAt: null, durationMinutes: 0, categoryId, linkedTaskId: null, source: 'timer', note: '' })
  }
  async function stopTimer() {
    if (!activeTimer.value) return
    const endAt = nowIso()
    await api.update('timeEntries', activeTimer.value.id, { ...activeTimer.value, endAt, durationMinutes: elapsedMinutes(activeTimer.value.startAt, endAt) })
    await refresh()
  }

  async function updateSettings(patch: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...patch }
    await api.updateSettings({ ...settings.value, ...patch })
  }

  async function downloadBackup() {
    const backup = { formatVersion: 1, exportedAt: nowIso(), appVersion: '1.0.0', data: { settings: [settings.value], categories: categories.value, foodPresets: foodPresets.value, mealEntries: mealEntries.value, bodyMetrics: bodyMetrics.value, tasks: tasks.value, scheduleEvents: scheduleEvents.value, timeEntries: timeEntries.value, accounts: accounts.value, transactions: transactions.value, budgets: budgets.value } }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `lifeflow-backup-${localDateKey(new Date())}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  async function restoreBackup(raw: unknown) { await api.restore(raw); await refresh() }
  async function reset(sample = false) { await api.reset(sample); await refresh() }
  async function login(username: string, password: string) { user.value = await api.login(username, password); authenticated.value = true; await refresh() }
  async function logout() { await api.logout(); user.value = null; authenticated.value = false; ready.value = true }

  return {
    ready, authenticated, user, settings, categories, foodPresets, mealEntries, bodyMetrics, tasks, scheduleEvents, timeEntries, accounts, transactions, budgets,
    composerKind, composerSeed, todayMeals, caloriesToday, latestBody, todayTasks, completedToday, todayEvents, todayTime, activeTimer,
    currentMonthTransactions, monthExpense, monthIncome, monthBudget,
    init, login, logout, refresh, openComposer, closeComposer, addMeal, addFoodPreset, addBody, addTask, addEvent, addTime, addAccount, addTransaction, addBudget,
    toggleTask, remove, startTimer, stopTimer, updateSettings, downloadBackup, restoreBackup, reset
  }
})

function elapsedMinutes(startAt: string, endAt = nowIso()) {
  return Math.max(1, Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000))
}

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useLifeStore, import.meta.hot))
