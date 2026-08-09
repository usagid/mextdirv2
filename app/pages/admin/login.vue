<script setup lang="ts">
defineI18nRoute(false)
definePageMeta({ layout: 'admin' })

const form = reactive({ username: '', password: '' })
const errorMessage = ref('')
const { data: setup } = await useFetch<{ available: boolean }>('/api/admin/setup', { default: () => ({ available: false }) })

async function login() {
  errorMessage.value = ''
  try {
    await $fetch('/api/admin/login', { method: 'POST', body: form })
    await navigateTo('/admin')
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Login failed'
  }
}
</script>

<template>
  <div class="mx-auto max-w-lg py-8 sm:py-16">
    <div class="brutal-panel bg-accent p-6 shadow-brutal sm:p-8">
      <p class="eyebrow">mextdir / secure area</p>
      <h1 class="mt-4 font-display text-5xl uppercase leading-none tracking-[-0.08em]">Admin login</h1>
      <p class="mt-4 max-w-md text-sm leading-relaxed">Use a local admin account. Passwords are stored as one-way scrypt hashes, never as plaintext.</p>

      <form class="mt-8 grid gap-4" @submit.prevent="login">
        <label class="grid gap-1.5">
          <span class="eyebrow">Username</span>
          <input v-model="form.username" class="brutal-input" name="username" autocomplete="username" required>
        </label>
        <label class="grid gap-1.5">
          <span class="eyebrow">Password</span>
          <input v-model="form.password" class="brutal-input" name="password" type="password" autocomplete="current-password" required>
        </label>
        <p v-if="errorMessage" class="border-[3px] border-ink bg-tomato p-3 font-mono text-xs font-bold uppercase">{{ errorMessage }}</p>
        <button class="brutal-button mt-2" type="submit">Log in</button>
      </form>

      <NuxtLink v-if="setup?.available" to="/admin/setup" class="mt-6 inline-block font-mono text-xs font-bold uppercase underline underline-offset-4 hover:bg-white">First run? Create the first admin →</NuxtLink>
    </div>
  </div>
</template>
