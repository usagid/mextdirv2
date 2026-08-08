<script setup lang="ts">
import type { School } from '../../shared/types/school'

type Spec = { label: string; value: string | number; date?: boolean }

const props = defineProps<{ school: School }>()
const { t } = useI18n()

const specs = computed<Spec[]>(() => [
  { label: t('fields.prefecture'), value: props.school.prefecture },
  { label: t('fields.city'), value: props.school.city },
  { label: t('fields.schoolName'), value: props.school.schoolName },
  { label: t('fields.address'), value: props.school.address },
  { label: t('fields.closestPoi'), value: props.school.closestPoi },
  { label: t('fields.lister'), value: props.school.lister },
  { label: t('fields.phoneNumber'), value: props.school.phoneNumber },
  { label: t('fields.additionalContact'), value: props.school.additionalContact },
  { label: t('fields.zoningInfo'), value: props.school.zoningInfo },
  { label: t('fields.landInfo'), value: props.school.landInfo },
  { label: t('fields.structureInfo'), value: props.school.structureInfo },
  { label: t('fields.completionInfo'), value: props.school.completionInfo },
  { label: t('fields.facilityInfo'), value: props.school.facilityInfo },
  { label: t('fields.buildingArea'), value: `${props.school.buildingArea.toLocaleString()}㎡` },
  { label: t('fields.floorArea'), value: `${props.school.floorArea.toLocaleString()}㎡` },
  { label: t('fields.floorNum'), value: `${props.school.floorNum} ${t('units.floors')}` },
  { label: t('fields.recruitment'), value: props.school.recruitment },
  { label: t('fields.conditions'), value: props.school.conditions },
  { label: t('fields.remarks'), value: props.school.remarks },
  { label: t('fields.createdAt'), value: props.school.createdAt, date: true },
  { label: t('fields.updatedAt'), value: props.school.updatedAt, date: true },
])
</script>

<template>
  <dl class="grid border-l-[3px] border-t-[3px] border-ink sm:grid-cols-2">
    <div v-for="spec in specs" :key="spec.label" class="grid grid-cols-[minmax(7rem,34%)_1fr] border-b-[3px] border-r-[3px] border-ink sm:grid-cols-[minmax(8rem,38%)_1fr]">
      <dt class="bg-ink p-3 font-mono text-[10px] font-bold uppercase leading-tight tracking-[0.08em] text-paper">{{ spec.label }}</dt>
      <dd class="break-words bg-paper p-3 text-sm leading-relaxed">{{ spec.date ? '' : (spec.value || '—') }}<NuxtTime v-if="spec.date" :datetime="String(spec.value)" year="numeric" month="2-digit" day="2-digit" /></dd>
    </div>
  </dl>
</template>
