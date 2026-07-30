<script setup lang="ts">
import { ref } from 'vue'
import { Activity, LogIn } from 'lucide-vue-next'
import { ApiError, api } from '@/services/api'

const emit = defineEmits<{ loggedIn: [user: { id: string; username: string; role: string }] }>()
const username = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')

async function submit() {
  error.value = ''; busy.value = true
  try { emit('loggedIn', await api.login(username.value, password.value)) }
  catch (value) { error.value = value instanceof ApiError ? value.message : '登录失败，请检查服务器连接' }
  finally { busy.value = false }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <div class="auth-brand"><span class="brand-mark"><Activity :size="24" /></span><strong>LifeFlow</strong></div>
      <p class="eyebrow">FAMILY SPACE</p><h1>登录你的生活空间</h1><p class="auth-copy">记录健康、待办、财务和时间，让生活保持清晰。</p>
      <form @submit.prevent="submit">
        <label>用户名<input v-model="username" autocomplete="username" required autofocus /></label>
        <label>密码<input v-model="password" type="password" autocomplete="current-password" required /></label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="button primary auth-submit" :disabled="busy"><LogIn :size="17" />{{ busy ? '登录中…' : '登录' }}</button>
      </form>
    </section>
  </main>
</template>
