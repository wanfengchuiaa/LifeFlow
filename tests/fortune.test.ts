import { describe, expect, it } from 'vitest'
import { buildLocalFortune, getChineseZodiac, getZodiacSign, getYearElement } from '@/services/fortune'

describe('fortune profile analysis', () => {
  it('maps birthdays to western and chinese zodiac labels', () => {
    expect(getZodiacSign('1995-08-25')).toBe('处女座')
    expect(getChineseZodiac('1995-08-25')).toBe('猪')
  })

  it('derives a year element without pretending to be a full bazi chart', () => {
    expect(getYearElement('1995-08-25')).toEqual({ element: '木', polarity: '阴' })
  })

  it('returns a complete local fallback analysis', () => {
    const result = buildLocalFortune({ birthDate: '1995-08-25', birthTime: '08:30', gender: 'unknown' })
    expect(result.source).toBe('local')
    expect(result.love.length).toBeGreaterThan(0)
    expect(result.luckyNumber).toBeGreaterThanOrEqual(1)
  })
})
