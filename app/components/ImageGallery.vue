<script setup lang="ts">
import type { SchoolImage } from '../../shared/types/school'

const props = defineProps<{
  images: SchoolImage[]
  schoolName: string
}>()

const { t } = useI18n()
const currentIndex = ref(0)

watch(() => props.images, () => {
  currentIndex.value = 0
})

const currentImage = computed(() => props.images[currentIndex.value])
const mainSource = computed(() => currentImage.value?.url || '/uploads/school-placeholder.svg')
const mainAlt = computed(() => currentImage.value?.altText || t('images.fallback', { name: props.schoolName, number: currentIndex.value + 1 }))
</script>

<template>
  <section :aria-label="t('images.gallery')">
    <div class="brutal-panel aspect-[4/3] overflow-hidden bg-sky sm:aspect-[16/10]">
      <NuxtImg :src="mainSource" :alt="mainAlt" width="1600" height="1000" sizes="sm:100vw lg:70vw" class="h-full w-full object-cover" loading="eager" />
    </div>
    <div v-if="images.length" class="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
      <button
        v-for="(image, index) in images"
        :key="image.id"
        type="button"
        class="aspect-square overflow-hidden border-[3px] border-ink bg-paper"
        :class="index === currentIndex ? 'bg-accent shadow-[3px_3px_0_#111]' : 'opacity-65 hover:opacity-100'"
        :aria-label="t('images.thumbnail', { number: index + 1 })"
        :aria-pressed="index === currentIndex"
        data-umami-event="select-gallery-image"
        :data-umami-event-image="String(index + 1)"
        @click="currentIndex = index"
      >
        <NuxtImg :src="image.url" :alt="image.altText || t('images.fallback', { name: schoolName, number: index + 1 })" width="240" height="180" class="h-full w-full object-cover" />
      </button>
    </div>
    <p v-else class="mt-3 font-mono text-xs uppercase text-ink/60">{{ t('images.noImages') }}</p>
  </section>
</template>
