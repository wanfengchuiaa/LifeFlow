<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { X } from 'lucide-vue-next'
import { useLifeStore } from '@/stores/life'
import { fromLocalInput, localDateKey, monthKey, toLocalInput } from '@/utils'

const store = useLifeStore()
const kind = computed(() => store.composerKind!)
const busy = ref(false)
const error = ref('')
const nowLocal = toLocalInput(new Date())
const inOneHour = toLocalInput(new Date(Date.now() + 3600000))
const form = reactive<Record<string, any>>({
  name: store.composerSeed.name || '', portion: store.composerSeed.portion || 1, unit: store.composerSeed.unit || '份', calories: store.composerSeed.calories || '', mealType: 'breakfast', occurredAt: nowLocal, savePreset: false,
  heightCm: store.latestBody?.heightCm || 170, weightKg: '', measuredAt: nowLocal,
  title: store.composerSeed.title || '', categoryId: store.composerSeed.categoryId || '', priority: 'medium', dueAt: '', recurrence: 'none', note: '',
  transactionType: 'expense', amount: '', accountId: store.accounts[0]?.id || '',
  startAt: store.composerSeed.startAt || nowLocal, endAt: store.composerSeed.endAt || inOneHour, linkedTaskId: store.composerSeed.linkedTaskId || '',
  accountType: 'digital', openingBalance: 0,
  month: monthKey(), budgetCategoryId: '', budgetAmount: store.monthBudget || 3000
})

const titles = { meal: '记录饮食', body: '记录身体数据', task: '新建待办', transaction: '记录收支', event: '新建日程', time: '补录时间', account: '新建账户', budget: '设置月预算' }
const taskCategories = computed(() => store.categories.filter(x => x.domain === 'task'))
const financeCategories = computed(() => store.categories.filter(x => x.domain === 'finance'))
const timeCategories = computed(() => store.categories.filter(x => x.domain === 'time'))

function notify(message: string) { window.dispatchEvent(new CustomEvent('lifeflow:toast', { detail: message })) }
function positive(value: any, label: string) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) throw new Error(`${label}必须大于 0`)
  return number
}

async function submit() {
  error.value = ''
  busy.value = true
  try {
    if (kind.value === 'meal') {
      if (!form.name.trim()) throw new Error('请输入食物名称')
      const input = { name: form.name.trim(), portion: positive(form.portion, '份量'), unit: form.unit.trim() || '份', calories: positive(form.calories, '热量'), mealType: form.mealType, occurredAt: fromLocalInput(form.occurredAt), note: form.note.trim() }
      await store.addMeal(input)
      if (form.savePreset) await store.addFoodPreset({ name: input.name, portion: input.portion, unit: input.unit, calories: input.calories })
    } else if (kind.value === 'body') {
      await store.addBody({ measuredAt: fromLocalInput(form.measuredAt), heightCm: positive(form.heightCm, '身高'), weightKg: positive(form.weightKg, '体重'), note: form.note.trim() })
    } else if (kind.value === 'task') {
      if (!form.title.trim()) throw new Error('请输入待办标题')
      await store.addTask({ title: form.title.trim(), categoryId: form.categoryId || null, priority: form.priority, dueAt: form.dueAt ? fromLocalInput(form.dueAt) : null, recurrence: form.recurrence, status: 'todo', completedAt: null, note: form.note.trim() })
    } else if (kind.value === 'transaction') {
      if (!form.accountId) throw new Error('请先选择或新建账户')
      await store.addTransaction({ type: form.transactionType, amount: positive(form.amount, '金额'), accountId: form.accountId, categoryId: form.categoryId || null, occurredAt: fromLocalInput(form.occurredAt), note: form.note.trim() })
    } else if (kind.value === 'event') {
      if (!form.title.trim()) throw new Error('请输入日程标题')
      const startAt = fromLocalInput(form.startAt), endAt = fromLocalInput(form.endAt)
      if (new Date(endAt) <= new Date(startAt)) throw new Error('结束时间必须晚于开始时间')
      await store.addEvent({ title: form.title.trim(), startAt, endAt, categoryId: form.categoryId || null, linkedTaskId: form.linkedTaskId || null, note: form.note.trim() })
    } else if (kind.value === 'time') {
      if (!form.title.trim()) throw new Error('请输入记录名称')
      const startAt = fromLocalInput(form.startAt), endAt = fromLocalInput(form.endAt)
      const durationMinutes = Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000)
      if (durationMinutes <= 0) throw new Error('结束时间必须晚于开始时间')
      await store.addTime({ title: form.title.trim(), startAt, endAt, durationMinutes, categoryId: form.categoryId || null, linkedTaskId: form.linkedTaskId || null, source: 'manual', note: form.note.trim() })
    } else if (kind.value === 'account') {
      if (!form.name.trim()) throw new Error('请输入账户名称')
      await store.addAccount({ name: form.name.trim(), type: form.accountType, openingBalance: Number(form.openingBalance) || 0 })
    } else if (kind.value === 'budget') {
      await store.addBudget({ month: form.month, categoryId: form.budgetCategoryId || null, amount: positive(form.budgetAmount, '预算') })
    }
  notify('已保存到本机')
    store.closeComposer()
  } catch (value) {
    error.value = value instanceof Error ? value.message : '保存失败，请检查输入'
  } finally { busy.value = false }
}
</script>

<template>
  <div class="modal-backdrop" @mousedown.self="store.closeComposer()">
    <section class="composer" role="dialog" aria-modal="true" :aria-label="titles[kind]">
      <header><div><span class="eyebrow">快速记录</span><h2>{{ titles[kind] }}</h2></div><button class="icon-button" @click="store.closeComposer()" aria-label="关闭"><X :size="20" /></button></header>
      <form @submit.prevent="submit">
        <template v-if="kind === 'meal'">
          <label>食物名称<input v-model="form.name" list="food-presets" placeholder="例如：鸡胸肉饭" autofocus /></label>
          <datalist id="food-presets"><option v-for="item in store.foodPresets" :key="item.id" :value="item.name" /></datalist>
          <div class="form-grid"><label>份量<input v-model="form.portion" type="number" min="0.1" step="0.1" /></label><label>单位<input v-model="form.unit" placeholder="份 / 克 / 杯" /></label></div>
          <div class="form-grid"><label>热量（千卡）<input v-model="form.calories" type="number" min="1" inputmode="decimal" /></label><label>餐次<select v-model="form.mealType"><option value="breakfast">早餐</option><option value="lunch">午餐</option><option value="dinner">晚餐</option><option value="snack">加餐</option></select></label></div>
          <label>时间<input v-model="form.occurredAt" type="datetime-local" /></label>
          <label class="check-row"><input v-model="form.savePreset" type="checkbox" /> 保存为常用食物</label>
        </template>

        <template v-else-if="kind === 'body'">
          <div class="form-grid"><label>体重（kg）<input v-model="form.weightKg" type="number" min="20" step="0.1" inputmode="decimal" autofocus /></label><label>身高（cm）<input v-model="form.heightCm" type="number" min="80" step="0.1" /></label></div>
          <label>测量时间<input v-model="form.measuredAt" type="datetime-local" /></label>
          <label>备注<textarea v-model="form.note" placeholder="例如：晨起空腹"></textarea></label>
        </template>

        <template v-else-if="kind === 'task'">
          <label>待办标题<input v-model="form.title" placeholder="接下来要完成什么？" autofocus /></label>
          <div class="form-grid"><label>分类<select v-model="form.categoryId"><option value="">未分类</option><option v-for="item in taskCategories" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label>优先级<select v-model="form.priority"><option value="low">低</option><option value="medium">中</option><option value="high">高</option></select></label></div>
          <label>截止时间<input v-model="form.dueAt" type="datetime-local" /></label>
          <label>重复<select v-model="form.recurrence"><option value="none">不重复</option><option value="daily">每天</option><option value="weekly">每周</option><option value="monthly">每月</option></select></label>
          <label>备注<textarea v-model="form.note" placeholder="可选"></textarea></label>
        </template>

        <template v-else-if="kind === 'transaction'">
          <div class="segmented"><button type="button" :class="{ active: form.transactionType === 'expense' }" @click="form.transactionType = 'expense'">支出</button><button type="button" :class="{ active: form.transactionType === 'income' }" @click="form.transactionType = 'income'">收入</button></div>
          <label>金额（元）<input v-model="form.amount" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="0.00" autofocus /></label>
          <div class="form-grid"><label>账户<select v-model="form.accountId"><option v-for="item in store.accounts" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label>分类<select v-model="form.categoryId"><option value="">未分类</option><option v-for="item in financeCategories" :key="item.id" :value="item.id">{{ item.name }}</option></select></label></div>
          <label>时间<input v-model="form.occurredAt" type="datetime-local" /></label>
          <label>备注<input v-model="form.note" placeholder="这笔钱花在了哪里？" /></label>
        </template>

        <template v-else-if="kind === 'event' || kind === 'time'">
          <label>{{ kind === 'event' ? '日程标题' : '记录名称' }}<input v-model="form.title" :placeholder="kind === 'event' ? '安排什么事情？' : '这段时间做了什么？'" autofocus /></label>
          <div class="form-grid"><label>开始<input v-model="form.startAt" type="datetime-local" /></label><label>结束<input v-model="form.endAt" type="datetime-local" /></label></div>
          <label>分类<select v-model="form.categoryId"><option value="">未分类</option><option v-for="item in timeCategories" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label>关联待办<select v-model="form.linkedTaskId"><option value="">不关联</option><option v-for="item in store.tasks.filter(x => x.status === 'todo')" :key="item.id" :value="item.id">{{ item.title }}</option></select></label>
          <label>备注<textarea v-model="form.note" placeholder="可选"></textarea></label>
        </template>

        <template v-else-if="kind === 'account'">
          <label>账户名称<input v-model="form.name" placeholder="例如：工资卡" autofocus /></label>
          <div class="form-grid"><label>账户类型<select v-model="form.accountType"><option value="cash">现金</option><option value="bank">银行卡</option><option value="digital">电子账户</option></select></label><label>期初余额<input v-model="form.openingBalance" type="number" step="0.01" /></label></div>
        </template>

        <template v-else-if="kind === 'budget'">
          <label>月份<input v-model="form.month" type="month" /></label>
          <label>预算范围<select v-model="form.budgetCategoryId"><option value="">总预算</option><option v-for="item in financeCategories.filter(x => x.name !== '工资')" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label>预算金额（元）<input v-model="form.budgetAmount" type="number" min="1" step="1" autofocus /></label>
        </template>

        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <footer><button type="button" class="button secondary" @click="store.closeComposer()">取消</button><button class="button primary" :disabled="busy">{{ busy ? '保存中…' : '保存记录' }}</button></footer>
      </form>
    </section>
  </div>
</template>
