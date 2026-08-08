<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

useHead(() => ({ title: `mextdir — ${t('nav.about')}` }))
</script>

<template>
  <div>
    <section class="border-b-[3px] border-ink bg-accent">
      <div class="page-shell grid gap-10 py-14 sm:py-24 lg:grid-cols-[0.6fr_1.4fr] lg:gap-20 lg:py-32">
        <p class="eyebrow">{{ t('about.eyebrow') }}</p>
        <div>
          <h1 class="whitespace-pre-line font-display text-[clamp(3.5rem,9vw,9rem)] leading-[0.82] tracking-[-0.1em]">{{ t('about.title') }}</h1>
          <p class="mt-10 max-w-2xl text-lg leading-relaxed sm:text-xl">{{ t('about.body') }}</p>
        </div>
      </div>
    </section>

    <section class="page-shell py-16 sm:py-24">
      <div class="mb-10 border-b-[3px] border-ink pb-5">
        <p class="eyebrow">mextdir / 03</p>
        <h2 class="section-title mt-3">{{ t('about.howTitle') }}</h2>
      </div>
      <div class="grid gap-5 md:grid-cols-3">
        <article class="border-[3px] border-ink bg-sky p-6 shadow-brutal">
          <span class="font-mono text-5xl font-bold">01</span>
          <h3 class="mt-16 font-display text-3xl uppercase leading-none tracking-[-0.06em]">{{ t('about.stepOne') }}</h3>
          <p class="mt-5 leading-relaxed">{{ t('about.stepOneText') }}</p>
        </article>
        <article class="border-[3px] border-ink bg-moss p-6 shadow-brutal">
          <span class="font-mono text-5xl font-bold">02</span>
          <h3 class="mt-16 font-display text-3xl uppercase leading-none tracking-[-0.06em]">{{ t('about.stepTwo') }}</h3>
          <p class="mt-5 leading-relaxed">{{ t('about.stepTwoText') }}</p>
        </article>
        <article class="border-[3px] border-ink bg-paper p-6 shadow-brutal">
          <span class="font-mono text-5xl font-bold">03</span>
          <h3 class="mt-16 font-display text-3xl uppercase leading-none tracking-[-0.06em]">{{ t('about.stepThree') }}</h3>
          <p class="mt-5 leading-relaxed">{{ t('about.stepThreeText') }}</p>
        </article>
      </div>
    </section>

    <section class="border-y-[3px] border-ink bg-ink py-12 text-paper sm:py-16">
      <div class="page-shell flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <p class="max-w-xl font-display text-3xl leading-none tracking-[-0.06em] sm:text-5xl">{{ t('hero.browse') }}</p>
        <NuxtLink :to="localePath('/schools')" class="brutal-button text-ink">{{ t('nav.listings') }} <span aria-hidden="true" class="ml-3">→</span></NuxtLink>
      </div>
    </section>
  </div>
</template>
