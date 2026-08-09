<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { track } = useUmami()
const isMenuOpen = ref(false)

const links = computed(() => [
  { label: t('nav.home'), to: localePath('/'), event: 'navigate-home' },
  { label: t('nav.listings'), to: localePath('/schools'), event: 'navigate-listings' },
  { label: t('nav.about'), to: localePath('/about'), event: 'navigate-about' },
])

function closeMenu() {
  isMenuOpen.value = false
}
</script>

<template>
  <header class="border-b-[3px] border-ink bg-paper">
    <div class="page-shell flex min-h-[76px] items-center justify-between gap-6">
      <NuxtLink :to="localePath('/')" class="group flex items-center gap-3" @click="closeMenu(); track('navigate-home')">
        <span class="border-[3px] border-ink bg-accent px-2 py-1 font-display text-2xl leading-none tracking-[-0.08em] shadow-[3px_3px_0_#111] transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none">mextdir</span>
        <span class="hidden font-mono text-[10px] font-bold uppercase tracking-[0.14em] sm:inline">{{ $t('site.tagline') }}</span>
      </NuxtLink>

      <nav class="hidden items-center gap-6 md:flex" aria-label="Primary">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="font-mono text-xs font-bold uppercase tracking-[0.12em] underline-offset-4 hover:bg-accent hover:underline"
          active-class="bg-accent"
          @click="track(link.event)"
        >
          {{ link.label }}
        </NuxtLink>
        <LanguageSwitcher />
      </nav>

      <button
        type="button"
        class="border-[3px] border-ink bg-accent px-3 py-2 font-mono text-xs font-bold uppercase shadow-[3px_3px_0_#111] md:hidden"
        :aria-expanded="isMenuOpen"
        aria-controls="mobile-navigation"
        data-umami-event="toggle-mobile-menu"
        @click="isMenuOpen = !isMenuOpen"
      >
        {{ isMenuOpen ? '×' : 'menu' }}
      </button>
    </div>

    <div v-if="isMenuOpen" id="mobile-navigation" class="border-t-[3px] border-ink bg-accent md:hidden">
      <nav class="page-shell grid gap-0 py-2" aria-label="Mobile">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="border-b-2 border-ink py-3 font-mono text-sm font-bold uppercase tracking-[0.12em] last:border-b-0"
          @click="closeMenu(); track(link.event)"
        >
          {{ link.label }}
        </NuxtLink>
        <div class="pt-4">
          <LanguageSwitcher />
        </div>
      </nav>
    </div>
  </header>
</template>
