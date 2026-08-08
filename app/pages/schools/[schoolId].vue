<script setup lang="ts">
import type { School } from '../../../shared/types/school'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const schoolId = computed(() => String(route.params.schoolId || ''))

const { data: school, error } = await useFetch<School>(() => `/api/schools/${schoolId.value}`, {
  key: `school-${schoolId.value}`,
})

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

const phoneAction = computed(() => getContactAction(school.value?.phoneNumber))
const additionalContactAction = computed(() => getContactAction(school.value?.additionalContact))

useHead(() => ({
  title: school.value ? `${school.value.schoolName} — mextdir` : `mextdir — ${t('detail.notFound')}`,
}))
</script>

<template>
  <div class="page-shell py-8 sm:py-14">
    <NuxtLink :to="localePath('/schools')" class="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase underline decoration-2 underline-offset-4 hover:bg-accent">
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
            <div v-if="school.phoneNumber" class="flex items-end justify-between gap-3">
              <div class="min-w-0">
                <p class="eyebrow">{{ t('fields.phoneNumber') }}</p>
                <a :href="`tel:${school.phoneNumber}`" class="mt-1 inline-block font-bold underline decoration-2 underline-offset-4 hover:bg-paper">{{ school.phoneNumber }}</a>
              </div>
              <a
                v-if="phoneAction"
                :href="phoneAction.href"
                class="brutal-button shrink-0 px-2 py-1 text-[10px] shadow-[2px_2px_0_#111]"
                :target="phoneAction.external ? '_blank' : undefined"
                :rel="phoneAction.external ? 'noreferrer' : undefined"
              >{{ phoneAction.label }}</a>
            </div>
            <div v-if="school.additionalContact" class="flex items-end justify-between gap-3">
              <div class="min-w-0">
                <p class="eyebrow">{{ t('fields.additionalContact') }}</p>
                <p class="mt-1 break-words font-bold">{{ school.additionalContact }}</p>
              </div>
              <a
                v-if="additionalContactAction"
                :href="additionalContactAction.href"
                class="brutal-button shrink-0 px-2 py-1 text-[10px] shadow-[2px_2px_0_#111]"
                :target="additionalContactAction.external ? '_blank' : undefined"
                :rel="additionalContactAction.external ? 'noreferrer' : undefined"
              >{{ additionalContactAction.label }}</a>
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
  </div>
</template>
