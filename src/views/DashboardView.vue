<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { ArrowRight, CalendarClock, Check, CircleDollarSign, Flame, Play, Square, Timer, Weight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useLifeStore } from '@/stores/life'
import { bmi, formatDate, formatMinutes, formatMoney, percent } from '@/utils'

const TrendChart = defineAsyncComponent(() => import('@/components/TrendChart.vue'))

const store = useLifeStore()
const caloriePercent = computed(() => percent(store.caloriesToday, store.settings.calorieTarget))
const taskTotal = computed(() => store.todayTasks.length + store.completedToday)
const taskPercent = computed(() => percent(store.completedToday, taskTotal.value))
const budgetPercent = computed(() => percent(store.monthExpense, store.monthBudget))
const bodySeries = computed(() => [...store.bodyMetrics].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt)).slice(-7))
const greeting = computed(() => {
  const hour = new Date().getHours()
  return hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好'
})
const todayText = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())
</script>

<template>
  <div class="dashboard page-content">
    <section class="welcome-row">
      <div><span class="eyebrow">{{ todayText }}</span><h2>{{ greeting }}，把今天过得清楚一点。</h2></div>
      <div class="day-score"><strong>{{ taskPercent }}</strong><span>今日节奏</span></div>
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
