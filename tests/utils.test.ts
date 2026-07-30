import { describe, expect, it } from 'vitest'
import { addRecurrence, bmi, localDateKey, percent } from '@/utils'

describe('LifeFlow calculations', () => {
  it('calculates BMI with one decimal place', () => {
    expect(bmi(67.8, 172)).toBe(22.9)
    expect(bmi(67.8, 0)).toBe(0)
  })

  it('caps progress at 100 percent and handles empty totals', () => {
    expect(percent(800, 2000)).toBe(40)
    expect(percent(2100, 2000)).toBe(100)
    expect(percent(10, 0)).toBe(0)
  })

  it('advances repeated tasks without changing time of day', () => {
    const initial = '2026-07-30T10:30:00.000Z'
    expect(addRecurrence(initial, 'daily')).toBe('2026-07-31T10:30:00.000Z')
    expect(addRecurrence(initial, 'weekly')).toBe('2026-08-06T10:30:00.000Z')
  })

  it('creates stable local date keys', () => {
    expect(localDateKey(new Date(2026, 6, 30, 23, 59))).toBe('2026-07-30')
  })
})
