<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  closeLabel?: string
}>(), {
  title: '',
  closeLabel: 'Close',
})

const emit = defineEmits<{
  'update:open': [open: boolean]
}>()

const id = useId()
const dialog = ref<HTMLElement | null>(null)
let restoreFocus: HTMLElement | null = null
let previousOverflow = ''

function close() {
  emit('update:open', false)
}

function focusableElements() {
  return Array.from(dialog.value?.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
  ) || [])
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.open) return

  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }

  if (event.key !== 'Tab') return
  const elements = focusableElements()
  if (!elements.length) {
    event.preventDefault()
    dialog.value?.focus()
    return
  }

  const first = elements[0]
  const last = elements[elements.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) close()
}

watch(() => props.open, async (open) => {
  if (!import.meta.client) return

  if (open) {
    restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick()
    focusableElements()[0]?.focus() || dialog.value?.focus()
    return
  }

  document.body.style.overflow = previousOverflow
  restoreFocus?.focus()
  restoreFocus = null
})

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (props.open) document.body.style.overflow = previousOverflow
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.open"
      class="fixed inset-0 z-[100] grid place-items-center bg-ink/80 p-4"
      @click="handleBackdropClick"
    >
      <section
        ref="dialog"
        class="brutal-panel max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto bg-paper p-6 shadow-[8px_8px_0_#111] sm:p-8"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="props.title ? `${id}-title` : undefined"
        tabindex="-1"
      >
        <div class="flex items-start justify-between gap-5 border-b-[3px] border-ink pb-4">
          <h2 v-if="props.title" :id="`${id}-title`" class="font-display text-3xl uppercase leading-none tracking-[-0.06em]">
            {{ props.title }}
          </h2>
          <button
            type="button"
            class="brutal-button ml-auto shrink-0 px-2 py-1 text-lg leading-none shadow-[2px_2px_0_#111]"
            :aria-label="props.closeLabel"
            @click="close"
          >
            ×
          </button>
        </div>

        <div class="pt-5 text-base leading-relaxed">
          <slot />
        </div>

        <div v-if="$slots.actions" class="mt-6 flex flex-wrap justify-end gap-3 border-t-[3px] border-ink pt-5">
          <slot name="actions" />
        </div>
      </section>
    </div>
  </Teleport>
</template>
