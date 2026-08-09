<script setup lang="ts">
import type { AdminApiKey, AdminBlock, AdminRole, AdminSessionResponse, AdminUser } from '../../../shared/types/admin'
import type { School, SchoolImage } from '../../../shared/types/school'
import type { VirtualSelectOption } from '../../components/VirtualSelect.vue'

defineI18nRoute(false)
definePageMeta({ layout: 'admin' })

const { data: session, error: sessionError } = await useFetch<AdminSessionResponse>('/api/admin/session')
if (sessionError.value || !session.value) await navigateTo('/admin/login')

const currentUser = computed(() => session.value?.user)
const isAdmin = computed(() => currentUser.value?.role === 'ADMIN')
const notice = ref('')
const errorMessage = ref('')

function showNotice(message: string) {
  notice.value = message
  errorMessage.value = ''
}

function showError(error: any) {
  errorMessage.value = error?.data?.statusMessage || error?.message || 'Request failed'
  notice.value = ''
}

type SchoolForm = Omit<School, 'id' | 'images' | 'createdAt' | 'updatedAt'>

function emptySchool(): SchoolForm {
  return {
    prefecture: '', city: '', schoolName: '', address: '', closestPoi: '', lister: '',
    phoneNumber: '', additionalContact: '', zoningInfo: '', landInfo: '', structureInfo: '',
    completionInfo: '', facilityInfo: '', buildingArea: 0, floorArea: 0, floorNum: 0,
    recruitment: '', conditions: '', remarks: '',
  }
}

function schoolFormFrom(school: School): SchoolForm {
  return {
    prefecture: school.prefecture, city: school.city, schoolName: school.schoolName,
    address: school.address, closestPoi: school.closestPoi, lister: school.lister,
    phoneNumber: school.phoneNumber, additionalContact: school.additionalContact,
    zoningInfo: school.zoningInfo, landInfo: school.landInfo, structureInfo: school.structureInfo,
    completionInfo: school.completionInfo, facilityInfo: school.facilityInfo,
    buildingArea: school.buildingArea, floorArea: school.floorArea, floorNum: school.floorNum,
    recruitment: school.recruitment, conditions: school.conditions, remarks: school.remarks,
  }
}

const schoolSearch = ref('')
const selectedSchoolId = ref('')
const schoolForm = reactive<SchoolForm>(emptySchool())
const schoolImages = ref<SchoolImage[]>([])
const imageFile = ref<File | null>(null)
const imageAltText = ref('')
const { data: schoolData, refresh: refreshSchools } = await useFetch<{
  items: School[]
  total: number
}>('/api/admin/schools', {
  query: computed(() => ({ search: schoolSearch.value || undefined })),
  default: () => ({ items: [], total: 0 }),
})
const schools = computed(() => schoolData.value?.items || [])

function startNewSchool() {
  selectedSchoolId.value = ''
  Object.assign(schoolForm, emptySchool())
  schoolImages.value = []
  imageFile.value = null
  imageAltText.value = ''
  showNotice('Ready for a new school')
}

async function editSchool(id: string) {
  try {
    const school = await $fetch<School>(`/api/admin/schools/${id}`)
    selectedSchoolId.value = school.id
    Object.assign(schoolForm, schoolFormFrom(school))
    schoolImages.value = school.images
    imageFile.value = null
    imageAltText.value = ''
    showNotice(`Editing ${school.schoolName}`)
  } catch (error) {
    showError(error)
  }
}

function schoolPayload() {
  return {
    ...schoolForm,
    buildingArea: Number(schoolForm.buildingArea) || 0,
    floorArea: Number(schoolForm.floorArea) || 0,
    floorNum: Number(schoolForm.floorNum) || 0,
  }
}

async function saveSchool() {
  try {
    const school = selectedSchoolId.value
      ? await $fetch<School>(`/api/admin/schools/${selectedSchoolId.value}`, { method: 'PATCH', body: schoolPayload() })
      : await $fetch<School>('/api/schools', { method: 'POST', body: schoolPayload() })
    selectedSchoolId.value = school.id
    Object.assign(schoolForm, schoolFormFrom(school))
    schoolImages.value = school.images
    await refreshSchools()
    showNotice(`Saved ${school.schoolName}`)
  } catch (error) {
    showError(error)
  }
}

async function deleteSchool() {
  if (!selectedSchoolId.value || !window.confirm('Delete this school and its images?')) return
  try {
    await $fetch(`/api/admin/schools/${selectedSchoolId.value}`, { method: 'DELETE' })
    await refreshSchools()
    startNewSchool()
    showNotice('School deleted')
  } catch (error) {
    showError(error)
  }
}

function chooseImage(event: Event) {
  imageFile.value = (event.target as HTMLInputElement).files?.[0] || null
}

async function uploadImage() {
  if (!selectedSchoolId.value || !imageFile.value) return
  try {
    const body = new FormData()
    body.append('files', imageFile.value)
    body.append('altText', imageAltText.value)
    const images = await $fetch<SchoolImage[]>(`/api/schools/${selectedSchoolId.value}/images`, { method: 'POST', body })
    schoolImages.value = [...schoolImages.value, ...images]
    imageFile.value = null
    imageAltText.value = ''
    showNotice('Image uploaded')
  } catch (error) {
    showError(error)
  }
}

const roleOptions: VirtualSelectOption[] = [
  { value: 'EDITOR', label: 'Editor' },
  { value: 'ADMIN', label: 'Administrator' },
]
const newUser = reactive({ username: '', password: '', role: 'EDITOR' as AdminRole })
const users = ref<AdminUser[]>([])
const newApiKey = reactive({ name: '', expiresAt: '' })
const apiKeys = ref<AdminApiKey[]>([])
const revealedApiKey = ref('')
const newBlock = reactive({ ipAddress: '', userAgentContains: '', reason: '' })
const blocks = ref<AdminBlock[]>([])

async function loadSecurityData() {
  if (!isAdmin.value) return
  try {
    const [loadedUsers, loadedKeys, loadedBlocks] = await Promise.all([
      $fetch<AdminUser[]>('/api/admin/users'),
      $fetch<AdminApiKey[]>('/api/admin/api-keys'),
      $fetch<AdminBlock[]>('/api/admin/blocks'),
    ])
    users.value = loadedUsers
    apiKeys.value = loadedKeys
    blocks.value = loadedBlocks
  } catch (error) {
    showError(error)
  }
}

onMounted(loadSecurityData)

async function createUser() {
  try {
    await $fetch('/api/admin/users', { method: 'POST', body: newUser })
    newUser.username = ''
    newUser.password = ''
    newUser.role = 'EDITOR'
    await loadSecurityData()
    showNotice('User created')
  } catch (error) {
    showError(error)
  }
}

async function updateUser(user: AdminUser, value: string | boolean) {
  try {
    const body = typeof value === 'boolean' ? { active: value } : { role: value }
    await $fetch(`/api/admin/users/${user.id}`, { method: 'PATCH', body })
    await loadSecurityData()
    showNotice('User updated')
  } catch (error) {
    showError(error)
  }
}

async function createKey() {
  try {
    const response = await $fetch<{ key: string }>('/api/admin/api-keys', { method: 'POST', body: newApiKey })
    revealedApiKey.value = response.key
    newApiKey.name = ''
    newApiKey.expiresAt = ''
    await loadSecurityData()
    showNotice('API key created. Copy it now; it will not be shown again.')
  } catch (error) {
    showError(error)
  }
}

async function copyApiKey() {
  if (!revealedApiKey.value) return
  await navigator.clipboard.writeText(revealedApiKey.value)
  showNotice('API key copied')
}

async function revokeKey(id: string) {
  if (!window.confirm('Revoke this API key?')) return
  try {
    await $fetch(`/api/admin/api-keys/${id}`, { method: 'DELETE' })
    await loadSecurityData()
    showNotice('API key revoked')
  } catch (error) {
    showError(error)
  }
}

async function createBlock() {
  try {
    await $fetch('/api/admin/blocks', { method: 'POST', body: newBlock })
    newBlock.ipAddress = ''
    newBlock.userAgentContains = ''
    newBlock.reason = ''
    await loadSecurityData()
    showNotice('Contact visibility block added')
  } catch (error) {
    showError(error)
  }
}

async function removeBlock(id: string) {
  try {
    await $fetch(`/api/admin/blocks/${id}`, { method: 'DELETE' })
    await loadSecurityData()
    showNotice('Block disabled')
  } catch (error) {
    showError(error)
  }
}

async function logout() {
  await $fetch('/api/admin/logout', { method: 'POST' })
  await navigateTo('/admin/login')
}

useHead(() => ({ title: 'mextdir — Admin' }))
</script>

<template>
  <div>
    <header class="mb-8 flex flex-col justify-between gap-4 border-b-[3px] border-ink pb-6 sm:flex-row sm:items-end">
      <div>
        <p class="eyebrow">control room / {{ currentUser?.role }}</p>
        <h1 class="mt-3 section-title">Admin dashboard</h1>
      </div>
      <div class="flex items-center gap-3 font-mono text-xs font-bold uppercase">
        <span>{{ currentUser?.username }}</span>
        <button type="button" class="border-[3px] border-ink bg-paper px-3 py-2 hover:bg-accent" @click="logout">Log out</button>
      </div>
    </header>

    <p v-if="notice" class="mb-6 border-[3px] border-ink bg-moss p-3 font-mono text-xs font-bold uppercase">{{ notice }}</p>
    <p v-if="errorMessage" class="mb-6 border-[3px] border-ink bg-tomato p-3 font-mono text-xs font-bold uppercase">{{ errorMessage }}</p>

    <section class="grid gap-8 lg:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)]">
      <div class="border-[3px] border-ink bg-accent p-5 shadow-brutal">
        <div class="mb-5 flex items-end justify-between gap-4 border-b-[3px] border-ink pb-3">
          <div>
            <p class="eyebrow">01 / records</p>
            <h2 class="mt-2 font-display text-3xl uppercase leading-none tracking-[-0.06em]">Schools</h2>
          </div>
          <span class="font-mono text-xs font-bold">{{ schoolData?.total || 0 }}</span>
        </div>
        <div class="mb-4 flex gap-2">
          <input v-model="schoolSearch" class="brutal-input min-w-0 bg-paper py-2" placeholder="Search schools" aria-label="Search schools">
          <button type="button" class="border-[3px] border-ink bg-paper px-3 font-mono text-xs font-bold uppercase hover:bg-white" @click="refreshSchools">Find</button>
        </div>
        <div class="grid max-h-[620px] gap-2 overflow-y-auto pr-1">
          <button
            v-for="school in schools"
            :key="school.id"
            type="button"
            class="border-[3px] border-ink bg-paper p-3 text-left hover:bg-white"
            :class="selectedSchoolId === school.id ? 'bg-white shadow-[3px_3px_0_#111]' : ''"
            @click="editSchool(school.id)"
          >
            <span class="block font-bold">{{ school.schoolName }}</span>
            <span class="mt-1 block font-mono text-[10px] uppercase">{{ school.prefecture }} / {{ school.city }}</span>
          </button>
          <p v-if="!schools.length" class="border-[3px] border-ink bg-paper p-4 font-mono text-xs uppercase">No schools found.</p>
        </div>
        <button type="button" class="brutal-button mt-5 w-full" @click="startNewSchool">+ Add school</button>
      </div>

      <form class="border-[3px] border-ink bg-paper p-5 shadow-brutal sm:p-7" @submit.prevent="saveSchool">
        <div class="mb-6 flex flex-col justify-between gap-3 border-b-[3px] border-ink pb-4 sm:flex-row sm:items-end">
          <div>
            <p class="eyebrow">02 / {{ selectedSchoolId ? 'correction' : 'new record' }}</p>
            <h2 class="mt-2 font-display text-3xl uppercase leading-none tracking-[-0.06em]">{{ selectedSchoolId ? 'Edit school' : 'Add school' }}</h2>
          </div>
          <button v-if="selectedSchoolId" type="button" class="border-[3px] border-ink bg-tomato px-3 py-2 font-mono text-xs font-bold uppercase hover:bg-white" @click="deleteSchool">Delete</button>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="grid gap-1.5"><span class="eyebrow">Prefecture *</span><input v-model="schoolForm.prefecture" class="brutal-input" required></label>
          <label class="grid gap-1.5"><span class="eyebrow">City *</span><input v-model="schoolForm.city" class="brutal-input" required></label>
          <label class="grid gap-1.5 sm:col-span-2"><span class="eyebrow">School name *</span><input v-model="schoolForm.schoolName" class="brutal-input" required></label>
          <label class="grid gap-1.5 sm:col-span-2"><span class="eyebrow">Address *</span><input v-model="schoolForm.address" class="brutal-input" required></label>
          <label class="grid gap-1.5"><span class="eyebrow">Closest point of interest</span><input v-model="schoolForm.closestPoi" class="brutal-input"></label>
          <label class="grid gap-1.5"><span class="eyebrow">Lister *</span><input v-model="schoolForm.lister" class="brutal-input" required></label>
          <label class="grid gap-1.5"><span class="eyebrow">Phone</span><input v-model="schoolForm.phoneNumber" class="brutal-input" type="tel"></label>
          <label class="grid gap-1.5"><span class="eyebrow">Additional contact</span><input v-model="schoolForm.additionalContact" class="brutal-input"></label>
          <label class="grid gap-1.5"><span class="eyebrow">Zoning</span><input v-model="schoolForm.zoningInfo" class="brutal-input"></label>
          <label class="grid gap-1.5"><span class="eyebrow">Land</span><input v-model="schoolForm.landInfo" class="brutal-input"></label>
          <label class="grid gap-1.5"><span class="eyebrow">Structure</span><input v-model="schoolForm.structureInfo" class="brutal-input"></label>
          <label class="grid gap-1.5"><span class="eyebrow">Completion</span><input v-model="schoolForm.completionInfo" class="brutal-input"></label>
          <label class="grid gap-1.5 sm:col-span-2"><span class="eyebrow">Facilities</span><input v-model="schoolForm.facilityInfo" class="brutal-input"></label>
          <label class="grid gap-1.5"><span class="eyebrow">Building area (㎡)</span><input v-model.number="schoolForm.buildingArea" class="brutal-input" type="number" min="0"></label>
          <label class="grid gap-1.5"><span class="eyebrow">Floor area (㎡)</span><input v-model.number="schoolForm.floorArea" class="brutal-input" type="number" min="0"></label>
          <label class="grid gap-1.5"><span class="eyebrow">Floors</span><input v-model.number="schoolForm.floorNum" class="brutal-input" type="number" min="0"></label>
          <label class="grid gap-1.5 sm:col-span-2"><span class="eyebrow">Recruitment</span><textarea v-model="schoolForm.recruitment" class="brutal-input min-h-24"></textarea></label>
          <label class="grid gap-1.5 sm:col-span-2"><span class="eyebrow">Conditions</span><textarea v-model="schoolForm.conditions" class="brutal-input min-h-24"></textarea></label>
          <label class="grid gap-1.5 sm:col-span-2"><span class="eyebrow">Remarks</span><textarea v-model="schoolForm.remarks" class="brutal-input min-h-24"></textarea></label>
        </div>

        <button type="submit" class="brutal-button mt-6 w-full">{{ selectedSchoolId ? 'Save correction' : 'Create school' }}</button>

        <div v-if="selectedSchoolId" class="mt-8 border-t-[3px] border-ink pt-6">
          <p class="eyebrow">Images</p>
          <div v-if="schoolImages.length" class="mt-3 grid gap-2">
            <a v-for="image in schoolImages" :key="image.id" :href="image.url" target="_blank" rel="noreferrer" class="border-[3px] border-ink bg-accent p-2 font-mono text-xs underline">{{ image.altText || image.url }}</a>
          </div>
          <div class="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label class="grid gap-1.5"><span class="eyebrow">File</span><input class="brutal-input px-2 py-2 text-xs" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" @change="chooseImage"></label>
            <label class="grid gap-1.5"><span class="eyebrow">Alt text</span><input v-model="imageAltText" class="brutal-input" placeholder="Optional description"></label>
            <button type="button" class="border-[3px] border-ink bg-accent px-3 py-3 font-mono text-xs font-bold uppercase hover:bg-white" :disabled="!imageFile" @click="uploadImage">Upload</button>
          </div>
        </div>
      </form>
    </section>

    <section v-if="isAdmin" class="mt-10 grid gap-8 border-t-[3px] border-ink pt-10 lg:grid-cols-3">
      <div class="border-[3px] border-ink bg-sky p-5 shadow-brutal">
        <p class="eyebrow">03 / access</p>
        <h2 class="mt-2 font-display text-3xl uppercase leading-none tracking-[-0.06em]">Users</h2>
        <form class="mt-5 grid gap-3" @submit.prevent="createUser">
          <input v-model="newUser.username" class="brutal-input bg-paper" placeholder="Username" autocomplete="off" required>
          <input v-model="newUser.password" class="brutal-input bg-paper" type="password" placeholder="Password (12+ chars)" minlength="12" autocomplete="new-password" required>
          <VirtualSelect v-model="newUser.role" :options="roleOptions" placeholder="Role" aria-label="New user role" />
          <button type="submit" class="border-[3px] border-ink bg-paper px-3 py-3 font-mono text-xs font-bold uppercase hover:bg-white">Create user</button>
        </form>
        <div class="mt-6 grid gap-2 border-t-[3px] border-ink pt-4">
          <div v-for="user in users" :key="user.id" class="border-[3px] border-ink bg-paper p-3">
            <div class="flex items-center justify-between gap-2"><strong>{{ user.username }}</strong><span class="font-mono text-[10px] uppercase">{{ user.role }}</span></div>
            <div class="mt-3 flex items-center justify-between gap-2 font-mono text-[10px] uppercase">
              <span :class="user.active ? 'text-moss' : 'text-tomato'">{{ user.active ? 'active' : 'disabled' }}</span>
              <button v-if="user.id !== currentUser?.id" type="button" class="underline underline-offset-2" @click="updateUser(user, !user.active)">{{ user.active ? 'disable' : 'enable' }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="border-[3px] border-ink bg-moss p-5 shadow-brutal">
        <p class="eyebrow">04 / integrations</p>
        <h2 class="mt-2 font-display text-3xl uppercase leading-none tracking-[-0.06em]">API keys</h2>
        <form class="mt-5 grid gap-3" @submit.prevent="createKey">
          <input v-model="newApiKey.name" class="brutal-input bg-paper" placeholder="Key name" required>
          <label class="grid gap-1.5"><span class="eyebrow">Expires (optional)</span><input v-model="newApiKey.expiresAt" class="brutal-input bg-paper" type="datetime-local"></label>
          <button type="submit" class="border-[3px] border-ink bg-paper px-3 py-3 font-mono text-xs font-bold uppercase hover:bg-white">Create API key</button>
        </form>
        <div v-if="revealedApiKey" class="mt-5 border-[3px] border-ink bg-accent p-3">
          <p class="eyebrow">Copy once</p>
          <input :value="revealedApiKey" readonly class="mt-2 w-full border-[3px] border-ink bg-paper p-2 font-mono text-xs">
          <button type="button" class="mt-3 border-[3px] border-ink bg-paper px-3 py-2 font-mono text-xs font-bold uppercase hover:bg-white" @click="copyApiKey">Copy key</button>
        </div>
        <div class="mt-6 grid gap-2 border-t-[3px] border-ink pt-4">
          <div v-for="key in apiKeys" :key="key.id" class="border-[3px] border-ink bg-paper p-3">
            <div class="flex items-center justify-between gap-2"><strong>{{ key.name }}</strong><span class="font-mono text-xs">{{ key.prefix }}…</span></div>
            <div class="mt-3 flex items-center justify-between gap-2 font-mono text-[10px] uppercase"><span>{{ key.revokedAt ? 'revoked' : key.expiresAt ? `expires ${key.expiresAt.slice(0, 10)}` : 'active' }}</span><button v-if="!key.revokedAt" type="button" class="underline underline-offset-2" @click="revokeKey(key.id)">revoke</button></div>
          </div>
        </div>
      </div>

      <div class="border-[3px] border-ink bg-tomato p-5 shadow-brutal">
        <p class="eyebrow">05 / anti-bot</p>
        <h2 class="mt-2 font-display text-3xl uppercase leading-none tracking-[-0.06em]">Contact blocks</h2>
        <p class="mt-4 text-sm leading-relaxed">Blocked requests still see listings, but phone numbers and additional contacts are removed. If both fields are set, both must match.</p>
        <form class="mt-5 grid gap-3" @submit.prevent="createBlock">
          <input v-model="newBlock.ipAddress" class="brutal-input bg-paper" placeholder="Exact IP address">
          <input v-model="newBlock.userAgentContains" class="brutal-input bg-paper" placeholder="User-agent contains">
          <input v-model="newBlock.reason" class="brutal-input bg-paper" placeholder="Reason (optional)">
          <button type="submit" class="border-[3px] border-ink bg-paper px-3 py-3 font-mono text-xs font-bold uppercase hover:bg-white">Add block</button>
        </form>
        <div class="mt-6 grid gap-2 border-t-[3px] border-ink pt-4">
          <div v-for="block in blocks" :key="block.id" class="border-[3px] border-ink bg-paper p-3">
            <p class="font-mono text-xs font-bold">{{ block.ipAddress || 'any IP' }} / {{ block.userAgentContains || 'any user-agent' }}</p>
            <p v-if="block.reason" class="mt-1 text-xs">{{ block.reason }}</p>
            <button v-if="block.active" type="button" class="mt-3 font-mono text-[10px] font-bold uppercase underline underline-offset-2" @click="removeBlock(block.id)">disable block</button>
            <span v-else class="mt-3 block font-mono text-[10px] uppercase text-ink/60">disabled</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
