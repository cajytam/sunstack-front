<script setup lang="ts">
import { getAll } from '@/services/api'

const router = useRouter()

const simulationStatusList = ref()
const isError = ref(false)
const isLoading = ref(true)
const search = ref('')

const headers = [
  { title: 'Nom', align: 'start', key: 'name' },
  { title: "Nombre d'éléments", align: 'start', key: 'numberOfSteps' },
  { title: 'Ordre', align: 'start', key: 'sort' },
]

const getAllStatus = () => {
  getAll('statusGroup')
    .then(res => {
      simulationStatusList.value = res.data
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
  getAllStatus()
})

const onSelect = row => {
  router.push({ name: 'admin-simulation-status-show-idStatusGroup', params: { idStatusGroup: row.id } })
}
</script>

<template>
  <div>
    <VMain>
      <VCard>
        <VCardTitle>
          <h1 class="text-lg-h4 text-body-1 font-weight-bold">Gestion des statuts des devis</h1>
        </VCardTitle>
        <VCardText class="d-flex flex-wrap gap-4">
          <div class="flex-grow-1" />
          <div class="d-flex gap-6 app-user-search-filter align-center">
            <VTextField
              v-model="search"
              density="compact"
              clearable
              placeholder="Rechercher statut..."
            />
          </div>
        </VCardText>
        <VDataTable
          class="rounded-0 text-body-1"
          :headers="headers"
          :loading="isLoading"
          :search="search"
          :items="simulationStatusList"
          :sort-by="[{ key: 'sort', order: 'asc' }]"
        >
          <template #item="{ item }">
            <tr
              class="cursor-pointer"
              @click="onSelect(item)"
            >
              <td>{{ item.name }}</td>
              <td>{{ item.numberOfSteps }}</td>
              <td>{{ item.sort }}</td>
            </tr>
          </template>
        </VDataTable>
      </VCard>
      <Notification
        v-if="isError"
        title="Erreur lors du chargement des données"
        alert-type="error"
        icon="carbon:data-error"
        text="Erreur de communication avec la base de donnée"
        is-closable
      />
    </VMain>
  </div>
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
