<script setup lang="ts">
const config = useRuntimeConfig()
const umamiUrl = String(config.public.umamiUrl || '').replace(/\/+$/, '')
const umamiWebsiteId = String(config.public.umamiWebsiteId || '')

useHead({
  script: umamiUrl && umamiWebsiteId
    ? [
        {
          defer: true,
          src: `${umamiUrl}/script.js`,
          'data-website-id': umamiWebsiteId,
        },
        {
          defer: true,
          src: `${umamiUrl}/recorder.js`,
          'data-website-id': umamiWebsiteId,
        },
      ]
    : [],
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
