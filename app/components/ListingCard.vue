<script setup lang="ts">
import type { School } from '../../shared/types/school'

const props = defineProps<{ school: School }>()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const { track } = useUmami()

const image = computed(() => props.school.images[0]?.url || '/uploads/school-placeholder.svg')
const floorArea = computed(() => new Intl.NumberFormat(locale.value).format(props.school.floorArea))
</script>

<template>
  <article class="group flex h-full flex-col border-[3px] border-ink bg-paper shadow-brutal transition-transform duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg">
    <NuxtLink
      :to="localePath(`/schools/${school.id}`)"
      class="flex h-full flex-col"
      :aria-label="`${school.schoolName} — ${t('card.viewDetails')}`"
      @click="track('view-listing', { school: school.schoolName, prefecture: school.prefecture })"
    >
      <div class="relative aspect-[4/3] overflow-hidden border-b-[3px] border-ink bg-sky">
        <NuxtImg :src="image" :alt="school.images[0]?.altText || school.schoolName" width="900" height="675" sizes="sm:100vw md:50vw lg:33vw" class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        <span class="absolute left-3 top-3 border-[2px] border-ink bg-accent px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] shadow-[3px_3px_0_#111]">{{ t('card.open') }}</span>
      </div>
      <div class="flex flex-1 flex-col p-4 sm:p-5">
        <p class="eyebrow text-ink/60">{{ school.prefecture }} / {{ school.city }}</p>
        <h2 class="mt-2 font-display text-2xl leading-none tracking-[-0.06em] sm:text-3xl">{{ school.schoolName }}</h2>
        <p class="mt-3 line-clamp-2 text-sm leading-relaxed text-ink/75">{{ school.address }}</p>
        <div class="mt-auto grid grid-cols-2 gap-2 border-t-2 border-ink pt-4 font-mono text-xs font-bold uppercase">
          <span>{{ t('card.area', { area: floorArea }) }}</span>
          <span class="text-right">{{ t('card.floors', { count: school.floorNum }) }}</span>
        </div>
        <div class="mt-4 flex items-center justify-between border-t-2 border-ink pt-3 font-mono text-[10px] font-bold uppercase tracking-[0.1em]">
          <span>{{ t('card.viewDetails') }}</span>
          <span aria-hidden="true" class="text-xl leading-none transition-transform group-hover:translate-x-1">→</span>
        </div>
      </div>
    </NuxtLink>
  </article>
</template>
