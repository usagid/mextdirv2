<script setup lang="ts">
const { locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const languages = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
  { code: 'ko', label: '한국어' },
] as const
</script>

<template>
  <div class="flex items-center gap-1 font-mono text-xs font-bold uppercase" aria-label="Language">
    <template v-for="(language, index) in languages" :key="language.code">
      <span v-if="index" aria-hidden="true" class="text-ink/40">/</span>
      <NuxtLink
        :to="switchLocalePath(language.code)"
        class="px-1 py-0.5 underline-offset-4 hover:bg-accent hover:no-underline"
        :class="locale === language.code ? 'bg-ink text-paper no-underline' : ''"
        :aria-current="locale === language.code ? 'page' : undefined"
      >
        {{ language.label }}
      </NuxtLink>
    </template>
  </div>
</template>
