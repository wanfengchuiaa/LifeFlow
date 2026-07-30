import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: DashboardView, meta: { title: '今日' } },
    { path: '/health', name: 'health', component: () => import('@/views/HealthView.vue'), meta: { title: '健康' } },
    { path: '/tasks', name: 'tasks', component: () => import('@/views/TasksView.vue'), meta: { title: '待办' } },
    { path: '/finance', name: 'finance', component: () => import('@/views/FinanceView.vue'), meta: { title: '财务' } },
    { path: '/calendar', name: 'calendar', component: () => import('@/views/CalendarView.vue'), meta: { title: '日程' } },
    { path: '/fortune', name: 'fortune', component: () => import('@/views/FortuneView.vue'), meta: { title: '运势' } },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue'), meta: { title: '设置' } }
  ],
  scrollBehavior: () => ({ top: 0 })
})
