<script setup lang="ts">
const { locale, t } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const requestUrl = useRequestURL()
const umamiUrl = String(config.public.umamiUrl || '').replace(/\/+$/, '')
const umamiWebsiteId = String(config.public.umamiWebsiteId || '')
const siteUrl = String(config.public.siteUrl || requestUrl.origin).replace(/\/+$/, '')

const websiteSchema = computed(() => {
  const homeUrl = new URL(localePath('/'), `${siteUrl}/`).toString()
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${homeUrl}#website`,
    url: homeUrl,
    name: t('seo.siteName'),
    description: t('seo.siteDescription'),
    inLanguage: locale.value,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${new URL(localePath('/schools'), `${siteUrl}/`).toString()}?keyword={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
})

useHead(() => ({
  script: [
    ...(umamiUrl && umamiWebsiteId
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
      : []),
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(websiteSchema.value).replace(/</g, '\\u003c'),
    },
  ],
}))
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
