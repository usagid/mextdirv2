<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

export interface VirtualSelectOption {
  value: string
  label: string
  count?: number
}

const props = withDefaults(defineProps<{
  modelValue: string
  options: VirtualSelectOption[]
  placeholder: string
  ariaLabel?: string
  disabled?: boolean
}>(), {
  ariaLabel: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const id = useId()
const root = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const activeIndex = ref(0)

const selectedOption = computed(() => props.options.find(option => option.value === props.modelValue))

function optionId(index: number) {
  return `${id}-option-${index}`
}

function syncActiveIndex() {
  const selectedIndex = props.options.findIndex(option => option.value === props.modelValue)
  activeIndex.value = selectedIndex >= 0 ? selectedIndex : 0
}

function open() {
  if (props.disabled) return
  syncActiveIndex()
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function toggle() {
  if (isOpen.value) close()
  else open()
}

function choose(option: VirtualSelectOption) {
  if (props.disabled) return
  emit('update:modelValue', option.value)
  close()
}

function moveActive(direction: 1 | -1) {
  if (!props.options.length) return
  const next = activeIndex.value + direction
  activeIndex.value = next < 0 ? props.options.length - 1 : next % props.options.length
}

function handleKeydown(event: KeyboardEvent) {
  if (props.disabled) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }

  if (!isOpen.value && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
    event.preventDefault()
    open()
    return
  }

  if (!isOpen.value) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveActive(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveActive(-1)
  } else if (event.key === 'Home') {
    event.preventDefault()
    activeIndex.value = 0
  } else if (event.key === 'End') {
    event.preventDefault()
    activeIndex.value = Math.max(0, props.options.length - 1)
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    const option = props.options[activeIndex.value]
    if (option) choose(option)
  }
}

function handleDocumentClick(event: MouseEvent) {
  if (isOpen.value && !root.value?.contains(event.target as Node)) close()
}

watch(() => props.modelValue, syncActiveIndex)
watch(() => props.disabled, (disabled) => {
  if (disabled) close()
})

onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))
</script>

<template>
  <div ref="root" class="relative" @keydown="handleKeydown">
    <button
      type="button"
      role="combobox"
      :disabled="disabled"
      class="brutal-input flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
      :aria-label="ariaLabel || placeholder"
      :aria-disabled="disabled"
      :aria-controls="`${id}-listbox`"
      :aria-expanded="isOpen"
      :aria-activedescendant="isOpen ? optionId(activeIndex) : undefined"
      @click="toggle"
    >
      <span class="min-w-0 truncate" :class="selectedOption ? 'font-bold' : 'text-ink/60'">{{ selectedOption?.label || placeholder }}</span>
      <span aria-hidden="true" class="shrink-0 border-l-2 border-ink pl-3 font-mono text-lg leading-none">{{ isOpen ? '−' : '+' }}</span>
    </button>

    <div
      v-if="isOpen"
      :id="`${id}-listbox`"
      role="listbox"
      class="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto border-[3px] border-ink bg-paper shadow-brutal"
    >
      <button
        v-for="(option, index) in options"
        :id="optionId(index)"
        :key="option.value"
        type="button"
        role="option"
        class="flex w-full items-center justify-between gap-3 border-b-2 border-ink px-3 py-3 text-left text-sm last:border-b-0 hover:bg-accent"
        :class="index === activeIndex ? 'bg-accent' : ''"
        :aria-selected="option.value === modelValue"
        @mouseenter="activeIndex = index"
        @click="choose(option)"
      >
        <span class="truncate">{{ option.label }}</span>
        <span v-if="option.count !== undefined" class="shrink-0 border-2 border-ink bg-ink px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-paper">{{ option.count }}</span>
      </button>
    </div>
  </div>
</template>
