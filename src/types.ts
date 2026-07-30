export type ID = string
export type ComposerKind = 'meal' | 'body' | 'task' | 'transaction' | 'event' | 'time' | 'account' | 'budget'
export type CategoryDomain = 'task' | 'finance' | 'time'

export interface BaseRecord {
  id: ID
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface AppSettings {
  key: 'profile'
  calorieTarget: number
  targetWeightKg: number
  currency: 'CNY'
  weekStartsOn: 1
  timezone: 'Asia/Shanghai'
  seeded: boolean
  birthDate?: string
  birthTime?: string
  gender?: 'female' | 'male' | 'unknown'
}

export interface Category extends BaseRecord {
  domain: CategoryDomain
  name: string
  color: string
}

export interface FoodPreset extends BaseRecord {
  name: string
  portion: number
  unit: string
  calories: number
}

export interface MealEntry extends BaseRecord {
  name: string
  portion: number
  unit: string
  calories: number
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  occurredAt: string
  note: string
}

export interface BodyMetric extends BaseRecord {
  measuredAt: string
  heightCm: number
  weightKg: number
  note: string
}

export interface Task extends BaseRecord {
  title: string
  categoryId: ID | null
  priority: 'low' | 'medium' | 'high'
  dueAt: string | null
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly'
  status: 'todo' | 'done'
  completedAt: string | null
  note: string
}

export interface ScheduleEvent extends BaseRecord {
  title: string
  startAt: string
  endAt: string
  categoryId: ID | null
  linkedTaskId: ID | null
  note: string
}

export interface TimeEntry extends BaseRecord {
  title: string
  startAt: string
  endAt: string | null
  durationMinutes: number
  categoryId: ID | null
  linkedTaskId: ID | null
  source: 'timer' | 'manual'
  note: string
}

export interface Account extends BaseRecord {
  name: string
  type: 'cash' | 'bank' | 'digital'
  openingBalance: number
}

export interface Transaction extends BaseRecord {
  type: 'expense' | 'income'
  amount: number
  accountId: ID
  categoryId: ID | null
  occurredAt: string
  note: string
}

export interface Budget extends BaseRecord {
  month: string
  categoryId: ID | null
  amount: number
}

export interface BackupFile {
  formatVersion: 1
  exportedAt: string
  appVersion: string
  data: {
    settings: AppSettings[]
    categories: Category[]
    foodPresets: FoodPreset[]
    mealEntries: MealEntry[]
    bodyMetrics: BodyMetric[]
    tasks: Task[]
    scheduleEvents: ScheduleEvent[]
    timeEntries: TimeEntry[]
    accounts: Account[]
    transactions: Transaction[]
    budgets: Budget[]
  }
}
