<script setup lang="ts">
import { getAll } from '@/services/api'

const router = useRouter()

const surveysList = ref()
const isError = ref(false)
const isLoading = ref(true)
const search = ref('')

const headers = [{ title: 'Nom', align: 'start', key: 'name' }]

const getAllSurveySteps = () => {
  getAll('surveyStep')
    .then(res => {
      surveysList.value = res.data
    })
    .catch(err => {
      isError.value = true
      console.error(err)
    })
    .finally(() => {
      isLoading.value = false
    })
}

onMounted(() => {
  getAllSurveySteps()
})

const onAddSurveyStep = () => {
  router.push({ name: 'admin-survey-show-idSurvey', params: { idSurvey: 'new' } })
}

const onSelect = row => {
  router.push({ name: 'admin-survey-show-idSurvey', params: { idSurvey: row.id } })
}
</script>

<template>
  <VMain>
    <VCard>
      <VCardTitle>
        <h1 class="text-lg-h4 text-body-1 font-weight-bold">Gestion des surveys</h1>
      </VCardTitle>
      <VCardText class="d-flex flex-wrap gap-4">
        <div class="flex-grow-1" />
        <div class="d-flex gap-6 app-user-search-filter align-center">
          <VTextField
            v-model="search"
            density="compact"
            clearable
            placeholder="Rechercher survey..."
          />
          <VBtn
            text="Ajouter un survey"
            color="info"
            @click.prevent="onAddSurveyStep"
          />
        </div>
      </VCardText>
      <VDataTable
        class="rounded-0 text-body-1"
        :headers="headers"
        :loading="isLoading"
        :search="search"
        :items="surveysList"
        :sort-by="[{ key: 'name', order: 'asc' }]"
      >
        <template #item="{ item }">
          <tr
            class="cursor-pointer"
            @click="onSelect(item)"
          >
            <td>{{ item.name }}</td>
          </tr>
        </template>
      </VDataTable>
    </VCard>
  </VMain>
</template>

<style scoped lang="scss">
:deep(.v-data-table__th) {
  background-color: var(--primary-600) !important;
  color: white !important;
}

.app-user-search-filter {
  inline-size: 28.0625rem;
}
</style>
