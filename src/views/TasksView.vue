<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarPlus, Check, Circle, Filter, Plus, Repeat2, Trash2 } from 'lucide-vue-next'
import { useLifeStore } from '@/stores/life'
import { formatDate, localDateKey } from '@/utils'

const store = useLifeStore()
const filter = ref<'todo' | 'today' | 'done'>('todo')
const filtered = computed(() => store.tasks.filter(task => {
  if (filter.value === 'done') return task.status === 'done'
  if (filter.value === 'today') return task.status === 'todo' && !!task.dueAt && localDateKey(task.dueAt) <= localDateKey(new Date())
  return task.status === 'todo'
}).sort((a, b) => (a.dueAt || '9999').localeCompare(b.dueAt || '9999')))
const counts = computed(() => ({ todo: store.tasks.filter(x => x.status === 'todo').length, today: store.todayTasks.length, done: store.tasks.filter(x => x.status === 'done').length }))
const category = (id: string | null) => store.categories.find(x => x.id === id)
const recurrenceLabel = { none: '', daily: '每天', weekly: '每周', monthly: '每月' }
</script>

<template>
  <div class="page-content">
    <section class="page-intro"><div><span class="eyebrow">TASKS</span><h2>事情有序，脑袋才有空</h2><p>{{ counts.todo }} 项待完成，{{ counts.today }} 项需要今天关注。</p></div><button class="button primary" @click="store.openComposer('task')"><Plus :size="17" />新建待办</button></section>
    <div class="filter-bar"><div class="segmented compact"><button :class="{ active: filter === 'todo' }" @click="filter='todo'">待完成 <span>{{ counts.todo }}</span></button><button :class="{ active: filter === 'today' }" @click="filter='today'">今天 <span>{{ counts.today }}</span></button><button :class="{ active: filter === 'done' }" @click="filter='done'">已完成 <span>{{ counts.done }}</span></button></div><span class="filter-label"><Filter :size="15" />按截止时间排序</span></div>
    <section class="panel task-panel">
      <div v-if="filtered.length" class="task-list">
        <article v-for="task in filtered" :key="task.id" class="task-row" :class="{ completed: task.status === 'done', overdue: task.dueAt && new Date(task.dueAt) < new Date() && task.status === 'todo' }">
          <button class="task-check" @click="store.toggleTask(task)" :aria-label="task.status === 'done' ? '恢复待办' : '完成待办'"><Check v-if="task.status === 'done'" :size="16" /><Circle v-else :size="20" /></button>
          <span v-if="category(task.categoryId)" class="category-stripe" :style="{ background: category(task.categoryId)?.color }"></span>
          <div class="task-main"><div><strong>{{ task.title }}</strong><span class="priority" :class="task.priority">{{ task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低' }}</span></div><small><span v-if="category(task.categoryId)">{{ category(task.categoryId)?.name }} · </span>{{ task.dueAt ? formatDate(task.dueAt, true) : '无截止时间' }}<span v-if="task.recurrence !== 'none'"> · <Repeat2 :size="12" /> {{ recurrenceLabel[task.recurrence] }}</span></small></div>
          <div class="task-actions"><button v-if="task.status === 'todo'" class="row-action" @click="store.openComposer('event', { title: task.title, linkedTaskId: task.id })" title="排入日程"><CalendarPlus :size="17" /></button><button class="row-action danger" @click="store.remove('tasks', task.id)" title="删除待办"><Trash2 :size="17" /></button></div>
        </article>
      </div>
      <div v-else class="empty-state"><span class="empty-check"><Check :size="24" /></span><h3>{{ filter === 'done' ? '还没有已完成事项' : '这里已经清空了' }}</h3><p>保持轻盈，继续处理真正重要的事情。</p></div>
    </section>
  </div>
</template>
