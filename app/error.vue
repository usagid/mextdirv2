<script setup lang="ts">
const error = useError()
const { t } = useI18n()
const localePath = useLocalePath()

const statusCode = computed(() => Number(error.value?.statusCode || 500))
const isNotFound = computed(() => statusCode.value === 404)
const title = computed(() => t(isNotFound.value ? 'errors.notFoundTitle' : 'errors.genericTitle'))
const description = computed(() => t(isNotFound.value ? 'errors.notFoundDescription' : 'errors.genericDescription'))

async function goHome() {
  await clearError({ redirect: localePath('/') })
}

useHead(() => ({
  title: `${statusCode.value} — mextdir`,
  meta: [{ name: 'robots', content: 'noindex' }],
}))
</script>

<template>
  <main class="min-h-screen bg-paper text-ink">
    <div class="page-shell py-8 sm:py-14">
      <header class="flex items-center justify-between gap-4 border-b-[3px] border-ink pb-5">
        <NuxtLink :to="localePath('/')" class="font-display text-3xl leading-none tracking-[-0.08em]">mextdir</NuxtLink>
        <span class="eyebrow">{{ t('errors.status') }} / {{ statusCode }}</span>
      </header>

      <section class="mt-16 max-w-3xl border-[3px] border-ink bg-accent p-6 shadow-brutal sm:mt-24 sm:p-10">
        <p class="eyebrow">mextdir / {{ statusCode }}</p>
        <h1 class="mt-5 font-display text-[clamp(3.5rem,10vw,8rem)] leading-[0.82] tracking-[-0.1em]">{{ title }}</h1>
        <p class="mt-7 max-w-xl text-base leading-relaxed">{{ description }}</p>
        <div class="mt-9 flex flex-wrap gap-4">
          <button type="button" class="brutal-button" @click="goHome">{{ t('errors.home') }}</button>
          <NuxtLink :to="localePath('/schools')" class="brutal-button bg-paper">{{ t('errors.browse') }}</NuxtLink>
        </div>
      </section>
    </div>
  </main>
</template>
