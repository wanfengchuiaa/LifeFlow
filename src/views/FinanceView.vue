<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDownLeft, ArrowUpRight, Landmark, Plus, SlidersHorizontal, Trash2, WalletCards } from 'lucide-vue-next'
import { useLifeStore } from '@/stores/life'
import { formatDate, formatMoney, monthKey, percent } from '@/utils'

const store = useLifeStore()
const totalBalance = computed(() => store.accounts.reduce((sum, account) => sum + accountBalance(account.id), 0))
const budgetProgress = computed(() => percent(store.monthExpense, store.monthBudget))
const currentTransactions = computed(() => [...store.currentMonthTransactions].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)))
const expenseCategories = computed(() => store.categories.filter(x => x.domain === 'finance').map(category => ({
  ...category,
  amount: store.currentMonthTransactions.filter(x => x.type === 'expense' && x.categoryId === category.id).reduce((sum, x) => sum + x.amount, 0)
})).filter(x => x.amount > 0).sort((a, b) => b.amount - a.amount))

function accountBalance(id: string) {
  const account = store.accounts.find(x => x.id === id)
  return (account?.openingBalance || 0) + store.transactions.filter(x => x.accountId === id).reduce((sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount), 0)
}
const category = (id: string | null) => store.categories.find(x => x.id === id)
</script>

<template>
  <div class="page-content">
    <section class="page-intro"><div><span class="eyebrow">FINANCE</span><h2>每一笔，都算得明白</h2><p>{{ monthKey() }} · 本月结余 {{ formatMoney(store.monthIncome - store.monthExpense) }}</p></div><div class="page-actions"><button class="button secondary" @click="store.openComposer('budget')"><SlidersHorizontal :size="17" />预算</button><button class="button primary" @click="store.openComposer('transaction')"><Plus :size="17" />记一笔</button></div></section>

    <section class="finance-summary">
      <article class="balance-card"><span>全部账户余额</span><strong>{{ formatMoney(totalBalance) }}</strong><small>{{ store.accounts.length }} 个账户 · 数据按账号隔离</small></article>
      <article class="money-stat income"><span class="metric-icon green"><ArrowDownLeft :size="19" /></span><div><small>本月收入</small><strong>{{ formatMoney(store.monthIncome) }}</strong></div></article>
      <article class="money-stat expense"><span class="metric-icon coral"><ArrowUpRight :size="19" /></span><div><small>本月支出</small><strong>{{ formatMoney(store.monthExpense) }}</strong></div></article>
    </section>

    <section class="content-grid two-thirds">
      <article class="panel">
        <header class="section-heading"><div><span class="eyebrow">TRANSACTIONS</span><h3>本月流水</h3></div><span class="section-total">{{ currentTransactions.length }} 笔</span></header>
        <div v-if="currentTransactions.length" class="record-list">
          <div v-for="item in currentTransactions" :key="item.id" class="record-row">
            <span class="record-icon" :class="item.type === 'expense' ? 'coral' : 'green'"><ArrowUpRight v-if="item.type === 'expense'" :size="17" /><ArrowDownLeft v-else :size="17" /></span>
            <div class="record-main"><strong>{{ item.note || category(item.categoryId)?.name || (item.type === 'expense' ? '支出' : '收入') }}</strong><small>{{ category(item.categoryId)?.name || '未分类' }} · {{ formatDate(item.occurredAt, true) }}</small></div>
            <b :class="item.type">{{ item.type === 'expense' ? '-' : '+' }}{{ formatMoney(item.amount) }}</b><button class="row-action" @click="store.remove('transactions', item.id)" title="删除流水"><Trash2 :size="16" /></button>
          </div>
        </div>
        <button v-else class="empty-action" @click="store.openComposer('transaction')"><WalletCards :size="22" /><span>本月还没有流水</span><small>记录第一笔收支</small></button>
      </article>

      <aside class="panel budget-panel">
        <header class="section-heading"><div><span class="eyebrow">BUDGET</span><h3>本月预算</h3></div></header>
        <div class="budget-circle" :style="{ '--progress': `${budgetProgress * 3.6}deg` }"><div><strong>{{ budgetProgress }}%</strong><small>已使用</small></div></div>
        <div class="budget-numbers"><span><small>已支出</small><strong>{{ formatMoney(store.monthExpense) }}</strong></span><span><small>总预算</small><strong>{{ store.monthBudget ? formatMoney(store.monthBudget) : '未设置' }}</strong></span></div>
        <div class="category-spend"><div v-for="item in expenseCategories.slice(0, 4)" :key="item.id"><span><i :style="{ background: item.color }"></i>{{ item.name }}</span><strong>{{ formatMoney(item.amount) }}</strong><div class="micro-bar"><span :style="{ width: `${percent(item.amount, store.monthExpense)}%`, background: item.color }"></span></div></div></div>
      </aside>
    </section>

    <section class="panel accounts-panel"><header class="section-heading"><div><span class="eyebrow">ACCOUNTS</span><h3>我的账户</h3></div><button class="text-link" @click="store.openComposer('account')"><Plus :size="15" />添加账户</button></header><div class="account-grid"><article v-for="account in store.accounts" :key="account.id"><span class="account-icon"><Landmark :size="18" /></span><div><small>{{ account.type === 'cash' ? '现金' : account.type === 'bank' ? '银行卡' : '电子账户' }}</small><strong>{{ account.name }}</strong></div><b>{{ formatMoney(accountBalance(account.id)) }}</b></article></div></section>
  </div>
</template>
