import type { BaseRecord } from './types'

export const nowIso = () => new Date().toISOString()
export const todayKey = () => localDateKey(new Date())
export const monthKey = (date = new Date()) => localDateKey(date).slice(0, 7)
export const localDateKey = (date: Date | string) => {
  const value = typeof date === 'string' ? new Date(date) : date
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
export const toLocalInput = (date: Date | string) => {
  const value = typeof date === 'string' ? new Date(date) : date
  const offset = value.getTimezoneOffset() * 60_000
  return new Date(value.getTime() - offset).toISOString().slice(0, 16)
}
export const fromLocalInput = (value: string) => new Date(value).toISOString()
export const formatMoney = (value: number) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(value)
export const formatDate = (value: string | null, withTime = false) => value ? new Intl.DateTimeFormat('zh-CN', withTime ? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } : { month: 'short', day: 'numeric' }).format(new Date(value)) : '未设置'
export const formatMinutes = (minutes: number) => minutes >= 60 ? `${Math.floor(minutes / 60)}小时${minutes % 60 ? `${minutes % 60}分` : ''}` : `${minutes}分钟`
export const percent = (value: number, total: number) => total > 0 ? Math.min(100, Math.round(value / total * 100)) : 0
export const progressBetween = (start: Date, end: Date, now = new Date()) => {
  const total = end.getTime() - start.getTime()
  if (total <= 0) return 100
  return Math.max(0, Math.min(100, Math.round((now.getTime() - start.getTime()) / total * 100)))
}
export const ageAt = (birthDate: string, now = new Date()) => {
  const birth = new Date(`${birthDate}T12:00:00`)
  if (!birthDate || Number.isNaN(birth.getTime())) return null
  let age = now.getFullYear() - birth.getFullYear()
  const birthdayPassed = now.getMonth() > birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate())
  if (!birthdayPassed) age -= 1
  return Math.max(0, age)
}
export const bmi = (weightKg: number, heightCm: number) => heightCm > 0 ? Number((weightKg / ((heightCm / 100) ** 2)).toFixed(1)) : 0
function newId() {
  const cryptoApi = globalThis.crypto
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') return cryptoApi.randomUUID()
  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    cryptoApi.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
}

export const newBase = (): BaseRecord => ({ id: newId(), createdAt: nowIso(), updatedAt: nowIso(), deletedAt: null })
export const addRecurrence = (iso: string, recurrence: 'daily' | 'weekly' | 'monthly') => {
  const date = new Date(iso)
  if (recurrence === 'daily') date.setDate(date.getDate() + 1)
  if (recurrence === 'weekly') date.setDate(date.getDate() + 7)
  if (recurrence === 'monthly') date.setMonth(date.getMonth() + 1)
  return date.toISOString()
}
