<script setup lang="ts">
const localePath = useLocalePath()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-20 border-t-[3px] border-ink bg-ink text-paper">
    <div class="page-shell grid gap-8 py-10 sm:grid-cols-[1fr_auto] sm:items-end">
      <div>
        <NuxtLink :to="localePath('/')" class="inline-block bg-accent px-2 py-1 font-display text-3xl leading-none tracking-[-0.08em] text-ink">mextdir</NuxtLink>
        <p class="mt-4 max-w-sm font-mono text-xs uppercase leading-relaxed text-paper/70">{{ $t('footer.note') }}</p>
        <p class="mt-2 max-w-sm font-mono text-xs uppercase leading-relaxed text-paper/70">{{ $t('footer.disclaimer') }}</p>
      </div>
      <div class="font-mono text-xs uppercase leading-loose text-paper/70 sm:text-right">
        <NuxtLink :to="localePath('/about')" class="underline underline-offset-4 hover:bg-accent hover:text-ink">{{ $t('nav.about') }}</NuxtLink>
        <p>{{ $t('footer.copyright', { year }) }}</p>
      </div>
    </div>
  </footer>
</template>
