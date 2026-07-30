<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArchiveRestore, Database, Download, HardDrive, LogOut, RefreshCw, ShieldCheck, Trash2, Upload } from 'lucide-vue-next'
import { useLifeStore } from '@/stores/life'
import { api } from '@/services/api'

const store = useLifeStore()
const calorieTarget = ref(store.settings.calorieTarget)
const targetWeight = ref(store.settings.targetWeightKg)
const birthDate = ref(store.settings.birthDate || '')
const importInput = ref<HTMLInputElement>()
const importing = ref(false)
const confirmReset = ref(false)
const members = ref<Array<{ id: string; username: string; role: string; active?: boolean }>>([])
const memberName = ref('')
const memberPassword = ref('')

function notify(message: string) { window.dispatchEvent(new CustomEvent('lifeflow:toast', { detail: message })) }
async function saveGoals() { await store.updateSettings({ calorieTarget: Number(calorieTarget.value), targetWeightKg: Number(targetWeight.value), birthDate: birthDate.value }); notify('目标设置已更新') }
async function onImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  importing.value = true
  try { await store.restoreBackup(JSON.parse(await file.text())); notify('备份已完整恢复') }
  catch { notify('备份格式无效，未修改现有数据') }
  finally { importing.value = false; if (importInput.value) importInput.value.value = '' }
}
async function reset(sample: boolean) { await store.reset(sample); confirmReset.value = false; notify(sample ? '示例数据已恢复' : '个人记录已清空') }
async function logout() { await store.logout() }
async function loadMembers() { if (store.user?.role === 'admin') members.value = await api.members() }
async function createMember() { if (!memberName.value.trim() || !memberPassword.value) return; await api.createMember(memberName.value, memberPassword.value); memberName.value = ''; memberPassword.value = ''; await loadMembers(); notify('家庭成员已创建') }
async function toggleMember(member: { id: string; active?: boolean }) { await api.updateMember(member.id, member.active === false); await loadMembers() }
onMounted(loadMembers)
</script>

<template>
  <div class="page-content settings-page">
    <section class="page-intro"><div><span class="eyebrow">SETTINGS</span><h2>设置与云端数据</h2><p>LifeFlow 使用服务器保存你的记录，登录后可在家庭设备间访问。</p></div><span class="privacy-badge"><ShieldCheck :size="18" />账号隔离</span></section>
    <section class="settings-grid">
      <article class="panel setting-section"><header><span class="setting-icon green"><RefreshCw :size="20" /></span><div><h3>健康目标</h3><p>用于首页和健康页的每日进度计算。</p></div></header><div class="form-grid"><label>每日热量目标（kcal）<input v-model="calorieTarget" type="number" min="500" step="50" /></label><label>目标体重（kg）<input v-model="targetWeight" type="number" min="20" step="0.1" /></label><label>出生日期（用于人生进度）<input v-model="birthDate" type="date" /></label></div><button class="button primary compact" @click="saveGoals">保存目标</button></article>
      <article class="panel setting-section"><header><span class="setting-icon blue"><HardDrive :size="20" /></span><div><h3>地区与单位</h3><p>第一版使用固定的中文本地化设置。</p></div></header><div class="settings-facts"><span><small>语言</small><strong>简体中文</strong></span><span><small>时区</small><strong>Asia/Shanghai</strong></span><span><small>货币</small><strong>人民币 CNY</strong></span><span><small>身体单位</small><strong>cm / kg / kcal</strong></span></div><button class="button secondary compact" @click="logout"><LogOut :size="16" />退出登录</button></article>
      <article class="panel setting-section data-section"><header><span class="setting-icon yellow"><Database :size="20" /></span><div><h3>备份与恢复</h3><p>建议定期导出 JSON 备份，服务器数据也应定期做文件备份。</p></div></header><div class="data-actions"><button class="button secondary" @click="store.downloadBackup()"><Download :size="17" />导出 JSON 备份</button><button class="button secondary" :disabled="importing" @click="importInput?.click()"><Upload :size="17" />{{ importing ? '正在校验…' : '导入备份' }}</button><input ref="importInput" type="file" accept="application/json" hidden @change="onImport" /></div><div class="data-note"><ArchiveRestore :size="17" /><span>导入前会验证格式，只有完整有效的备份才会替换当前数据。</span></div></article>
      <article v-if="store.user?.role === 'admin'" class="panel setting-section"><header><span class="setting-icon purple"><ShieldCheck :size="20" /></span><div><h3>家庭成员</h3><p>管理员可以创建和停用成员账号，成员数据彼此隔离。</p></div></header><div class="form-grid"><label>新成员用户名<input v-model="memberName" autocomplete="off" /></label><label>初始密码<input v-model="memberPassword" type="password" autocomplete="new-password" /></label></div><button class="button secondary compact" @click="createMember">创建成员</button><div v-if="members.length" class="member-list"><div v-for="member in members" :key="member.id" class="member-row"><span>{{ member.username }}<small>{{ member.role === 'admin' ? '管理员' : '成员' }}</small></span><button v-if="member.id !== store.user?.id" class="button secondary compact" @click="toggleMember(member)">{{ member.active === false ? '恢复' : '停用' }}</button></div></div></article>
      <article class="panel setting-section danger-section"><header><span class="setting-icon coral"><Trash2 :size="20" /></span><div><h3>重置数据</h3><p>清空健康、待办、财务和日程记录，此操作无法撤销。</p></div></header><template v-if="!confirmReset"><div class="data-actions"><button class="button secondary" @click="reset(true)"><RefreshCw :size="17" />恢复示例数据</button><button class="button danger" @click="confirmReset = true"><Trash2 :size="17" />清空个人记录</button></div></template><div v-else class="confirm-strip"><div><strong>确定清空全部个人记录？</strong><small>建议先导出一份备份。</small></div><button class="button secondary compact" @click="confirmReset=false">取消</button><button class="button danger compact" @click="reset(false)">确认清空</button></div></article>
    </section>
  </div>
</template>
