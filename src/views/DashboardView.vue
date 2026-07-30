<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { ArrowRight, CalendarClock, Check, CircleDollarSign, Flame, Play, Quote, RefreshCw, Square, Timer, Weight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useLifeStore } from '@/stores/life'
import { ageAt, bmi, formatDate, formatMinutes, formatMoney, percent, progressBetween } from '@/utils'
import { fetchDailyQuote, type DailyQuote } from '@/services/quote'

const TrendChart = defineAsyncComponent(() => import('@/components/TrendChart.vue'))
console.log('111');

1
const store = useLifeStore()
const caloriePercent = computed(() => percent(store.caloriesToday, store.settings.calorieTarget))
const taskTotal = computed(() => store.todayTasks.length + store.completedToday)
const taskPercent = computed(() => percent(store.completedToday, taskTotal.value))
const budgetPercent = computed(() => percent(store.monthExpense, store.monthBudget))
const bodySeries = computed(() => [...store.bodyMetrics].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt)).slice(-7))
const quote = ref<DailyQuote>({ text: '生活明朗，万物可爱。', author: '海子', source: 'local' })
const quoteLoading = ref(false)
const todayText = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())
const progressNow = new Date()
const dayStart = new Date(progressNow.getFullYear(), progressNow.getMonth(), progressNow.getDate())
const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1)
const weekStart = new Date(dayStart); weekStart.setDate(dayStart.getDate() - ((dayStart.getDay() + 6) % 7))
const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7)
const monthStart = new Date(progressNow.getFullYear(), progressNow.getMonth(), 1)
const monthEnd = new Date(progressNow.getFullYear(), progressNow.getMonth() + 1, 1)
const yearStart = new Date(progressNow.getFullYear(), 0, 1)
const yearEnd = new Date(progressNow.getFullYear() + 1, 0, 1)
const birthAge = computed(() => ageAt(store.settings.birthDate || '', progressNow))
const lifePercent = computed(() => {
  const birth = store.settings.birthDate ? new Date(`${store.settings.birthDate}T12:00:00`) : null
  if (!birth || Number.isNaN(birth.getTime())) return 0
  const end = new Date(birth); end.setFullYear(end.getFullYear() + 80)
  return 100 - progressBetween(birth, end, progressNow)
})
const lifeProgress = computed(() => [
  { label: birthAge.value === null ? '人生进度（设置生日后计算）' : `你的人生还剩下约 ${Math.max(0, 80 - birthAge.value)} 年`, percent: lifePercent.value, color: 'blue' },
  { label: '今天还余下', percent: 100 - progressBetween(dayStart, dayEnd, progressNow), color: 'blue' },
  { label: '本周还余下', percent: 100 - progressBetween(weekStart, weekEnd, progressNow), color: 'blue' },
  { label: '这个月还余下', percent: 100 - progressBetween(monthStart, monthEnd, progressNow), color: 'coral' },
  { label: `${progressNow.getFullYear()} 年还余下`, percent: 100 - progressBetween(yearStart, yearEnd, progressNow), color: 'yellow' }
])

async function loadQuote() {
  quoteLoading.value = true
  quote.value = await fetchDailyQuote()
  quoteLoading.value = false
}

onMounted(loadQuote)
</script>

<template>
  <div class="dashboard page-content">
    <section class="quote-banner">
      <div class="quote-heading"><span class="quote-avatar">W.</span><span class="quote-name">LifeFlow</span><span class="quote-date">{{ todayText }}</span></div>
      <Quote :size="18" class="quote-mark" />
      <blockquote>{{ quote.text }}</blockquote>
      <p>{{ quote.author }}</p>
      <button class="quote-refresh" type="button" :disabled="quoteLoading" aria-label="换一句" title="换一句" @click="loadQuote"><RefreshCw :size="15" :class="{ spin: quoteLoading }" /></button>
    </section>

    <section class="life-progress panel">
      <header class="section-heading"><div><span class="eyebrow">LIFE PROGRESS</span><h3>人生进度条</h3></div><RouterLink to="/settings" class="text-link">设置生日 <ArrowRight :size="15" /></RouterLink></header>
      <div class="life-progress-list">
        <div v-for="item in lifeProgress" :key="item.label" class="life-progress-item">
          <div class="life-progress-label"><span>{{ item.label }}</span><strong>{{ item.percent }}%</strong></div>
          <div class="life-progress-track"><span :class="item.color" :style="{ width: `${item.percent}%` }"></span></div>
        </div>
      </div>
      <p class="life-progress-note">按 80 岁作为参考上限，进度只用于提醒你把时间用在重要的事情上。</p>
    </section>

    <section class="dashboard-grid metrics-grid">
      <article class="metric-card calorie-card">
        <div class="metric-heading"><span class="metric-icon coral"><Flame :size="19" /></span><div><small>今日摄入</small><strong>{{ store.caloriesToday.toLocaleString() }}<em> kcal</em></strong></div></div>
        <div class="calorie-ring" :style="{ '--progress': `${caloriePercent * 3.6}deg` }"><span>{{ caloriePercent }}%</span></div>
        <p>目标 {{ store.settings.calorieTarget }} kcal · 还可摄入 {{ Math.max(0, store.settings.calorieTarget - store.caloriesToday) }} kcal</p>
      </article>

      <article class="metric-card">
        <div class="metric-heading"><span class="metric-icon green"><Weight :size="19" /></span><div><small>最新体重</small><strong>{{ store.latestBody?.weightKg || '--' }}<em> kg</em></strong></div></div>
        <TrendChart compact :labels="bodySeries.map(x => `${new Date(x.measuredAt).getMonth()+1}/${new Date(x.measuredAt).getDate()}`)" :values="bodySeries.map(x => x.weightKg)" />
        <p v-if="store.latestBody">BMI {{ bmi(store.latestBody.weightKg, store.latestBody.heightCm) }} · 距目标 {{ Math.abs(store.latestBody.weightKg - store.settings.targetWeightKg).toFixed(1) }} kg</p>
        <p v-else>记录第一次体重，开始查看趋势</p>
      </article>

      <article class="metric-card task-progress-card">
        <div class="metric-heading"><span class="metric-icon blue"><Check :size="19" /></span><div><small>今日待办</small><strong>{{ store.completedToday }}<em> / {{ taskTotal }}</em></strong></div></div>
        <div class="progress-track"><span :style="{ width: `${taskPercent}%` }"></span></div>
        <p>{{ store.todayTasks.length ? `还有 ${store.todayTasks.length} 项需要完成` : '今日事项已经处理完毕' }}</p>
      </article>

      <article class="metric-card budget-card">
        <div class="metric-heading"><span class="metric-icon yellow"><CircleDollarSign :size="19" /></span><div><small>本月支出</small><strong>{{ formatMoney(store.monthExpense) }}</strong></div></div>
        <div class="progress-track yellow"><span :style="{ width: `${budgetPercent}%` }"></span></div>
        <p v-if="store.monthBudget">预算 {{ formatMoney(store.monthBudget) }} · 剩余 {{ formatMoney(Math.max(0, store.monthBudget - store.monthExpense)) }}</p>
        <p v-else>还没有设置本月预算</p>
      </article>
    </section>

    <section class="dashboard-grid lower-grid">
      <article class="panel agenda-panel">
        <header class="section-heading"><div><span class="eyebrow">TODAY</span><h3>接下来</h3></div><RouterLink to="/calendar" class="text-link">完整日程 <ArrowRight :size="15" /></RouterLink></header>
        <div v-if="store.todayEvents.length" class="timeline-list">
          <div v-for="event in store.todayEvents.slice(0, 4)" :key="event.id" class="timeline-item">
            <time>{{ new Date(event.startAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</time><span class="timeline-line"></span>
            <div><strong>{{ event.title }}</strong><small>{{ formatDate(event.endAt, true) }}</small></div>
          </div>
        </div>
        <button v-else class="empty-action" @click="store.openComposer('event')"><CalendarClock :size="22" /><span>今天还没有安排</span><small>添加一段属于自己的时间</small></button>
      </article>

      <article class="panel focus-panel">
        <header class="section-heading"><div><span class="eyebrow">FOCUS</span><h3>实际时间</h3></div><span class="focus-total">{{ formatMinutes(store.todayTime) }}</span></header>
        <div v-if="store.activeTimer" class="timer-running"><span class="pulse-dot"></span><div><strong>{{ store.activeTimer.title }}</strong><small>正在计时 · {{ formatDate(store.activeTimer.startAt, true) }}</small></div><button class="icon-button stop" @click="store.stopTimer()" title="停止计时"><Square :size="17" fill="currentColor" /></button></div>
        <div v-else class="start-focus"><span class="focus-illustration"><Timer :size="30" /></span><div><strong>开始一段专注</strong><small>计时会在刷新和休眠后继续</small></div><button class="button compact primary" @click="store.startTimer('专注时间', store.categories.find(x => x.domain === 'time' && x.name === '专注')?.id || null)"><Play :size="15" fill="currentColor" />开始</button></div>
        <div class="mini-stats"><span><small>已记录</small><strong>{{ store.timeEntries.filter(x => x.endAt && new Date(x.startAt).toDateString() === new Date().toDateString()).length }} 段</strong></span><span><small>计划日程</small><strong>{{ store.todayEvents.length }} 项</strong></span></div>
      </article>
    </section>
  </div>
</template>
