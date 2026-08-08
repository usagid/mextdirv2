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
const structureOptions = computed<VirtualSelectOption[]>(() => [
  { value: '', label: t('filters.any') },
  { value: '木造', label: '木造' },
  { value: '鉄筋コンクリート造', label: '鉄筋コンクリート造' },
])

watch(() => props.modelValue, (value) => {
  Object.assign(local, value)
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
    prefecture: '', city: '', keyword: '', facilityType: '', structure: '', floorAreaMin: '', floorAreaMax: '',
  })
  update()
  emit('reset')
}
</script>

<template>
  <aside class="border-[3px] border-ink bg-accent p-4 shadow-brutal sm:p-5">
    <div class="mb-5 flex items-baseline justify-between gap-4 border-b-[3px] border-ink pb-3">
      <h2 class="font-display text-2xl uppercase leading-none tracking-[-0.06em]">{{ t('filters.title') }}</h2>
      <span class="font-mono text-[10px] font-bold uppercase">01—07</span>
    </div>

    <form class="grid gap-4" @submit.prevent="submit">
      <div class="grid gap-1.5">
        <span class="eyebrow">{{ t('filters.prefecture') }}</span>
        <VirtualSelect v-model="local.prefecture" :options="prefectureOptions" :placeholder="t('filters.any')" :aria-label="t('filters.prefecture')" />
      </div>

      <label class="grid gap-1.5">
        <span class="eyebrow">{{ t('filters.city') }}</span>
        <input v-model="local.city" class="brutal-input" type="search" :placeholder="t('hero.cityPlaceholder')">
      </label>

      <label class="grid gap-1.5">
        <span class="eyebrow">{{ t('filters.keyword') }}</span>
        <input v-model="local.keyword" class="brutal-input" type="search" :placeholder="t('hero.keywordPlaceholder')">
      </label>

      <label class="grid gap-1.5">
        <span class="eyebrow">{{ t('filters.facilityType') }}</span>
        <input v-model="local.facilityType" class="brutal-input" type="text" placeholder="小学校 / 体育館">
      </label>

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

      <div class="grid grid-cols-2 gap-2 pt-1">
        <button type="submit" class="brutal-button col-span-2">{{ t('filters.apply') }}</button>
        <button type="button" class="border-[3px] border-ink bg-paper px-3 py-2 font-mono text-xs font-bold uppercase hover:bg-white" @click="reset">{{ t('filters.clear') }}</button>
        <span class="flex items-center justify-end font-mono text-[10px] font-bold uppercase">㎡ = m²</span>
      </div>
    </form>
  </aside>
</template>
