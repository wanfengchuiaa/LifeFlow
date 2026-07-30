<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { Flame, Plus, Scale, Trash2, Utensils, Weight } from 'lucide-vue-next'
import { useLifeStore } from '@/stores/life'
import { bmi, formatDate, percent } from '@/utils'

const TrendChart = defineAsyncComponent(() => import('@/components/TrendChart.vue'))

const store = useLifeStore()
const mealLabels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }
const calorieProgress = computed(() => percent(store.caloriesToday, store.settings.calorieTarget))
const bodySeries = computed(() => [...store.bodyMetrics].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt)).slice(-14))
const recentBodies = computed(() => [...store.bodyMetrics].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt)).slice(0, 8))
</script>

<template>
  <div class="page-content">
    <section class="page-intro"><div><span class="eyebrow">HEALTH</span><h2>照顾身体，也看见变化</h2><p>记录比完美更重要，保持自己的节奏。</p></div><div class="page-actions"><button class="button secondary" @click="store.openComposer('body')"><Weight :size="17" />记体重</button><button class="button primary" @click="store.openComposer('meal')"><Plus :size="17" />记饮食</button></div></section>

    <section class="health-overview">
      <article class="calorie-hero">
        <div class="large-ring" :style="{ '--progress': `${calorieProgress * 3.6}deg` }"><div><strong>{{ store.caloriesToday }}</strong><span>/ {{ store.settings.calorieTarget }} kcal</span></div></div>
        <div><span class="eyebrow">今日热量</span><h3>{{ Math.max(0, store.settings.calorieTarget - store.caloriesToday) }} kcal 可用</h3><p>已完成每日目标的 {{ calorieProgress }}%</p></div>
      </article>
      <article class="body-summary">
        <span class="metric-icon green"><Scale :size="20" /></span><div><small>当前体重</small><strong>{{ store.latestBody?.weightKg || '--' }} kg</strong></div>
        <div><small>身体质量指数</small><strong>{{ store.latestBody ? bmi(store.latestBody.weightKg, store.latestBody.heightCm) : '--' }}</strong></div>
        <div><small>目标体重</small><strong>{{ store.settings.targetWeightKg }} kg</strong></div>
      </article>
    </section>

    <section class="content-grid two-thirds">
      <article class="panel">
        <header class="section-heading"><div><span class="eyebrow">MEALS</span><h3>今日饮食</h3></div><span class="section-total"><Flame :size="15" /> {{ store.caloriesToday }} kcal</span></header>
        <div v-if="store.todayMeals.length" class="record-list">
          <div v-for="meal in store.todayMeals" :key="meal.id" class="record-row">
            <span class="record-icon coral"><Utensils :size="17" /></span><div class="record-main"><strong>{{ meal.name }}</strong><small>{{ mealLabels[meal.mealType] }} · {{ meal.portion }}{{ meal.unit }} · {{ formatDate(meal.occurredAt, true) }}</small></div><b>{{ meal.calories }} kcal</b><button class="row-action" @click="store.remove('mealEntries', meal.id)" title="删除饮食记录"><Trash2 :size="16" /></button>
          </div>
        </div>
        <button v-else class="empty-action" @click="store.openComposer('meal')"><Utensils :size="22" /><span>还没有饮食记录</span><small>从今天的第一餐开始</small></button>
      </article>

      <aside class="panel favorites-panel">
        <header class="section-heading"><div><span class="eyebrow">QUICK ADD</span><h3>常用食物</h3></div></header>
        <button v-for="food in store.foodPresets" :key="food.id" class="favorite-food" @click="store.openComposer('meal', food)"><span>{{ food.name }}</span><small>{{ food.portion }}{{ food.unit }} · {{ food.calories }} kcal</small><Plus :size="16" /></button>
      </aside>
    </section>

    <section class="content-grid equal-grid">
      <article class="panel chart-panel"><header class="section-heading"><div><span class="eyebrow">TREND</span><h3>体重趋势</h3></div><small>最近 14 次</small></header><TrendChart :labels="bodySeries.map(x => `${new Date(x.measuredAt).getMonth()+1}/${new Date(x.measuredAt).getDate()}`)" :values="bodySeries.map(x => x.weightKg)" suffix=" kg" /></article>
      <article class="panel"><header class="section-heading"><div><span class="eyebrow">HISTORY</span><h3>身体记录</h3></div></header><div class="record-list compact-list"><div v-for="item in recentBodies" :key="item.id" class="record-row"><span class="record-icon green"><Weight :size="17" /></span><div class="record-main"><strong>{{ item.weightKg }} kg</strong><small>{{ formatDate(item.measuredAt, true) }} · {{ item.heightCm }} cm</small></div><b>BMI {{ bmi(item.weightKg, item.heightCm) }}</b><button class="row-action" @click="store.remove('bodyMetrics', item.id)" title="删除身体记录"><Trash2 :size="16" /></button></div></div></article>
    </section>
  </div>
</template>
