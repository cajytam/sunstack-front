<script setup lang="ts">
import { fetchGet } from '@/services/api'

type Props = {
  user: object
}
const props = defineProps<Props>()

const baseURL = import.meta.env.VITE_API_URI

const lastSimulations = ref(null)
const isLoading = ref(true)
const search = ref('')

const headers = [
  { title: 'Numéro', align: 'center', key: 'name' },
  { title: 'Type', align: 'center', key: 'customerInfos.customerType' },
  { title: 'Nom', align: 'center', key: 'customerInfos.fullname' },
  { title: 'Nb de panneaux', align: 'center', key: 'nbPanelsTotal' },
  { title: 'Actions', align: 'center' },
]

onMounted(() => {
  isLoading.value = true

  fetchGet('simulation', '', true, 'get', {
    ownedBy: props.user.uri,
    'exists[deletedAt]': false,
  })
    .then(res => (lastSimulations.value = res))
    .catch(err => console.error(err))
    .finally(() => (isLoading.value = false))
})
</script>

<template>
  <VCard>
    <VCardTitle class="d-flex align-center justify-space-between">
      <h3 class="text-h6 text-lg-h5 font-weight-bold">Mes derniers devis</h3>
      <VBtn
        append-icon="ph:eye"
        size="small"
        variant="elevated"
        text="Tout voir"
        @click="$router.push({ name: 'simulation', query: { 'exists[deletedAt]': false } })"
      />
    </VCardTitle>
    <VFadeTransition mode="out-in">
      <VCardText v-if="!isLoading && lastSimulations.length > 0">
        <div class="my-1">
          <VTextField
            v-model="search"
            density="compact"
            clearable
            placeholder="Rechercher devis..."
          />
        </div>
        <VDataTable
          class="rounded-0 text-body-1 text-center"
          density="compact"
          :headers="headers"
          :loading="isLoading"
          :search="search"
          :items="lastSimulations"
          :items-per-page="20"
          no-data-text="Aucun devis trouvé"
        >
          <template #item="{ item }">
            <tr>
              <td>{{ item.name }}</td>
              <td>
                <VChip
                  :text="item.customerInfos.customerType"
                  :color="item.customerInfos.customerType === 'Particulier' ? 'warning' : 'info'"
                />
              </td>
              <td>{{ item.customerInfos.fullname }}</td>
              <td>{{ item.nbPanelsTotal }}</td>
              <td>
                <VBtn
                  variant="text"
                  icon="lucide:eye"
                  color="primary"
                  size="small"
                  :href="`${baseURL}api/pdf/generate/${item.identifier}`"
                  target="_blank"
                  rel="noopener noreferrer"
                />
                <VBtn
                  variant="text"
                  icon="majesticons:open"
                  color="primary"
                  size="small"
                  :to="{ name: 'simulation-show-simulationId', params: { simulationId: item.id } }"
                />
                <VBtn
                  v-if="!item.isExpired && !item.isSigned"
                  variant="text"
                  icon="bx:edit"
                  color="primary"
                  size="small"
                  :to="{
                    name: 'simulation-solar-simulationIdentifier',
                    params: { simulationIdentifier: item.id },
                  }"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              </td>
            </tr>
          </template>
        </VDataTable>
      </VCardText>
      <VCardItem v-else-if="!isLoading && lastSimulations.length == 0">
        <span class="font-italic text-subtitle-2">Aucun devis à afficher n'a été trouvé</span>
      </VCardItem>
      <VCardText v-else>
        <VSkeletonLoader type="article" />
      </VCardText>
    </VFadeTransition>
  </VCard>
</template>
