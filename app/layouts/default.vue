<script setup lang="ts">
useHead({
  script: [
    {
      defer: true,
      src: 'https://a.uwu.so/script.js',
      'data-website-id': '8ff1d5ce-d5c1-4afd-8787-7ce7244e5d33',
    },
    {
      defer: true,
      src: 'https://a.uwu.so/recorder.js',
      'data-website-id': '8ff1d5ce-d5c1-4afd-8787-7ce7244e5d33',
    },
  ],
})
</script>

<template>
  <div class="min-h-screen bg-paper text-ink">
    <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-accent focus:px-4 focus:py-3 focus:font-bold focus:shadow-brutal">
      {{ $t('accessibility.skipToContent') }}
    </a>
    <AppHeader />
    <main id="main-content">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
