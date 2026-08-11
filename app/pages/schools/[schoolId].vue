<script setup lang="ts">
import type { School } from '../../../shared/types/school'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { track } = useUmami()
const route = useRoute()
const schoolId = computed(() => String(route.params.schoolId || ''))

const { data: school, error } = await useFetch<School>(() => `/api/schools/${schoolId.value}`, {
  key: `school-${schoolId.value}`,
})

const supportUrl = 'https://mishashto.com/support'
const supportModalOpen = ref(false)
const copiedContact = ref<'phone' | 'additional' | null>(null)

type ContactAction = {
  href: string
  label: string
  external?: boolean
}

function getContactAction(value: string | undefined): ContactAction | null {
  const normalized = value?.trim()
  if (!normalized) return null
  if (/^mailto:/i.test(normalized)) return { href: normalized, label: t('detail.email') }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return { href: `mailto:${normalized}`, label: t('detail.email') }
  if (/^https?:\/\//i.test(normalized)) return { href: normalized, label: t('detail.contactButton'), external: true }

  const phone = normalized.replace(/[^\d+]/g, '')
  return phone ? { href: `tel:${phone}`, label: t('detail.call') } : null
}

function getCopyValue(value: string | undefined) {
  const normalized = value?.trim()
  const action = getContactAction(normalized)
  if (!normalized || !action || action.external) return null
  if (/^mailto:/i.test(normalized)) return normalized.replace(/^mailto:/i, '').split('?')[0]
  return normalized
}

const phoneAction = computed(() => getContactAction(school.value?.phoneNumber))
const additionalContactAction = computed(() => getContactAction(school.value?.additionalContact))
const phoneCopyValue = computed(() => getCopyValue(school.value?.phoneNumber))
const additionalContactCopyValue = computed(() => getCopyValue(school.value?.additionalContact))

function setSupportModalOpen(open: boolean) {
  supportModalOpen.value = open
}

async function copyContact(value: string, key: 'phone' | 'additional') {
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    return
  }
  copiedContact.value = key
  setSupportModalOpen(true)
}

function copyPhone() {
  if (phoneCopyValue.value) {
    track('copy-contact', { type: 'phone' })
    copyContact(phoneCopyValue.value, 'phone')
  }
}

function copyAdditionalContact() {
  if (additionalContactCopyValue.value) {
    track('copy-contact', { type: 'additional' })
    copyContact(additionalContactCopyValue.value, 'additional')
  }
}

const detailPath = computed(() => `/schools/${schoolId.value}`)
const seoConfig = useRuntimeConfig()
const requestUrl = useRequestURL()
const seoSiteUrl = String(seoConfig.public.siteUrl || requestUrl.origin).replace(/\/+$/, '')
const detailLocation = computed(() => [school.value?.prefecture, school.value?.city].filter(Boolean).join(''))
const detailTitle = computed(() => school.value
  ? t('seo.detailTitle', { schoolName: school.value.schoolName, location: detailLocation.value })
  : t('seo.notFoundTitle'))
const detailDescription = computed(() => school.value
  ? t('seo.detailDescription', { schoolName: school.value.schoolName, location: detailLocation.value })
  : t('seo.siteDescription'))
const detailKeywords = computed(() => school.value
  ? [t('seo.keywords'), school.value.schoolName, school.value.prefecture, school.value.city, school.value.facilityInfo, school.value.structureInfo].filter(Boolean).join(', ')
  : t('seo.keywords'))

function absoluteSeoUrl(value: string) {
  return new URL(value, `${seoSiteUrl}/`).toString()
}

const structuredData = computed(() => {
  const item = school.value
  if (!item) return null

  const pageUrl = absoluteSeoUrl(localePath(detailPath.value))
  const homeUrl = absoluteSeoUrl(localePath('/'))
  const listingsUrl = absoluteSeoUrl(localePath('/schools'))
  const imageUrls = item.images.map(image => absoluteSeoUrl(image.url))
  const additionalProperty = [
    ['施設種別', item.facilityInfo],
    ['構造', item.structureInfo],
    ['建築面積', `${item.buildingArea.toLocaleString()}㎡`],
    ['延床面積', `${item.floorArea.toLocaleString()}㎡`],
    ['階数', `${item.floorNum}階`],
    ['募集概要', item.recruitment],
    ['募集条件', item.conditions],
  ]
    .filter(([, value]) => value)
    .map(([name, value]) => ({ '@type': 'PropertyValue', name, value }))

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: detailTitle.value,
        description: detailDescription.value,
        inLanguage: locale.value,
        dateModified: item.updatedAt,
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        mainEntity: { '@id': `${pageUrl}#facility` },
      },
      {
        '@type': ['CivicStructure', 'Place'],
        '@id': `${pageUrl}#facility`,
        name: item.schoolName,
        description: detailDescription.value,
        url: pageUrl,
        keywords: detailKeywords.value,
        address: {
          '@type': 'PostalAddress',
          streetAddress: item.address,
          addressLocality: item.city,
          addressRegion: item.prefecture,
          addressCountry: 'JP',
        },
        ...(imageUrls.length ? { image: imageUrls } : {}),
        additionalProperty,
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('nav.home'), item: homeUrl },
          { '@type': 'ListItem', position: 2, name: t('nav.listings'), item: listingsUrl },
          { '@type': 'ListItem', position: 3, name: item.schoolName, item: pageUrl },
        ],
      },
    ],
  }
})

usePublicSeo({
  title: detailTitle,
  description: detailDescription,
  keywords: detailKeywords,
  path: detailPath,
  structuredData,
})
</script>

<template>
  <div class="page-shell py-8 sm:py-14">
    <NuxtLink :to="localePath('/schools')" class="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase underline decoration-2 underline-offset-4 hover:bg-accent" @click="track('back-to-listings')">
      <span aria-hidden="true">←</span> {{ t('detail.back') }}
    </NuxtLink>

    <div v-if="error || !school" class="brutal-panel mt-10 bg-accent p-8">
      <p class="eyebrow">404 / mextdir</p>
      <h1 class="mt-4 font-display text-4xl uppercase leading-none tracking-[-0.06em]">{{ t('detail.notFound') }}</h1>
    </div>

    <template v-else>
      <header class="mt-8 grid gap-6 border-b-[3px] border-ink pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p class="eyebrow">{{ school.prefecture }} / {{ school.city }}</p>
          <h1 class="mt-4 max-w-5xl font-display text-[clamp(3rem,8vw,8rem)] leading-[0.82] tracking-[-0.1em]">{{ school.schoolName }}</h1>
          <p class="mt-5 max-w-2xl text-base leading-relaxed text-ink/75">{{ school.address }}</p>
        </div>
        <span class="justify-self-start border-[3px] border-ink bg-accent px-3 py-2 font-mono text-xs font-bold uppercase shadow-brutal lg:justify-self-end">{{ t('card.open') }}</span>
      </header>

      <div class="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <ImageGallery :images="school.images" :school-name="school.schoolName" />
        <aside class="h-fit border-[3px] border-ink bg-accent p-5 shadow-brutal sm:p-7">
          <p class="eyebrow">{{ t('detail.contact') }}</p>
          <h2 class="mt-3 font-display text-3xl uppercase leading-none tracking-[-0.06em]">{{ t('detail.contactCta') }}</h2>
          <div class="mt-7 grid gap-4 border-t-[3px] border-ink pt-5 font-mono text-sm">
            <div>
              <p class="eyebrow">{{ t('fields.lister') }}</p>
              <p class="mt-1 font-bold">{{ school.lister }}</p>
            </div>
            <div v-if="school.phoneNumber && phoneAction" class="flex items-end justify-between gap-3">
              <div class="min-w-0">
                <p class="eyebrow">{{ t('fields.phoneNumber') }}</p>
                <a :href="phoneAction.href" class="mt-1 inline-block font-bold underline decoration-2 underline-offset-4 hover:bg-paper" @click="setSupportModalOpen(true); track('contact-phone')">{{ school.phoneNumber }}</a>
              </div>
              <div class="flex shrink-0 flex-wrap justify-end gap-2">
                <button
                  v-if="phoneCopyValue"
                  type="button"
                  class="brutal-button px-2 py-1 text-[10px] shadow-[2px_2px_0_#111]"
                  @click="copyPhone"
                >{{ copiedContact === 'phone' ? t('detail.copied') : t('detail.copy') }}</button>
                <a
                  :href="phoneAction.href"
                  class="brutal-button px-2 py-1 text-[10px] shadow-[2px_2px_0_#111]"
                  :target="phoneAction.external ? '_blank' : undefined"
                  :rel="phoneAction.external ? 'noreferrer' : undefined"
                  @click="setSupportModalOpen(true); track('contact-phone')"
                >{{ phoneAction.label }}</a>
              </div>
            </div>
            <div v-if="school.additionalContact" class="flex items-end justify-between gap-3">
              <div class="min-w-0">
                <p class="eyebrow">{{ t('fields.additionalContact') }}</p>
                <p class="mt-1 break-words font-bold">{{ school.additionalContact }}</p>
              </div>
              <div v-if="additionalContactAction" class="flex shrink-0 flex-wrap justify-end gap-2">
                <button
                  v-if="additionalContactCopyValue"
                  type="button"
                  class="brutal-button px-2 py-1 text-[10px] shadow-[2px_2px_0_#111]"
                  @click="copyAdditionalContact"
                >{{ copiedContact === 'additional' ? t('detail.copied') : t('detail.copy') }}</button>
                <a
                  :href="additionalContactAction.href"
                  class="brutal-button px-2 py-1 text-[10px] shadow-[2px_2px_0_#111]"
                  :target="additionalContactAction.external ? '_blank' : undefined"
                  :rel="additionalContactAction.external ? 'noreferrer' : undefined"
                  @click="setSupportModalOpen(true); track('contact-additional')"
                >{{ additionalContactAction.label }}</a>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <section class="mt-16 sm:mt-24">
        <div class="mb-6 flex items-end justify-between gap-4 border-b-[3px] border-ink pb-4">
          <h2 class="section-title text-4xl sm:text-6xl">{{ t('detail.overview') }}</h2>
          <p class="eyebrow hidden sm:block">mextdir / 03</p>
        </div>
        <SpecTable :school="school" />
      </section>

      <section class="mt-16 grid gap-5 sm:mt-20 md:grid-cols-3">
        <article class="border-[3px] border-ink bg-sky p-5 shadow-brutal">
          <p class="eyebrow">{{ t('detail.recruitment') }}</p>
          <p class="mt-8 whitespace-pre-line text-base leading-relaxed">{{ school.recruitment }}</p>
        </article>
        <article class="border-[3px] border-ink bg-moss p-5 shadow-brutal">
          <p class="eyebrow">{{ t('detail.conditions') }}</p>
          <p class="mt-8 whitespace-pre-line text-base leading-relaxed">{{ school.conditions }}</p>
        </article>
        <article class="border-[3px] border-ink bg-paper p-5 shadow-brutal">
          <p class="eyebrow">{{ t('detail.remarks') }}</p>
          <p class="mt-8 whitespace-pre-line text-base leading-relaxed">{{ school.remarks }}</p>
        </article>
      </section>
    </template>

    <Modal
      :open="supportModalOpen"
      :title="t('support.title')"
      :close-label="t('support.close')"
      @update:open="setSupportModalOpen"
    >
      <p>{{ t('support.body') }}</p>
      <template #actions>
        <a :href="supportUrl" class="brutal-button" target="_blank" rel="noreferrer" @click="track('support-mextdir')">{{ t('support.link') }}</a>
        <button type="button" class="brutal-button" @click="setSupportModalOpen(false)">{{ t('support.close') }}</button>
      </template>
    </Modal>
  </div>
</template>
