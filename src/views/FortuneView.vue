<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { BriefcaseBusiness, Compass, Heart, RefreshCw, ShieldCheck, Sparkles, WalletCards, Wind } from 'lucide-vue-next'
import { useLifeStore } from '@/stores/life'
import { buildLocalFortune, fetchFortune, getYearElement, zodiacSigns, type FortuneAnalysis, type FortuneProfile } from '@/services/fortune'

const store = useLifeStore()
const profile = reactive<FortuneProfile>({ birthDate: store.settings.birthDate || '', birthTime: store.settings.birthTime || '', gender: store.settings.gender || 'unknown' })
const analysis = ref<FortuneAnalysis>(buildLocalFortune(profile))
const loading = ref(false)
const message = ref('')

const profileReady = computed(() => Boolean(profile.birthDate))
const elementCopy = computed(() => ({ 木: '生长、连接与长期主义', 火: '表达、行动与感染力', 土: '稳定、承接与兑现', 金: '边界、判断与效率', 水: '流动、直觉与适应' }[analysis.value.element]))
const readingCards = computed(() => [
  { key: 'love', label: '爱情关系', icon: Heart, color: 'coral', text: analysis.value.love },
  { key: 'career', label: '事业节奏', icon: BriefcaseBusiness, color: 'blue', text: analysis.value.career },
  { key: 'wealth', label: '财富提醒', icon: WalletCards, color: 'yellow', text: analysis.value.wealth },
  { key: 'health', label: '身心状态', icon: Wind, color: 'green', text: analysis.value.health }
])

function compassStyle(index: number) { return { '--angle': `${index * 30}deg` } }
function updateLocalPreview() { analysis.value = buildLocalFortune(profile) }
async function analyze() {
  loading.value = true
  message.value = ''
  try {
    await store.updateSettings({ birthDate: profile.birthDate, birthTime: profile.birthTime, gender: profile.gender })
    const result = await fetchFortune(profile)
    analysis.value = result.analysis
    message.value = result.message || (result.analysis.source === 'online' ? '已获取在线运势。' : '')
  } catch {
    message.value = '保存出生信息失败，当前结果仍可作为本地预览。'
    analysis.value = buildLocalFortune(profile)
  } finally {
    loading.value = false
  }
}
onMounted(() => updateLocalPreview())
</script>

<template>
  <div class="page-content fortune-page">
    <section class="fortune-hero">
      <div><span class="eyebrow">ASTROLOGY / WUXING</span><h2>把未知，变成一次自我观察</h2><p>星座罗盘、生肖和年柱五行侧写，给今天一个轻盈的参考。</p></div>
      <div class="fortune-source" :class="analysis.source"><span></span>{{ analysis.sourceLabel }}</div>
    </section>

    <section class="fortune-layout">
      <article class="panel fortune-profile-panel">
        <header class="section-heading"><div><span class="eyebrow">YOUR PROFILE</span><h3>输入出生信息</h3></div><Sparkles :size="20" class="profile-spark" /></header>
        <form class="fortune-form" @submit.prevent="analyze">
          <label>出生日期<input v-model="profile.birthDate" type="date" @change="updateLocalPreview" /></label>
          <label>出生时间 <span class="optional">可选</span><input v-model="profile.birthTime" type="time" @change="updateLocalPreview" /></label>
          <label>性别 <span class="optional">可选</span><select v-model="profile.gender"><option value="unknown">不填写</option><option value="female">女性</option><option value="male">男性</option></select></label>
          <button class="button primary fortune-submit" type="submit" :disabled="loading"><RefreshCw :size="16" :class="{ spin: loading }" />{{ loading ? '分析中…' : '生成今日分析' }}</button>
        </form>
        <p v-if="message" class="fortune-message" role="status">{{ message }}</p>
        <div class="fortune-note"><ShieldCheck :size="16" /><span>出生信息只保存在当前浏览器。在线接口需由你在环境变量中配置，未配置时不会发出请求。</span></div>
      </article>

      <article class="panel compass-panel">
        <header class="section-heading"><div><span class="eyebrow">ZODIAC COMPASS</span><h3>{{ analysis.sign }} · 今日罗盘</h3></div><span class="compass-date">{{ new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(new Date()) }}</span></header>
        <div class="zodiac-compass" :class="{ placeholder: !profileReady }">
          <span v-for="(sign, index) in zodiacSigns" :key="sign" class="compass-sign" :class="{ active: sign === analysis.sign }" :style="compassStyle(index)">{{ sign.replace('座', '') }}</span>
          <div class="compass-core"><Compass :size="27" /><strong>{{ analysis.sign === '待设置' ? '未设置' : analysis.sign.replace('座', '') }}</strong><small>{{ analysis.chineseZodiac }} · {{ analysis.element }}{{ analysis.polarity }}</small></div>
        </div>
        <div class="compass-legend"><span><i class="legend-dot active"></i>你的星座</span><span><i class="legend-dot"></i>十二星座轨道</span></div>
      </article>
    </section>

    <section class="fortune-summary">
      <div class="summary-copy"><span class="eyebrow">TODAY'S READING</span><h3>{{ analysis.summary }}</h3><p>把它当成一个提醒，而不是答案。</p></div>
      <div class="summary-facts"><span><small>年柱五行</small><strong>{{ analysis.element }} · {{ analysis.polarity }}</strong><em>{{ elementCopy }}</em></span><span><small>生肖</small><strong>{{ analysis.chineseZodiac }}</strong><em>出生年份侧写</em></span><span><small>幸运指引</small><strong>{{ analysis.luckyColor }}</strong><em>{{ analysis.direction }} · {{ analysis.luckyNumber }}</em></span></div>
    </section>

    <section class="fortune-readings">
      <article v-for="card in readingCards" :key="card.key" class="reading-card" :class="card.color"><span class="reading-icon"><component :is="card.icon" :size="18" /></span><div><small>{{ card.label }}</small><p>{{ card.text }}</p></div></article>
    </section>

    <p class="fortune-disclaimer"><ShieldCheck :size="15" /> 这是基于星座与简化年柱五行的娱乐性自我观察，不构成医疗、财务或人生决策建议。</p>
  </div>
</template>
