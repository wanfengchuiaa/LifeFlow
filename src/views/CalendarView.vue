<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { CalendarPlus, ChevronLeft, ChevronRight, Clock3, Play, Plus, Square, Timer, Trash2 } from 'lucide-vue-next'
import { useLifeStore } from '@/stores/life'
import { formatDate, formatMinutes, localDateKey, toLocalInput } from '@/utils'

const store = useLifeStore()
const cursor = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const selected = ref(localDateKey(new Date()))
const timerNow = ref(Date.now())
let tick = 0

const monthTitle = computed(() => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(cursor.value))
const days = computed(() => {
  const first = new Date(cursor.value.getFullYear(), cursor.value.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - offset)
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start); date.setDate(start.getDate() + index)
    const key = localDateKey(date)
    return { date, key, current: date.getMonth() === cursor.value.getMonth(), today: key === localDateKey(new Date()), hasEvent: store.scheduleEvents.some(x => localDateKey(x.startAt) === key) }
  })
})
const selectedEvents = computed(() => store.scheduleEvents.filter(x => localDateKey(x.startAt) === selected.value).sort((a, b) => a.startAt.localeCompare(b.startAt)))
const selectedTime = computed(() => store.timeEntries.filter(x => localDateKey(x.startAt) === selected.value).sort((a, b) => b.startAt.localeCompare(a.startAt)))
const timeTotal = computed(() => selectedTime.value.reduce((sum, x) => sum + (x.endAt ? x.durationMinutes : Math.max(1, Math.round((timerNow.value - new Date(x.startAt).getTime()) / 60000))), 0))
const selectedLabel = computed(() => new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date(`${selected.value}T12:00:00`)))

function moveMonth(delta: number) { cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + delta, 1) }
function newEvent() { store.openComposer('event', { startAt: `${selected.value}T09:00`, endAt: `${selected.value}T10:00` }) }
onMounted(() => tick = window.setInterval(() => timerNow.value = Date.now(), 30000))
onBeforeUnmount(() => window.clearInterval(tick))
</script>

<template>
  <div class="page-content">
    <section class="page-intro"><div><span class="eyebrow">CALENDAR & TIME</span><h2>计划时间，也记录真实投入</h2><p>今天已经记录 {{ formatMinutes(store.todayTime) }}。</p></div><div class="page-actions"><button class="button secondary" @click="store.openComposer('time')"><Clock3 :size="17" />补录</button><button class="button primary" @click="newEvent"><CalendarPlus :size="17" />新建日程</button></div></section>

    <section class="calendar-layout">
      <article class="panel calendar-panel">
        <header class="calendar-header"><button class="icon-button" @click="moveMonth(-1)" aria-label="上个月"><ChevronLeft :size="19" /></button><h3>{{ monthTitle }}</h3><button class="icon-button" @click="moveMonth(1)" aria-label="下个月"><ChevronRight :size="19" /></button></header>
        <div class="weekday-row"><span v-for="day in ['一','二','三','四','五','六','日']" :key="day">{{ day }}</span></div>
        <div class="month-grid"><button v-for="day in days" :key="day.key" :class="{ muted: !day.current, today: day.today, selected: day.key === selected }" @click="selected = day.key"><span>{{ day.date.getDate() }}</span><i v-if="day.hasEvent"></i></button></div>
      </article>

      <aside class="panel day-agenda">
        <header class="section-heading"><div><span class="eyebrow">SELECTED DAY</span><h3>{{ selectedLabel }}</h3></div><button class="icon-button" @click="newEvent" title="新增日程"><Plus :size="18" /></button></header>
        <div v-if="selectedEvents.length" class="agenda-list"><article v-for="event in selectedEvents" :key="event.id"><time>{{ new Date(event.startAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}) }}</time><span></span><div><strong>{{ event.title }}</strong><small>{{ new Date(event.endAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}) }} 结束</small></div><button class="row-action" @click="store.remove('scheduleEvents', event.id)" title="删除日程"><Trash2 :size="15" /></button></article></div>
        <button v-else class="empty-action small" @click="newEvent"><CalendarPlus :size="21" /><span>这一天还没有安排</span></button>
      </aside>
    </section>

    <section class="content-grid two-thirds time-section">
      <article class="panel">
        <header class="section-heading"><div><span class="eyebrow">TIME LOG</span><h3>时间账本</h3></div><span class="section-total">{{ formatMinutes(timeTotal) }}</span></header>
        <div v-if="selectedTime.length" class="record-list"><div v-for="item in selectedTime" :key="item.id" class="record-row"><span class="record-icon blue"><Timer :size="17" /></span><div class="record-main"><strong>{{ item.title }}</strong><small>{{ formatDate(item.startAt, true) }} · {{ item.source === 'timer' ? '计时器' : '手动补录' }}</small></div><b>{{ item.endAt ? formatMinutes(item.durationMinutes) : '进行中' }}</b><button class="row-action" @click="store.remove('timeEntries', item.id)" title="删除时间记录"><Trash2 :size="16" /></button></div></div>
        <div v-else class="empty-state compact-empty"><span class="empty-check blue"><Clock3 :size="22" /></span><h3>还没有时间记录</h3><p>开始计时或手动补录。</p></div>
      </article>
      <aside class="panel live-timer"><span class="eyebrow">LIVE TIMER</span><template v-if="store.activeTimer"><span class="timer-status"><i></i>正在专注</span><strong class="timer-title">{{ store.activeTimer.title }}</strong><div class="timer-display">{{ formatMinutes(Math.max(1, Math.round((timerNow - new Date(store.activeTimer.startAt).getTime()) / 60000))) }}</div><button class="button stop-button" @click="store.stopTimer()"><Square :size="17" fill="currentColor" />停止并保存</button></template><template v-else><span class="timer-art"><Timer :size="34" /></span><h3>开始专注计时</h3><p>刷新页面或设备休眠后仍可继续。</p><button class="button primary" @click="store.startTimer('专注时间', store.categories.find(x => x.domain === 'time' && x.name === '专注')?.id || null)"><Play :size="16" fill="currentColor" />开始计时</button></template></aside>
    </section>
  </div>
</template>
