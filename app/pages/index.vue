<script setup lang="ts">
import type { SchoolListResponse } from '../../shared/types/school'
import type { PrefectureOption } from '../../shared/types/prefecture'

const { t } = useI18n()
const localePath = useLocalePath()
const { track } = useUmami()
const search = reactive({ prefecture: '', city: '', keyword: '' })

const { data: prefectures } = await useFetch<PrefectureOption[]>('/api/prefectures', {
  default: () => [],
})
const { data: featured, pending } = await useFetch<SchoolListResponse>('/api/schools', {
  query: { page: 1, sort: 'newest' },
  default: () => ({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 }),
})

const prefectureOptions = computed(() => [
  { value: '', label: t('filters.any') },
  ...(prefectures.value || []).map(prefecture => ({
    value: prefecture.name,
    label: prefecture.name,
    count: prefecture.count,
  })),
])
const selectedPrefecture = computed({
  get: () => search.prefecture,
  set: (value: string) => {
    if (value !== search.prefecture) search.city = ''
    search.prefecture = value
  },
})
const { data: cities } = await useFetch<string[]>('/api/cities', {
  query: computed(() => ({ prefecture: search.prefecture || undefined })),
  default: () => [],
})
const cityOptions = computed(() => [
  { value: '', label: t('filters.any') },
  ...(cities.value || []).map(city => ({ value: city, label: city })),
])
const latestSchools = computed(() => featured.value?.items.slice(0, 6) || [])

function searchListings() {
  const query = Object.fromEntries(
    Object.entries(search).filter(([, value]) => value),
  )
  navigateTo({ path: localePath('/schools'), query })
}

useHead(() => ({ title: `mextdir — ${t('hero.eyebrow')}` }))
</script>

<template>
  <div>
    <section class="border-b-[3px] border-ink bg-accent">
      <div class="page-shell grid gap-10 py-12 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16 lg:py-28">
        <div>
          <p class="eyebrow">{{ t('hero.eyebrow') }}</p>
          <h1 class="mt-5 max-w-4xl whitespace-pre-line font-display text-[clamp(3.8rem,10vw,9.5rem)] leading-[0.82] tracking-[-0.1em]">{{ t('hero.title') }}</h1>
          <p class="mt-8 max-w-xl text-base leading-relaxed sm:text-lg">{{ t('hero.description') }}</p>
        </div>

        <form class="brutal-panel bg-paper p-4 sm:p-6" @submit.prevent="searchListings">
          <div class="mb-5 flex items-center justify-between border-b-[3px] border-ink pb-3">
            <h2 class="font-display text-2xl uppercase leading-none tracking-[-0.06em]">{{ t('hero.searchLabel') }}</h2>
            <span class="font-mono text-xs font-bold">/01</span>
          </div>
          <div class="grid gap-4">
            <div class="grid gap-1.5">
              <span class="eyebrow">{{ t('hero.prefecture') }}</span>
              <VirtualSelect v-model="selectedPrefecture" :options="prefectureOptions" :placeholder="t('filters.any')" :aria-label="t('hero.prefecture')" />
            </div>
            <div class="grid gap-1.5">
              <span class="eyebrow">{{ t('hero.city') }}</span>
              <VirtualSelect v-model="search.city" :options="cityOptions" :placeholder="t('filters.any')" :aria-label="t('hero.city')" :disabled="!search.prefecture" />
            </div>
            <label class="grid gap-1.5">
              <span class="eyebrow">{{ t('hero.keyword') }}</span>
              <input v-model="search.keyword" class="brutal-input" type="search" :placeholder="t('hero.keywordPlaceholder')">
            </label>
            <button
              type="submit"
              class="brutal-button mt-1 w-full"
              data-umami-event="search-listings"
              :data-umami-event-prefecture="search.prefecture || 'any'"
              :data-umami-event-city="search.city || 'any'"
            >{{ t('hero.search') }} <span aria-hidden="true" class="ml-2 text-xl leading-none">→</span></button>
          </div>
        </form>
      </div>
    </section>

    <section class="page-shell py-16 sm:py-24">
      <div class="mb-8 flex flex-col justify-between gap-4 border-b-[3px] border-ink pb-5 sm:flex-row sm:items-end">
        <div>
          <p class="eyebrow">{{ t('home.featuredEyebrow') }}</p>
          <h2 class="section-title mt-3 max-w-3xl whitespace-pre-line">{{ t('home.featuredTitle') }}</h2>
        </div>
        <NuxtLink :to="localePath('/schools')" class="font-mono text-xs font-bold uppercase underline decoration-2 underline-offset-4 hover:bg-accent" @click="track('browse-listings', { source: 'home-featured' })">{{ t('home.featuredLink') }} →</NuxtLink>
      </div>

      <div v-if="pending" class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div v-for="slot in 3" :key="slot" class="aspect-[4/3] animate-pulse border-[3px] border-ink bg-ink/10" />
      </div>
      <div v-else class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <ListingCard v-for="school in latestSchools" :key="school.id" :school="school" />
      </div>
    </section>

    <section class="border-y-[3px] border-ink bg-ink text-paper">
      <div class="page-shell grid gap-10 py-14 sm:py-20 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
        <p class="eyebrow text-accent">{{ t('home.manifestoEyebrow') }}</p>
        <div>
          <h2 class="whitespace-pre-line font-display text-[clamp(2.6rem,6vw,6rem)] leading-[0.88] tracking-[-0.08em]">{{ t('home.manifestoTitle') }}</h2>
          <p class="mt-8 max-w-2xl text-base leading-relaxed text-paper/75 sm:text-lg">{{ t('home.manifestoText') }}</p>
          <NuxtLink :to="localePath('/about')" class="mt-8 inline-flex border-[3px] border-paper px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.1em] hover:bg-accent hover:text-ink" @click="track('navigate-about', { source: 'home-manifesto' })">{{ t('nav.about') }} <span aria-hidden="true" class="ml-3">↗</span></NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
