<script setup lang="ts">
import { getDateFormat } from '@/utils/dateUtils'
import { getAllSimulationsArchived } from '@/services/simulationService'
import { get } from '@/services/api'
import { useUserStore } from '@/stores/user'
import { ability } from '@/plugins/casl/casl'

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
  { key: 'latestStatus', title: 'Statut' },
  { title: 'Date création / MAJ' },
  { key: 'nbPanelsTotal', title: 'Nb panneaux', align: 'center' },
]

const onClickRow = row => {
  router.push({ name: 'simulation-show-simulationId', params: { simulationId: row.id } })
}

onMounted(() => {
  if (ability.can('manage', 'all')) {
    getAllSimulationsArchived()
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
      'exists[deletedAt]': true,
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
    <h1 class="main-section-title">Liste des devis archivés</h1>
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
        @click:row="onClickRow"
      >
        <template #loading>
          Récupération des devis archivés en cours
          <VProgressCircular
            class="ml-2"
            indeterminate
            color="warning"
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
            <td>
              <ChipStatusIndex :latest-status="item.latestStatus" />
            </td>
            <td>
              <span class="text-body-2"> Créé : {{ getDateFormat(item.createdAt, 'dateFormatFRBis') }} </span>
              <template v-if="item.latestStatus">
                <br />
                <span class="text-body-2 font-italic">
                  MAJ : {{ getDateFormat(item.latestStatus.createdAt, 'dateFormatFRBis') }}
                </span>
              </template>
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
  background-color: var(--grey-sunstack-darker) !important;
  color: white !important;
}
</style>
