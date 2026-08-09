<template>
  <div class="min-h-screen bg-paper text-ink">
    <a href="#admin-main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-accent focus:px-4 focus:py-3 focus:font-bold focus:shadow-brutal">Skip to content</a>
    <header class="border-b-[3px] border-ink bg-ink text-paper">
      <div class="page-shell flex min-h-[72px] items-center justify-between gap-4">
        <NuxtLink to="/admin" class="bg-accent px-2 py-1 font-display text-2xl leading-none tracking-[-0.08em] text-ink">mextdir / admin</NuxtLink>
        <NuxtLink to="/ja/" class="font-mono text-xs font-bold uppercase underline underline-offset-4 hover:bg-accent hover:text-ink">Public site ↗</NuxtLink>
      </div>
    </header>
    <main id="admin-main" class="page-shell py-8 sm:py-12">
      <slot />
    </main>
  </div>
</template>
