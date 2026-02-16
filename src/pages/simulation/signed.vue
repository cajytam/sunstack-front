<script setup lang="ts">
import { getAllSimulationsSigned } from '@/services/simulationService'
import { get } from '@/services/api'
import { useUserStore } from '@/stores/user'
import { ability } from '@/plugins/casl/casl'
import { getDateFormat } from '../../utils/dateUtils'

const baseURL = import.meta.env.VITE_API_URI

const userStore = useUserStore()
const { authUser } = userStore

const search = ref('')
const simulations = ref()
const router = useRouter()
const isLoading = ref(true)
const isError = ref(false)

const headers = [
  {
    align: 'start',
    key: 'name',
    sortable: true,
    title: 'Numéro',
  },
  { key: 'customerName', title: 'Client' },
  { key: 'ownedBy.fullName', title: 'Responsable' },
  { key: 'latestStatus', title: 'Statut', align: 'center' },
  { key: 'signedAt', title: 'Date de signature', align: 'center' },
  { key: 'nbPanelsTotal', title: 'Nb panneaux', align: 'center' },
]

const onClickRow = row => {
  router.push({ name: 'simulation-show-simulationId', params: { simulationId: row.id } })
}

onMounted(() => {
  if (ability.can('manage', 'all')) {
    getAllSimulationsSigned()
      .then(res => {
        if (process.env.NODE_ENV === 'development') console.log(res)

        simulations.value = res.data
      })
      .catch(err => {
        isError.value = true
        console.error(err)
      })
      .finally(() => (isLoading.value = false))
  } else {
    get('simulation', '', true, 'get', {
      ownedBy: authUser.uri,
      'exists[signedAt]': true,
      'exists[deletedAt]': false,
    })
      .then(res => {
        if (process.env.NODE_ENV === 'development') console.log(res)

        simulations.value = res.data
      })
      .catch(err => {
        isError.value = true
        console.error(err)
      })
      .finally(() => (isLoading.value = false))
  }
})
</script>

<template>
  <div>
    <h1 class="main-section-title">Liste des devis signés</h1>
    <VCard>
      <VCardTitle class="py-5">
        <VTextField
          v-model="search"
          append-icon="mdi-magnify"
          label="Recherche ..."
          clearable
          single-line
          hide-details
        />
      </VCardTitle>
      <VDataTable
        :headers="headers"
        :items="simulations"
        :search="search"
        :loading="isLoading"
        no-data-text="Aucun devis trouvé"
        class="rounded-0 text-body-1"
        :sort-by="[{ key: 'signedAt', order: 'desc' }]"
        @click:row="onClickRow"
      >
        <template #loading>
          Récupération des devis signés en cours
          <VProgressCircular
            class="ml-2"
            indeterminate
            color="success"
          />
        </template>
        <template #item="{ item }">
          <tr
            class="cursor-pointer"
            @click="onClickRow(item)"
          >
            <td>{{ item.name }}</td>
            <td>{{ item.customerName }}</td>
            <td>
              <VList class="background-transparent">
                <VListItem
                  :prepend-avatar="
                    item.ownedBy.picture
                      ? `${baseURL}img/users/${item.ownedBy.picture}`
                      : `${baseURL}img/logo/no-avatar.jpg
                  `
                  "
                  :title="item.ownedBy.fullName"
                />
              </VList>
            </td>
            <td class="text-center">
              <ChipStatusIndex :latest-status="item.latestStatus" />
            </td>
            <td class="text-center">
              {{ getDateFormat(item.signedAt, 'dateFormatFRBis') }}
            </td>
            <td class="text-center">
              {{ item.nbPanelsTotal }}
            </td>
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
  </div>
</template>

<style scoped lang="scss">
:deep(.v-data-table__th) {
  background-color: var(--blue) !important;
  color: white !important;
}
</style>
