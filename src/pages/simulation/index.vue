<script setup lang="ts">
import { get } from '@/services/api'
import { useUserStore } from '@/stores/user'
import { getDateFormat } from '@/utils/dateUtils'
import { getAllUsers } from '@/services/userService'

import { postExportFileSimulation } from '@/services/exportToFile'
import { ability } from '@/plugins/casl/casl'

const baseURL = import.meta.env.VITE_API_URI

const userStore = useUserStore()
const { authUser } = userStore

const simulations = ref()
const router = useRouter()
const route = useRoute()
const isLoading = ref(true)
const isError = ref(false)

const listUsers = ref([])
const isFiltersDisplay = ref(false)
const filterUsers = ref([])

const selectedSimulations = ref([])
const queryFilterSimulation = ref({})
const isFilterAddIgnored = ref(false)
const dialogExport = ref(false)
const isGeneratingExport = ref(false)
const formatExport = ref('Xlsx')
const filenameExport = ref(`Devis au ${getDateFormat(new Date(), 'dateFormatFR')}`)

const headers = [
  {
    align: 'center',
    key: 'name',
    sortable: true,
    title: 'Numéro',
  },
  { key: 'customerName', title: 'Client' },
  { key: 'ownedBy.fullName', title: 'Responsable' },
  { align: 'center', key: 'latestStatus', title: 'Statut' },
  { align: 'center', title: 'Date création / MAJ' },
  { align: 'center', key: 'nbPanelsTotal', title: 'Nb panneaux' },
]

const onClickRow = row => {
  router.push({ name: 'simulation-show-simulationId', params: { simulationId: row.id } })
}

onMounted(() => {
  if (route.query) {
    queryFilterSimulation.value = route.query

    if (route.query.globalSearch) globalSearch.value = route.query.globalSearch
  }

  if (Object.prototype.hasOwnProperty.call(route.query, 'ownedBy')) isFiltersDisplay.value = true

  loadUsers()
  loadSimulations()
  convertUrlParamsToRequestParams(route.query)
})

/**
 * Permet de récupérer la liste des utilisateurs ayant créés au moins un devis
 */
const loadUsers = () => {
  listUsers.value = []

  getAllUsers().then(res => {
    if (process.env.NODE_ENV === 'development') console.log(res)

    res.data['hydra:member'].forEach(user => {
      if (user.generatedASimulation) {
        if (ability.can('manage', 'all') || user.id === authUser.id) listUsers.value.push(user)
      }
    })
    listUsers.value.sort((a, b) =>
      a.fullName > b.fullName ? 1 : b.fullName.toUpperCase() > a.fullName.toUpperCase() ? -1 : 0,
    )
  })
}

const loadSimulations = () => {
  isLoading.value = true

  if (!ability.can('manage', 'all')) {
    if (Object.prototype.hasOwnProperty.call(queryFilterSimulation.value, 'ownedBy'))
      delete queryFilterSimulation.value.ownedBy

    queryFilterSimulation.value.ownedBy = [authUser.id]
  }

  get('simulation', '', true, 'get', queryFilterSimulation.value)
    .then(res => {
      simulations.value = res.data
      if (process.env.NODE_ENV === 'development') console.log(res)
    })
    .catch(err => {
      isError.value = true
      console.error(err)
    })
    .finally(() => (isLoading.value = false))
}

const showDatePicker = ref(false)
const selectedDates = ref([])

const selectedRange = computed(() => {
  if (selectedDates.value.length === 2)
    return `${selectedDates.value[0].toLocaleDateString()} - ${selectedDates.value[1].toLocaleDateString()}`

  return ''
})

const handleDateClick = () => {
  if (selectedDates.value.length > 1) {
    const maxDate = new Date(Math.max(...selectedDates.value))
    const currentDate = new Date(new Date(Math.min(...selectedDates.value)))
    const datesBetween = []
    while (currentDate <= maxDate) {
      datesBetween.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    selectedDates.value = datesBetween
  }
}

const handleDateRangeSelection = value => {
  selectedDates.value = value.slice().sort((a, b) => a - b)
}

const updateSimulationsWithParamsQuery = () => {
  queryFilterSimulation.value = {
    ...(filterUsers.value && { ownedBy: filterUsers.value }),
  }
  if (isFilterAddIgnored.value === true) {
    if (Object.prototype.hasOwnProperty.call(queryFilterSimulation.value, 'exists[deletedAt]'))
      delete queryFilterSimulation.value['exists[deletedAt]']
  } else {
    queryFilterSimulation.value['exists[deletedAt]'] = false
  }

  router.replace({
    name: 'simulation',
    query: queryFilterSimulation.value,
  })
}

const onExportToFile = async () => {
  isGeneratingExport.value = true

  const query = route.query
  if (!ability.can('manage', 'all')) {
    if (Object.prototype.hasOwnProperty.call(query, 'ownedBy')) delete query.ownedBy

    query.ownedBy = [authUser.id]
  }

  const fileName = filenameExport.value
    ? filenameExport.value
    : `Export_${getDateFormat(new Date(), 'dateFormatSeconds')}`

  try {
    await postExportFileSimulation(formatExport.value, fileName, query)
  } catch (error) {
    console.error("Une erreur s'est produite :", error)
  } finally {
    isGeneratingExport.value = false
  }
}

/**
 * Initialiser la liste des paramétrages de l'url pour init les filtres
 */
const convertUrlParamsToRequestParams = routerQuery => {
  if (routerQuery) {
    // init inclure les devis archivés ou non
    if (Object.prototype.hasOwnProperty.call(routerQuery, 'exists[deletedAt]'))
      isFilterAddIgnored.value = routerQuery['exists[deletedAt]']
    else isFilterAddIgnored.value = true

    // init la liste des ids des utilisateurs
    if (Object.prototype.hasOwnProperty.call(routerQuery, 'ownedBy')) {
      const listIdsUser = routerQuery.ownedBy
      if (typeof listIdsUser === 'string') {
        filterUsers.value = Number.parseInt(listIdsUser)
      } else {
        filterUsers.value = listIdsUser.map(idUser => {
          return Number.parseInt(idUser)
        })
      }
    }
  }
}

/**
 * gestion Recherche globale
 */
const globalSearch = ref(null)

/**
 * Gestion filtre par défaut
 */
const resetFilters = () => {
  queryFilterSimulation.value = { 'exists[deletedAt]': false }
  globalSearch.value = null

  filterUsers.value = []
  isFilterAddIgnored.value = false

  router.replace({
    name: 'simulation',
    query: queryFilterSimulation.value,
  })
}

onBeforeRouteUpdate((to, from) => {
  if (to.name === 'simulation' && from.name === 'simulation') {
    convertUrlParamsToRequestParams(to.query)
    loadSimulations()
  }
})
</script>

<template>
  <div>
    <VDialog
      v-model="dialogExport"
      scrollable
      width="auto"
    >
      <VCard min-width="650px">
        <VCardTitle class="d-flex justify-space-between text-center">
          <span>Exporter la sélection</span>
          <DialogCloseBtn @click="dialogExport = false" />
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow align="center">
            <VCol
              cols="3"
              class="text-center"
            >
              <span class="text-body-1">Format :</span>
            </VCol>
            <VCol cols="9">
              <VRadioGroup v-model="formatExport">
                <VRadio
                  label="Classeur Excel (.xlsx)"
                  color="success"
                  value="Xlsx"
                />
                <VRadio
                  label="Texte brut (.csv)"
                  color="secondary"
                  value="Csv"
                />
              </VRadioGroup>
            </VCol>
          </VRow>
        </VCardText>
        <VCardText>
          <VRow align="center">
            <VCol cols="3">
              <span class="text-body-1">Nom du fichier :</span>
            </VCol>
            <VCol>
              <VTextField
                v-model="filenameExport"
                variant="filled"
                color="secondary"
                class="text-body-1"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VDivider />
        <VCardText class="d-flex justify-center">
          <VBtn
            text="Télécharger"
            prepend-icon="line-md:download-loop"
            color="secondary"
            :disabled="isGeneratingExport"
            :loading="isGeneratingExport"
            @click="onExportToFile"
          />
        </VCardText>
      </VCard>
    </VDialog>
    <VCard>
      <VCardText class="d-flex align-center justify-start ga-5">
        <VBtn
          :text="isFiltersDisplay ? 'Cacher les filtres' : 'Filtres détaillés'"
          color="info"
          :variant="isFiltersDisplay ? 'outlined' : 'elevated'"
          :prepend-icon="isFiltersDisplay ? 'tabler:filter-off' : 'tabler:filter'"
          @click="isFiltersDisplay = !isFiltersDisplay"
        />
        <VTextField
          v-model="globalSearch"
          prepend-inner-icon="mdi-magnify"
          label="Recherche globale ..."
          clearable
          single-line
          hide-details
        />
        <VBtn
          text="Exporter"
          color="secondary"
          prepend-icon="clarity:export-line"
          @click="dialogExport = true"
        />
      </VCardText>
      <VScrollYReverseTransition mode="out-in">
        <VCardText v-if="isFiltersDisplay">
          <VRow
            justify="space-around"
            align="center"
          >
            <VCol
              cols="1"
              class="text-center"
            >
              <VBtn
                text="Filtrer"
                prepend-icon="fluent:filter-sync-20-filled"
                :disabled="isLoading"
                :loading="isLoading"
                @click="updateSimulationsWithParamsQuery"
              />
            </VCol>
            <VCol cols="8">
              <VAutocomplete
                v-model="filterUsers"
                chips
                multiple
                closable-chips
                label="Utilisateurs"
                :items="listUsers"
                item-title="fullName"
                item-value="id"
              >
                <template #chip="{ props, item }">
                  <VChip
                    v-bind="props"
                    :prepend-avatar="
                      item.raw.picture ? `${baseURL}img/users/${item.raw.picture}` : `${baseURL}img/logo/no-avatar.jpg`
                    "
                    :text="item.raw.fullName"
                  />
                </template>

                <template #item="{ props, item }">
                  <VListItem
                    v-bind="props"
                    :prepend-avatar="
                      item.raw.picture ? `${baseURL}img/users/${item.raw.picture}` : `${baseURL}img/logo/no-avatar.jpg`
                    "
                    :title="item?.raw?.fullName"
                    :subtitle="item.raw.location ? item.raw.location.name : null"
                  />
                </template>
              </VAutocomplete>
            </VCol>
            <VCol
              cols="2"
              class="d-flex align-center justify-center"
            >
              <VCheckbox
                v-model="isFilterAddIgnored"
                label="Inclure les devis archivés"
              />
            </VCol>
            <VCol cols="1">
              <VBtn
                text="Filtres par défaut"
                prepend-icon="bx:reset"
                size="small"
                color="warning"
                variant="text"
                stacked
                @click="resetFilters"
              />
            </VCol>
            <VCol
              v-if="false"
              cols="5"
            >
              <VTextField
                v-model="selectedRange"
                label="Sélectionnez une date ou une tranche de date"
                @click="showDatePicker = !showDatePicker"
              />
              <VDatePicker
                v-if="showDatePicker"
                v-model="selectedDates"
                position="absolute"
                offset-y
                style="z-index: 9999"
                multiple
                @update:model-value="handleDateClick"
                @input="handleDateRangeSelection"
              />
            </VCol>
          </VRow>
          <VRow
            v-if="false"
            align="center"
            justify="start"
          >
            <VCol cols="1" />
            <VCol cols="3">
              <VCheckbox
                v-model="isFilterAddIgnored"
                label="Inclure les devis archivés"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VScrollYReverseTransition>
      <VDataTable
        :headers="headers"
        :items="simulations"
        :search="globalSearch"
        :loading="isLoading"
        no-data-text="Aucun devis trouvé"
        class="rounded-0 text-body-1"
      >
        <template #loading>
          Récupération des devis en cours
          <VProgressCircular
            class="ml-2"
            indeterminate
            color="primary"
          />
        </template>
        <template #item="{ item, isSelected }">
          <tr
            class="cursor-pointer"
            @click="onClickRow(item)"
          >
            <td v-if="false">
              <VCheckbox
                v-model="selectedSimulations"
                :value="item.id"
                @click.stop="isSelected = !isSelected"
              />
            </td>
            <td class="text-center">
              {{ item.name }}
            </td>
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
  background-color: var(--primary-700) !important;
  color: white !important;
}
</style>
