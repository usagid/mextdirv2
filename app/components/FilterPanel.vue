<script setup lang="ts">
import type { VirtualSelectOption } from './VirtualSelect.vue'
import type { PrefectureOption } from '../../shared/types/prefecture'

export interface SchoolFilterModel {
  prefecture: string
  city: string
  keyword: string
  facilityType: string
  structure: string
  floorAreaMin: string
  floorAreaMax: string
  buildingAreaMin: string
  buildingAreaMax: string
  floorNumMin: string
  floorNumMax: string
}

const props = defineProps<{
  modelValue: SchoolFilterModel
  prefectures: PrefectureOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SchoolFilterModel]
  submit: []
  reset: []
}>()

const { t } = useI18n()
const local = reactive<SchoolFilterModel>({ ...props.modelValue })
const prefectureOptions = computed<VirtualSelectOption[]>(() => [
  { value: '', label: t('filters.any') },
  ...props.prefectures.map(prefecture => ({
    value: prefecture.name,
    label: prefecture.name,
    count: prefecture.count,
  })),
])
const facilityOptions = computed<VirtualSelectOption[]>(() => [
  { value: '', label: t('filters.any') },
  { value: 'school-building', label: t('filters.facilitySchool') },
  { value: 'gym', label: t('filters.facilityGym') },
  { value: 'pool', label: t('filters.facilityPool') },
  { value: 'field', label: t('filters.facilityField') },
  { value: 'residence', label: t('filters.facilityResidence') },
])
const structureOptions = computed<VirtualSelectOption[]>(() => [
  { value: '', label: t('filters.any') },
  { value: 'wood', label: t('filters.structureWood') },
  { value: 'concrete', label: t('filters.structureConcrete') },
  { value: 'steel', label: t('filters.structureSteel') },
])
const selectedPrefecture = computed({
  get: () => local.prefecture,
  set: (value: string) => {
    if (value !== local.prefecture) local.city = ''
    local.prefecture = value
  },
})
const { data: cities } = await useFetch<string[]>('/api/cities', {
  query: computed(() => ({ prefecture: local.prefecture || undefined })),
  default: () => [],
})
const cityOptions = computed<VirtualSelectOption[]>(() => [
  { value: '', label: t('filters.any') },
  ...(cities.value || []).map(city => ({ value: city, label: city })),
])

watch(() => props.modelValue, (value) => {
  Object.assign(local, { ...value, city: value.prefecture ? value.city : '' })
}, { deep: true })

function update() {
  emit('update:modelValue', { ...local })
}

function submit() {
  update()
  emit('submit')
}

function reset() {
  Object.assign(local, {
    prefecture: '', city: '', keyword: '', facilityType: '', structure: '', floorAreaMin: '', floorAreaMax: '', buildingAreaMin: '', buildingAreaMax: '', floorNumMin: '', floorNumMax: '',
  })
  update()
  emit('reset')
}
</script>

<template>
  <aside class="border-[3px] border-ink bg-accent p-4 shadow-brutal sm:p-5">
    <div class="mb-5 flex items-baseline justify-between gap-4 border-b-[3px] border-ink pb-3">
      <h2 class="font-display text-2xl uppercase leading-none tracking-[-0.06em]">{{ t('filters.title') }}</h2>
      <span class="font-mono text-[10px] font-bold uppercase">01—08</span>
    </div>

    <form class="grid gap-4" @submit.prevent="submit">
      <div class="grid gap-1.5">
        <span class="eyebrow">{{ t('filters.prefecture') }}</span>
        <VirtualSelect v-model="selectedPrefecture" :options="prefectureOptions" :placeholder="t('filters.any')" :aria-label="t('filters.prefecture')" />
      </div>

      <div class="grid gap-1.5">
        <span class="eyebrow">{{ t('filters.city') }}</span>
        <VirtualSelect v-model="local.city" :options="cityOptions" :placeholder="t('filters.any')" :aria-label="t('filters.city')" :disabled="!local.prefecture" />
      </div>

      <label class="grid gap-1.5">
        <span class="eyebrow">{{ t('filters.keyword') }}</span>
        <input v-model="local.keyword" class="brutal-input" type="search" :placeholder="t('hero.keywordPlaceholder')">
      </label>

      <div class="grid gap-1.5">
        <span class="eyebrow">{{ t('filters.facilityType') }}</span>
        <VirtualSelect v-model="local.facilityType" :options="facilityOptions" :placeholder="t('filters.any')" :aria-label="t('filters.facilityType')" />
      </div>

      <div class="grid gap-1.5">
        <span class="eyebrow">{{ t('filters.structure') }}</span>
        <VirtualSelect v-model="local.structure" :options="structureOptions" :placeholder="t('filters.any')" :aria-label="t('filters.structure')" />
      </div>

      <fieldset class="grid gap-1.5">
        <legend class="eyebrow">{{ t('filters.floorArea') }}</legend>
        <div class="grid grid-cols-2 gap-2">
          <input v-model="local.floorAreaMin" class="brutal-input" type="number" min="0" :placeholder="t('filters.floorAreaMin')" :aria-label="t('filters.floorAreaMin')">
          <input v-model="local.floorAreaMax" class="brutal-input" type="number" min="0" :placeholder="t('filters.floorAreaMax')" :aria-label="t('filters.floorAreaMax')">
        </div>
      </fieldset>

      <fieldset class="grid gap-1.5">
        <legend class="eyebrow">{{ t('filters.buildingArea') }}</legend>
        <div class="grid grid-cols-2 gap-2">
          <input v-model="local.buildingAreaMin" class="brutal-input" type="number" min="0" :placeholder="t('filters.buildingAreaMin')" :aria-label="t('filters.buildingAreaMin')">
          <input v-model="local.buildingAreaMax" class="brutal-input" type="number" min="0" :placeholder="t('filters.buildingAreaMax')" :aria-label="t('filters.buildingAreaMax')">
        </div>
      </fieldset>

      <fieldset class="grid gap-1.5">
        <legend class="eyebrow">{{ t('filters.floorNum') }}</legend>
        <div class="grid grid-cols-2 gap-2">
          <input v-model="local.floorNumMin" class="brutal-input" type="number" min="0" :placeholder="t('filters.floorNumMin')" :aria-label="t('filters.floorNumMin')">
          <input v-model="local.floorNumMax" class="brutal-input" type="number" min="0" :placeholder="t('filters.floorNumMax')" :aria-label="t('filters.floorNumMax')">
        </div>
      </fieldset>

      <div class="grid grid-cols-2 gap-2 pt-1">
        <button type="submit" class="brutal-button col-span-2" data-umami-event="apply-filters">{{ t('filters.apply') }}</button>
        <button type="button" class="border-[3px] border-ink bg-paper px-3 py-2 font-mono text-xs font-bold uppercase hover:bg-white" data-umami-event="reset-filters" @click="reset">{{ t('filters.clear') }}</button>
        <span class="flex items-center justify-end font-mono text-[10px] font-bold uppercase">㎡ = m²</span>
      </div>
    </form>
  </aside>
</template>
