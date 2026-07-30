<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { Activity, CalendarDays, CheckSquare2, CircleDollarSign, CloudOff, HeartPulse, Home, Plus, Settings, Utensils, Weight, X, ReceiptText, Timer, CalendarPlus, Sparkles } from 'lucide-vue-next'
import { useLifeStore } from '@/stores/life'
import QuickAddModal from '@/components/QuickAddModal.vue'

const store = useLifeStore()
const route = useRoute()
const quickOpen = ref(false)
const online = ref(navigator.onLine)
const toast = ref('')
let toastTimer = 0

const nav = [
  { to: '/', label: '首页', icon: Home },
  { to: '/health', label: '健康', icon: HeartPulse },
  { to: '/tasks', label: '待办', icon: CheckSquare2 },
  { to: '/finance', label: '财务', icon: CircleDollarSign },
  { to: '/calendar', label: '日程', icon: CalendarDays },
  { to: '/fortune', label: '运势', icon: Sparkles }
]
const quickItems = [
  { kind: 'meal' as const, label: '饮食', icon: Utensils, color: 'coral' },
  { kind: 'body' as const, label: '体重', icon: Weight, color: 'green' },
  { kind: 'task' as const, label: '待办', icon: CheckSquare2, color: 'blue' },
  { kind: 'transaction' as const, label: '账单', icon: ReceiptText, color: 'yellow' },
  { kind: 'event' as const, label: '日程', icon: CalendarPlus, color: 'purple' },
  { kind: 'time' as const, label: '时间', icon: Timer, color: 'navy' }
]
const title = computed(() => route.meta.title as string || 'LifeFlow')

function showToast(event: Event) {
  toast.value = (event as CustomEvent<string>).detail
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => toast.value = '', 2600)
}
function updateOnline() { online.value = navigator.onLine }
function openQuick(kind: typeof quickItems[number]['kind']) {
  quickOpen.value = false
  store.openComposer(kind)
}

onMounted(() => {
  store.init()
  window.addEventListener('online', updateOnline)
  window.addEventListener('offline', updateOnline)
  window.addEventListener('lifeflow:toast', showToast)
})
onBeforeUnmount(() => {
  window.removeEventListener('online', updateOnline)
  window.removeEventListener('offline', updateOnline)
  window.removeEventListener('lifeflow:toast', showToast)
})
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <RouterLink class="brand" to="/" aria-label="LifeFlow 首页">
        <span class="brand-mark"><Activity :size="22" /></span>
        <span><strong>LifeFlow</strong><small>生活，自有节奏</small></span>
      </RouterLink>
      <nav class="side-nav" aria-label="主导航">
        <span class="nav-section-label">PERSONAL SPACE</span>
        <RouterLink v-for="item in nav" :key="item.to" :to="item.to">
          <component :is="item.icon" :size="20" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
      <div class="side-bottom">
        <RouterLink to="/settings"><Settings :size="20" /><span>设置与数据</span></RouterLink>
        <div class="local-badge"><span class="status-dot"></span>数据仅保存在此设备</div>
      </div>
    </aside>

    <div class="main-column">
      <header class="topbar">
        <div>
          <span class="topbar-kicker">PERSONAL SPACE</span>
          <span class="mobile-brand">LifeFlow</span>
          <h1>{{ title }}</h1>
        </div>
        <RouterLink to="/settings" class="icon-button settings-button" title="设置" aria-label="打开设置"><Settings :size="20" /></RouterLink>
      </header>
      <div v-if="!online" class="offline-banner"><CloudOff :size="16" /> 当前离线，所有记录仍会保存在此设备</div>

      <main class="page-wrap">
        <div v-if="!store.ready" class="loading-state"><span class="spinner"></span><p>正在准备你的生活面板…</p></div>
        <RouterView v-else />
      </main>
    </div>

    <Transition name="fade">
      <div v-if="quickOpen" class="quick-menu" aria-label="快速新增菜单">
        <button v-for="item in quickItems" :key="item.kind" @click="openQuick(item.kind)">
          <span class="quick-icon" :class="item.color"><component :is="item.icon" :size="19" /></span>
          {{ item.label }}
        </button>
      </div>
    </Transition>
    <button class="fab" :class="{ open: quickOpen }" @click="quickOpen = !quickOpen" :aria-label="quickOpen ? '关闭快速新增' : '快速新增'" :title="quickOpen ? '关闭' : '快速新增'">
      <X v-if="quickOpen" :size="24" />
      <Plus v-else :size="25" />
    </button>

    <nav class="bottom-nav" aria-label="主导航">
      <RouterLink v-for="item in nav" :key="item.to" :to="item.to">
        <component :is="item.icon" :size="21" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <QuickAddModal v-if="store.composerKind" />
    <Transition name="toast"><div v-if="toast" class="toast" role="status">{{ toast }}</div></Transition>
  </div>
</template>
