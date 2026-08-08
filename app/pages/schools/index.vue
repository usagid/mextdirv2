<script setup lang="ts">
import type { SchoolListResponse } from '../../../shared/types/school'
import type { PrefectureOption } from '../../../shared/types/prefecture'
import type { SchoolFilterModel } from '../../components/FilterPanel.vue'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()

function valueOf(value: unknown) {
  return Array.isArray(value) ? String(value[0] || '') : String(value || '')
}

function filtersFromRoute(): SchoolFilterModel {
  return {
    prefecture: valueOf(route.query.prefecture),
    city: valueOf(route.query.city),
    keyword: valueOf(route.query.keyword),
    facilityType: valueOf(route.query.facilityType),
    structure: valueOf(route.query.structure),
    floorAreaMin: valueOf(route.query.floorAreaMin),
    floorAreaMax: valueOf(route.query.floorAreaMax),
  }
}

const filters = reactive<SchoolFilterModel>(filtersFromRoute())
const sort = ref(valueOf(route.query.sort) || 'newest')
const prefectures = ref<PrefectureOption[]>([])

const { data: prefectureData } = await useFetch<PrefectureOption[]>('/api/prefectures', { default: () => [] })
prefectures.value = prefectureData.value || []

const sortOptions = computed(() => [
  { value: 'newest', label: t('listings.newest') },
  { value: 'oldest', label: t('listings.oldest') },
  { value: 'floor-desc', label: t('listings.floorDesc') },
  { value: 'floor-asc', label: t('listings.floorAsc') },
])

const requestQuery = computed(() => ({
  ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
  sort: sort.value,
  page: valueOf(route.query.page) || '1',
}))

const { data, pending, error } = await useFetch<SchoolListResponse>('/api/schools', {
  query: requestQuery,
  default: () => ({ items: [], total: 0, page: 1, pageSize: 9, totalPages: 1 }),
})

watch(() => route.query, () => {
  Object.assign(filters, filtersFromRoute())
  sort.value = valueOf(route.query.sort) || 'newest'
}, { deep: true })

function queryFromFilters() {
  return {
    ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
    ...(sort.value !== 'newest' ? { sort: sort.value } : {}),
  }
}

function updateFilters(value: SchoolFilterModel) {
  Object.assign(filters, value)
}

function applyFilters() {
  router.push({ query: { ...queryFromFilters(), page: undefined } })
}

function resetFilters() {
  sort.value = 'newest'
  router.push({ query: {} })
}

function changeSort() {
  router.push({ query: { ...queryFromFilters(), sort: sort.value !== 'newest' ? sort.value : undefined, page: undefined } })
}

function changePage(page: number) {
  router.push({ query: { ...queryFromFilters(), sort: sort.value !== 'newest' ? sort.value : undefined, page: String(page) } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

useHead(() => ({ title: `mextdir — ${t('listings.title')}` }))
</script>

<template>
  <div class="page-shell py-10 sm:py-16">
    <header class="mb-10 border-b-[3px] border-ink pb-7">
      <p class="eyebrow">{{ t('listings.eyebrow') }}</p>
      <div class="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <h1 class="section-title">{{ t('listings.title') }}</h1>
          <p class="mt-4 max-w-xl text-sm leading-relaxed text-ink/70 sm:text-base">{{ t('listings.subtitle') }}</p>
        </div>
        <div class="font-mono text-sm font-bold uppercase">{{ t('listings.count', { count: data?.total || 0 }) }}</div>
      </div>
    </header>

    <div class="grid gap-10 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
      <FilterPanel :model-value="filters" :prefectures="prefectures" @update:model-value="updateFilters" @submit="applyFilters" @reset="resetFilters" />

      <section aria-live="polite">
        <div class="mb-5 flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-ink pb-4">
          <p class="eyebrow">{{ t('listings.count', { count: data?.total || 0 }) }}</p>
          <div class="flex items-center gap-2 font-mono text-xs font-bold uppercase">
            <span>{{ t('listings.sort') }}</span>
            <VirtualSelect v-model="sort" :options="sortOptions" :placeholder="t('listings.newest')" :aria-label="t('listings.sort')" @update:model-value="changeSort" />
          </div>
        </div>

        <div v-if="pending" class="grid gap-5 md:grid-cols-2">
          <div v-for="slot in 6" :key="slot" class="aspect-[4/3] animate-pulse border-[3px] border-ink bg-ink/10" />
        </div>
        <div v-else-if="error" class="brutal-panel bg-tomato p-6 font-mono text-sm font-bold uppercase">{{ error.message }}</div>
        <div v-else-if="!data?.items.length" class="brutal-panel bg-accent p-8 text-center">
          <p class="font-display text-3xl uppercase leading-none tracking-[-0.06em]">{{ t('listings.noResults') }}</p>
          <button type="button" class="mt-6 border-[3px] border-ink bg-paper px-4 py-3 font-mono text-xs font-bold uppercase hover:bg-white" @click="resetFilters">{{ t('listings.reset') }}</button>
        </div>
        <div v-else class="grid gap-5 md:grid-cols-2">
          <ListingCard v-for="school in data.items" :key="school.id" :school="school" />
        </div>

        <nav v-if="data && data.totalPages > 1" class="mt-10 flex items-center justify-between border-t-[3px] border-ink pt-5" :aria-label="t('listings.title')">
          <button type="button" class="border-[3px] border-ink bg-paper px-3 py-2 font-mono text-xs font-bold uppercase disabled:cursor-not-allowed disabled:opacity-40 hover:bg-accent" :disabled="data.page <= 1" @click="changePage(data.page - 1)">{{ t('listings.previous') }}</button>
          <span class="font-mono text-xs font-bold uppercase">{{ t('listings.page', { page: data.page, totalPages: data.totalPages }) }}</span>
          <button type="button" class="border-[3px] border-ink bg-paper px-3 py-2 font-mono text-xs font-bold uppercase disabled:cursor-not-allowed disabled:opacity-40 hover:bg-accent" :disabled="data.page >= data.totalPages" @click="changePage(data.page + 1)">{{ t('listings.next') }}</button>
        </nav>
      </section>
    </div>
  </div>
</template>
