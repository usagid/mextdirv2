<script setup lang="ts">
defineI18nRoute(false)
definePageMeta({ layout: 'admin' })

const form = reactive({ username: '', password: '', passwordConfirm: '' })
const errorMessage = ref('')
const { data: setup } = await useFetch<{ available: boolean }>('/api/admin/setup', { default: () => ({ available: false }) })
if (!setup.value?.available) await navigateTo('/admin/login')

async function createFirstAdmin() {
  errorMessage.value = ''
  if (form.password !== form.passwordConfirm) {
    errorMessage.value = 'Passwords do not match'
    return
  }
  try {
    await $fetch('/api/admin/setup', {
      method: 'POST',
      body: { username: form.username, password: form.password },
    })
    await navigateTo('/admin')
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Setup failed'
  }
}
</script>

<template>
  <div class="mx-auto max-w-lg py-8 sm:py-16">
    <div class="brutal-panel bg-accent p-6 shadow-brutal sm:p-8">
      <p class="eyebrow">mextdir / first run</p>
      <h1 class="mt-4 font-display text-5xl uppercase leading-none tracking-[-0.08em]">Create admin</h1>
      <p class="mt-4 text-sm leading-relaxed">This one-time setup creates the first administrator. Use at least 12 characters for the password.</p>

      <form class="mt-8 grid gap-4" @submit.prevent="createFirstAdmin">
        <label class="grid gap-1.5">
          <span class="eyebrow">Username</span>
          <input v-model="form.username" class="brutal-input" name="username" autocomplete="username" required>
        </label>
        <label class="grid gap-1.5">
          <span class="eyebrow">Password</span>
          <input v-model="form.password" class="brutal-input" name="password" type="password" minlength="12" autocomplete="new-password" required>
        </label>
        <label class="grid gap-1.5">
          <span class="eyebrow">Repeat password</span>
          <input v-model="form.passwordConfirm" class="brutal-input" name="passwordConfirm" type="password" minlength="12" autocomplete="new-password" required>
        </label>
        <p v-if="errorMessage" class="border-[3px] border-ink bg-tomato p-3 font-mono text-xs font-bold uppercase">{{ errorMessage }}</p>
        <button class="brutal-button mt-2" type="submit">Create first admin</button>
      </form>
    </div>
  </div>
</template>
