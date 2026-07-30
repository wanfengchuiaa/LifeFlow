import type { AppSettings } from '@/types'

export type ZodiacSign = '白羊座' | '金牛座' | '双子座' | '巨蟹座' | '狮子座' | '处女座' | '天秤座' | '天蝎座' | '射手座' | '摩羯座' | '水瓶座' | '双鱼座'
export type FiveElement = '木' | '火' | '土' | '金' | '水'
export type FortuneSource = 'local' | 'online'

export interface FortuneProfile {
  birthDate: string
  birthTime: string
  gender: AppSettings['gender']
}

export interface FortuneAnalysis {
  sign: ZodiacSign | '待设置'
  chineseZodiac: string
  element: FiveElement
  polarity: '阳' | '阴'
  summary: string
  love: string
  career: string
  wealth: string
  health: string
  luckyColor: string
  luckyNumber: number
  direction: string
  source: FortuneSource
  sourceLabel: string
  generatedAt: string
}

const signs: Array<{ name: ZodiacSign; month: number; day: number }> = [
  { name: '摩羯座', month: 1, day: 1 }, { name: '水瓶座', month: 1, day: 20 }, { name: '双鱼座', month: 2, day: 19 },
  { name: '白羊座', month: 3, day: 21 }, { name: '金牛座', month: 4, day: 20 }, { name: '双子座', month: 5, day: 21 },
  { name: '巨蟹座', month: 6, day: 22 }, { name: '狮子座', month: 7, day: 23 }, { name: '处女座', month: 8, day: 23 },
  { name: '天秤座', month: 9, day: 23 }, { name: '天蝎座', month: 10, day: 24 }, { name: '射手座', month: 11, day: 22 }
]

const animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const stems: Array<{ element: FiveElement; polarity: '阳' | '阴' }> = [
  { element: '木', polarity: '阳' }, { element: '木', polarity: '阴' }, { element: '火', polarity: '阳' }, { element: '火', polarity: '阴' },
  { element: '土', polarity: '阳' }, { element: '土', polarity: '阴' }, { element: '金', polarity: '阳' }, { element: '金', polarity: '阴' },
  { element: '水', polarity: '阳' }, { element: '水', polarity: '阴' }
]
const themes = {
  summary: ['今天适合把注意力收回自己，先完成一件最重要的事。', '你正在进入一个适合整理和重新出发的阶段。', '清晰的边界会带来更好的运气，别把所有事情都揽在身上。', '今天的灵感来自行动，先迈出小小的一步。'],
  love: ['坦诚表达比猜测更有力量，给彼此一个轻松的回应。', '适合约一次不赶时间的见面，关系会在细节里升温。', '先照顾好自己的感受，稳定的吸引力来自松弛感。', '有人正在留意你的认真，慢一点也没有关系。'],
  career: ['适合做减法，把复杂任务拆成清晰的三个动作。', '沟通会带来新的机会，主动说出你的判断。', '今天适合深度工作，减少无意义的切换。', '把阶段成果写下来，你会看见自己的进步。'],
  wealth: ['适合做一笔小复盘，延迟非必要消费。', '稳定现金流比短期刺激更重要，按计划行动。', '今天适合整理订阅、账单和下月预算。', '理性消费会让你更有安全感，先问自己是否真的需要。'],
  health: ['给眼睛和肩颈留出休息时间，规律喝水。', '适合轻运动和早点结束屏幕时间。', '身体正在提醒你放慢一点，保证一段完整睡眠。', '把一餐吃完整，规律比极端更有效。']
}
const colors = ['苔藓绿', '珊瑚橙', '雾霾蓝', '暖杏色', '深海青', '月光白']
const directions = ['东南', '正南', '西南', '正东', '正西', '东北']

export function getZodiacSign(dateString: string): ZodiacSign | '待设置' {
  if (!dateString) return '待设置'
  const date = new Date(`${dateString}T12:00:00`)
  if (Number.isNaN(date.getTime())) return '待设置'
  const month = date.getMonth() + 1
  const day = date.getDate()
  let current = signs[0].name
  for (const sign of signs) {
    if (month > sign.month || (month === sign.month && day >= sign.day)) current = sign.name
  }
  return current
}

export function getChineseZodiac(dateString: string) {
  if (!dateString) return '待设置'
  const year = new Date(`${dateString}T12:00:00`).getFullYear()
  return Number.isNaN(year) ? '待设置' : animals[(year - 4 + 120) % 12]
}

export function getYearElement(dateString: string): { element: FiveElement; polarity: '阳' | '阴' } {
  const year = dateString ? new Date(`${dateString}T12:00:00`).getFullYear() : new Date().getFullYear()
  return stems[((year - 4) % 10 + 10) % 10]
}

function pick<T>(items: T[], seed: number) { return items[Math.abs(seed) % items.length] }
function profileSeed(profile: FortuneProfile) {
  const digits = `${profile.birthDate}${profile.birthTime}${new Date().toISOString().slice(0, 10)}`.replace(/\D/g, '')
  return Number(digits.slice(-8) || 1)
}

export function buildLocalFortune(profile: FortuneProfile): FortuneAnalysis {
  const seed = profileSeed(profile)
  const yearElement = getYearElement(profile.birthDate)
  const sign = getZodiacSign(profile.birthDate)
  const date = profile.birthDate ? new Date(`${profile.birthDate}T12:00:00`) : null
  const signIndex = sign === '待设置' ? 0 : signs.findIndex(item => item.name === sign)
  return {
    sign,
    chineseZodiac: getChineseZodiac(profile.birthDate),
    element: yearElement.element,
    polarity: yearElement.polarity,
    summary: pick(themes.summary, seed + signIndex),
    love: pick(themes.love, seed + signIndex * 2),
    career: pick(themes.career, seed + signIndex * 3),
    wealth: pick(themes.wealth, seed + signIndex * 5),
    health: pick(themes.health, seed + signIndex * 7),
    luckyColor: pick(colors, seed + (date?.getMonth() || 0)),
    luckyNumber: (seed % 9) + 1,
    direction: pick(directions, seed + signIndex),
    source: 'local',
    sourceLabel: '本地简化分析',
    generatedAt: new Date().toISOString()
  }
}

export async function fetchFortune(profile: FortuneProfile): Promise<{ analysis: FortuneAnalysis; message?: string }> {
  const local = buildLocalFortune(profile)
  const endpoint = String(import.meta.env.VITE_FORTUNE_API_URL || '').trim()
  if (!endpoint) return { analysis: local, message: '未配置在线接口，当前使用本地分析。' }
  try {
    const url = new URL(endpoint, window.location.origin)
    url.searchParams.set('sign', local.sign)
    url.searchParams.set('birthDate', profile.birthDate)
    url.searchParams.set('birthTime', profile.birthTime)
    const response = await fetch(url)
    if (!response.ok) throw new Error(`fortune endpoint returned ${response.status}`)
    const raw = await response.json() as Record<string, unknown>
    const payload = (raw.data || raw.result || raw) as Record<string, unknown>
    const read = (key: string, fallback: string) => typeof payload[key] === 'string' && payload[key] ? String(payload[key]) : fallback
    return {
      analysis: {
        ...local,
        summary: read('summary', read('description', local.summary)),
        love: read('love', read('love_fortune', local.love)),
        career: read('career', read('career_fortune', local.career)),
        wealth: read('wealth', read('money', local.wealth)),
        health: read('health', local.health),
        source: 'online',
        sourceLabel: '在线接口',
        generatedAt: new Date().toISOString()
      }
    }
  } catch {
    return { analysis: local, message: '在线接口暂时不可用，已回退到本地分析。' }
  }
}

export const zodiacSigns = signs.map(item => item.name)
