export interface DailyQuote {
  text: string
  author: string
  source: 'online' | 'local'
}

const fallbackQuotes: Array<Omit<DailyQuote, 'source'>> = [
  { text: '黑发不知勤学早，白首方悔读书迟。', author: '颜真卿 · 劝学诗' },
  { text: '待何年归去，谈笑各争雄。', author: '顾太清 · 高山流水' },
  { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原 · 离骚' },
  { text: '生活明朗，万物可爱。', author: '海子' },
  { text: '不乱于心，不困于情，不畏将来，不念过往。', author: '丰子恺' }
]

function localQuote(): DailyQuote {
  const day = Math.floor(Date.now() / 86_400_000)
  return { ...fallbackQuotes[Math.abs(day) % fallbackQuotes.length], source: 'local' }
}

export async function fetchDailyQuote(): Promise<DailyQuote> {
  const endpoint = String(import.meta.env.VITE_QUOTE_API_URL || 'https://v1.hitokoto.cn/?c=i&encode=json').trim()
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), 3500)
  try {
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' }, signal: controller.signal })
    if (!response.ok) throw new Error(`quote endpoint returned ${response.status}`)
    const raw = await response.json() as { hitokoto?: unknown; from?: unknown; from_who?: unknown }
    if (typeof raw.hitokoto !== 'string' || !raw.hitokoto.trim()) throw new Error('quote payload is empty')
    const sourceName = [raw.from_who, raw.from].filter(value => typeof value === 'string' && value.trim()).join(' · ')
    return { text: raw.hitokoto.trim(), author: sourceName || '一言', source: 'online' }
  } catch {
    return localQuote()
  } finally {
    globalThis.clearTimeout(timeout)
  }
}
