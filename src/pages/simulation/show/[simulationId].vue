<script setup lang="ts">
import router from '@/router'
import { fetchGetById, patchById } from '@/services/api'
import { useUserStore } from '@/stores/user'
import { getDateFormat } from '@/utils/dateUtils'
import { deleteSimulation, restoreSimulation } from '@/services/simulationService'
import { getSimulationHistory, postSimulationHistory } from '@/services/historyService'
import { getStatusesSimulation, postStatusSimulation } from '@/services/statusSimulationService'
import { ability } from '@/plugins/casl/casl'
import { useSimulationStore } from '@/stores/simulation'

/**
 * Variables globales
 */
const baseURL = import.meta.env.VITE_API_URI

/**
 * Store
 */
const userStore = useUserStore()
const { authUser } = userStore

const simulationStore = useSimulationStore()
const { setSignedAt } = simulationStore
const { simulationData } = storeToRefs(simulationStore)

/**
 * Route
 */
const route = useRoute()
const simulationId = route.params.simulationId

/**
 * Navigation
 */
const tab = ref(0)

/**
 * UX
 */
const isLoadingData = ref(true)
const isPersistingDeletedAt = ref(false)
const isDisplayAlert = ref(false)

const notificationContent = reactive({
  alertType: '',
  title: '',
  text: '',
})

/**
 * gestion devis
 */
const simulation = ref(null)
const simulationSurveys = ref([])
const deleteSimulationDisplayAlert = ref(false)
const copySimulationDisplayAlert = ref(false)
const listLatestStatuses = ref({})

/**
 * Historique
 */
const getHistory = () => {
  getSimulationHistory(simulationId)
    .then(res => {
      simulation.value.histories = res.data.sort((elem1, elem2) => {
        return elem2.id - elem1.id
      })
    })
    .catch(err => {
      console.error(err)
    })
}

const getStatuses = () => {
  getStatusesSimulation(simulationId)
    .then(res => {
      simulation.value.statusSimulations = res.data
      createListLastStatuses()
    })
    .catch(err => {
      console.error(err)
    })
}

/**
 * ajout de statut
 */
const openStatusDialog = ref(false)
const isPersistingStatus = ref(false)

const onChangeStatus = data => {
  isPersistingStatus.value = true

  postStatusSimulation(data, simulationId, authUser.uri)
    .then(res => {
      isDisplayAlert.value = true
      notificationContent.alertType = 'success'
      notificationContent.title = 'Le statut du devis a bien été ajouté'

      if (process.env.NODE_ENV === 'development') console.log(res)

      // on ajoute la date de signature si le statut === signé
      if (data.status === '/api/statuses/6') {
        setSignedAt(false, simulationId)
      }
    })
    .catch(err => {
      isDisplayAlert.value = true
      notificationContent.alertType = 'error'
      notificationContent.title = "Erreur lors de l'enregistrement du statut du devis"
      notificationContent.text = err.response.data['hydra:description']

      console.error(err)
    })
    .finally(() => {
      openStatusDialog.value = false
      isPersistingStatus.value = false
      getStatuses()
    })
}

/**
 * Boutons
 */
const btnViewPDF = reactive({
  disabled: false,
  text: 'Afficher PDF',
})

const btnEdit = reactive({
  disabled: false,
  text: 'Modifier',
})

const createListLastStatuses = () => {
  if (simulation.value.statusSimulations) {
    listLatestStatuses.value = {}
    simulation.value.statusSimulations = simulation.value.statusSimulations.sort((a, b) =>
      a.id > b.id ? -1 : b.id > a.id ? 1 : 0,
    )
    simulation.value.statusSimulations.forEach(status => {
      if (!Object.prototype.hasOwnProperty.call(listLatestStatuses.value, status.status.statusGroup.name)) {
        let text = status.status.name
        if (status.optionSelected) text += ` : ${status.optionSelected}`

        if (status.dateEvent) text += ` : ${getDateFormat(status.dateEvent, 'dateFormatFRBis')}`

        listLatestStatuses.value[status.status.statusGroup.name] = {
          color: status.status.color,
          name: text,
          order: status.status.statusGroup.sort,
        }
      }
    })

    const test = Object.entries(listLatestStatuses.value).sort((a, b) =>
      a[1].order > b[1].order ? 1 : b[1].order > a[1].order ? -1 : 0,
    )

    listLatestStatuses.value = {}
    test.forEach(item => {
      listLatestStatuses.value[item[0]] = {
        color: item[1].color,
        name: item[1].name,
      }
    })
  }
}

const getSimulation = () => {
  fetchGetById('simulation', simulationId)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      simulation.value = res

      simulationSurveys.value = simulation.value.surveys

      simulationData.value.signedAtDate = simulation.value?.signedAt ? simulation.value.signedAt : null

      createListLastStatuses()

      // bouton Afficher PDF
      if (simulation.value.nbPanelsTotal <= 0 || !simulation.value.profile) {
        btnViewPDF.disabled = true
        btnViewPDF.text = 'Devis non terminé'
      }

      if (simulation.value.isSigned) {
        btnEdit.disabled = true
        btnEdit.text = 'Devis signé'
      } else if (simulation.value.isExpired && !ability.can('manage', 'all') && !authUser.roles.includes('ROLE_ADAM')) {
        btnEdit.disabled = true
        btnEdit.text = 'Devis périmé'
      }

      isLoadingData.value = false
    })
    .catch(err => console.error(err))
}

const onDeleteSimulation = () => {
  isPersistingDeletedAt.value = true
  deleteSimulation(simulationId)
    .then(() => {
      postSimulationHistory(simulationId, 'Archivage du devis', authUser.uri)
        .then(() => router.push({ name: 'simulation', query: { 'exists[deletedAt]': false } }))
        .catch(err => console.error(err))
    })
    .catch(err => console.error(err))
    .finally(() => (isPersistingDeletedAt.value = false))
}

const onRestoreSimulation = () => {
  isPersistingDeletedAt.value = true

  restoreSimulation(simulationId)
    .then(() => {
      postSimulationHistory(simulationId, 'Désarchivage du devis', authUser.uri)
        .then(() => router.go())
        .catch(err => console.error(err))
    })
    .catch(err => console.error(err))
    .finally(() => (isPersistingDeletedAt.value = false))
}

const onSaveSignedAt = dateSignature => {
  patchById('simulation', simulationId, {
    signedAt: dateSignature,
  })
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log('save-signed-at => ', res)

      isDisplayAlert.value = true
      notificationContent.alertType = 'success'
      notificationContent.title = 'La date de signature a bien été enregistrée'
    })
    .catch(err => {
      console.error(err)

      isDisplayAlert.value = true
      notificationContent.alertType = 'error'
      notificationContent.title = "Erreur lors de l'enregistrement de la date de signature"
      notificationContent.text = err.response.data['hydra:description']
    })
}

const updateRoute = route => {
  router.push({
    name: 'simulation-show-simulationId',
    params: { simulationId },
    query: {
      tab: route,
    },
  })
}

onBeforeRouteUpdate(to => {
  if (to.query && to.query.tab) tab.value = to.query.tab
})

onMounted(() => {
  getSimulation()
  if (route.query && route.query.tab) tab.value = route.query.tab
})

const getUrlPdf = () => {
  return `${baseURL}api/pdf/generate/${simulation.value.identifier}`
}
</script>

<template>
  <div>
    <VMain
      v-if="isLoadingData"
      class="d-flex justify-center mt-8"
    >
      <VProgressCircular
        size="150"
        width="12"
        color="primary"
        indeterminate
      />
    </VMain>
    <VFadeTransition>
      <VMain v-if="!isLoadingData">
        <VRow
          align="center"
          justify="center"
        >
          <VCol cols="12">
            <h1 class="font-weight-bold text-xl-h3 text-h4 text-primary">
              {{
                `${simulation.name} - ${
                  simulation?.customerInfos?.fullname
                    ? simulation?.customerInfos?.fullname.toUpperCase()
                    : 'Prospect non renseigné'
                }`
              }}
            </h1>
            <VDivider />
            <VRow align="center">
              <VCol class="mt-2">
                <VIcon
                  icon="mdi-calendar"
                  size="small"
                />
                <span>&nbsp;Créé le </span>
                <span class="text-primary font-weight-bold">
                  {{ getDateFormat(simulation.createdAt) }}
                </span>
                <span class="ml-2">|</span>
                <template v-if="Object.keys(listLatestStatuses).length > 0">
                  <ChipStatusIndex
                    v-for="(status, id) in listLatestStatuses"
                    :id="id"
                    :key="id"
                    :latest-status="status"
                    rounded="sm"
                    class="ml-2"
                  />
                </template>
                <VChip
                  v-else
                  text="Devis généré"
                  color="secondary"
                  rounded="sm"
                  class="ml-2"
                />
              </VCol>
              <VCol
                v-if="simulation.isExpired && !simulation.isSigned"
                cols="12"
              >
                <VAlert
                  title="Ce devis a été créé il y a plus d'un mois et n'est par conséquent plus valide"
                  prominent
                  icon="icon-park-outline:invalid-files"
                  color="error"
                  variant="tonal"
                  border="start"
                />
              </VCol>
            </VRow>
          </VCol>
        </VRow>
        <VRow class="align-center">
          <VCol
            class="pt-0 pb-2"
            cols="12"
          >
            <VBtn
              :text="btnViewPDF.text"
              size="small"
              class="rounded-e-0"
              prepend-icon="ion:eye-outline"
              rounded="xs"
              :disabled="btnViewPDF.disabled"
              :href="getUrlPdf()"
              target="_blank"
              rel="noopener noreferrer"
            />
            <VMenu transition="slide-y-transition">
              <template #activator="{ props }">
                <VBtn
                  class="rounded-s-0 px-0"
                  v-bind="props"
                  size="small"
                  :disabled="btnViewPDF.disabled"
                >
                  <VIcon icon="eva:arrow-down-fill" />
                </VBtn>
              </template>
              <VList
                bg-color="primary"
                density="compact"
              >
                <VListItem
                  nav
                  prepend-icon="iconamoon:invoice-bold"
                  :href="`${baseURL}api/pdf/generate/${simulation.identifier}/onlyDevis`"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Devis
                </VListItem>
                <VListItem
                  nav
                  prepend-icon="mdi-email-newsletter"
                  :href="`${baseURL}api/pdf/mandate/representation/${simulation.identifier}`"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mandat de représentation
                </VListItem>
              </VList>
            </VMenu>
            <VBtn
              v-if="!simulation.deletedAt"
              prepend-icon="uil:edit"
              color="warning"
              class="ml-2"
              rounded="xs"
              size="small"
              :disabled="btnEdit.disabled"
              :text="btnEdit.text"
              @click="
                $router.push({
                  name: 'simulation-solar-simulationIdentifier',
                  params: { simulationIdentifier: simulation.id },
                })
              "
            />
            <VMenu
              v-if="!simulation.deletedAt"
              v-model="deleteSimulationDisplayAlert"
              location="top"
              transition="slide-y-reverse-transition"
            >
              <template #activator="{ props }">
                <VBtn
                  class="ml-2"
                  prepend-icon="ic:outline-archive"
                  color="error"
                  rounded="xs"
                  size="small"
                  text="Archiver"
                  v-bind="props"
                />
              </template>
              <VCard
                min-width="300"
                class="border"
              >
                <VCardTitle>
                  <span class="text-caption font-italic">
                    Il faudra contacter un administrateur pour restaurer ce devis
                  </span>
                </VCardTitle>
                <VCardActions class="justify-center gap-x-3">
                  <VBtn
                    prepend-icon="mingcute:archive-fill"
                    text="Archiver"
                    color="error"
                    variant="elevated"
                    @click="onDeleteSimulation"
                  />
                  <VBtn
                    text="Annuler"
                    color="secondary"
                    variant="text"
                  />
                </VCardActions>
              </VCard>
            </VMenu>
            <VBtn
              v-else-if="ability.can('manage', 'all') || authUser.roles.includes('ROLE_ADAM')"
              text="Désarchiver"
              prepend-icon="mdi-archive-arrow-up-outline"
              color="warning"
              rounded="xs"
              size="small"
              class="ml-2"
              :loading="isPersistingDeletedAt"
              @click="onRestoreSimulation"
            />
            <VMenu
              v-model="copySimulationDisplayAlert"
              location="top"
              transition="slide-y-reverse-transition"
            >
              <template #activator="{ props }">
                <VBtn
                  prepend-icon="bxs:copy"
                  text="Copier"
                  variant="elevated"
                  color="info"
                  size="small"
                  class="ml-2"
                  rounded="xs"
                  v-bind="props"
                />
              </template>
              <VCard
                min-width="300"
                class="border"
              >
                <VCardTitle>
                  <span class="text-caption font-italic"> Souhaitez-vous créer un devis à partir de ce devis ? </span>
                </VCardTitle>
                <VCardText class="d-flex justify-center align-center mt-2 gap-x-3">
                  <VBtn
                    prepend-icon="fa-solid:copy"
                    text="Copier"
                    color="info"
                    variant="elevated"
                    disabled
                    @click="
                      $router.push({
                        name: 'simulation-solar-copy-identifierSimulation',
                        params: { identifierSimulation: simulation.id },
                      })
                    "
                  />
                  <VBtn
                    text="Annuler"
                    color="secondary"
                    variant="text"
                  />
                </VCardText>
              </VCard>
            </VMenu>
            <VBtn
              prepend-icon="tabler:status-change"
              rounded="xs"
              size="small"
              variant="flat"
              class="ml-2"
              text="Ajout statut"
              color="secondary"
              @click="openStatusDialog = true"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="12">
            <VTabs
              v-model="tab"
              center-active
              show-arrows
            >
              <VTab
                value="resume"
                class="pb-2"
                @click="updateRoute(tab)"
              >
                <VIcon
                  icon="ooui:text-summary-ltr"
                  class="me-1"
                />
                Résumé
              </VTab>
              <VTab
                value="panneaux"
                class="pb-2"
                @click="updateRoute(tab)"
              >
                <VIcon
                  icon="bi:card-list"
                  class="me-1"
                />
                Détail
              </VTab>
              <VTab
                value="surveys"
                class="pb-2"
                @click="updateRoute(tab)"
              >
                <VIcon
                  icon="wpf:survey"
                  class="me-1"
                />
                Surveys
              </VTab>
              <VTab
                value="management"
                class="pb-2"
                @click="updateRoute(tab)"
              >
                <VIcon
                  icon="material-symbols:folder-managed-outline"
                  class="me-1"
                />
                Gestion
              </VTab>
              <VTab
                v-if="new Date(simulation.createdAt) >= new Date(2024, 6, 1)"
                value="bonus"
                class="pb-2"
                @click="updateRoute(tab)"
              >
                <VIcon
                  icon="mingcute:target-line"
                  class="me-1"
                />
                Détails Objectifs
              </VTab>
              <VTab
                v-if="ability.can('manage', 'all') || authUser.roles.includes('ROLE_ADAM')"
                class="pb-2"
                value="administration"
                @click="updateRoute(tab)"
              >
                <VIcon
                  icon="mdi-administrator-outline"
                  class="me-1"
                />
                Administration
              </VTab>
              <VTab
                value="historique"
                class="pb-2"
                @click="updateRoute(tab)"
              >
                <VIcon
                  icon="material-symbols:history"
                  class="me-1"
                />
                Historique
              </VTab>
            </VTabs>
            <VCard class="rounded-t-0 pb-5">
              <VCardTitle class="text-center">
                <VWindow v-model="tab">
                  <VWindowItem
                    key="1"
                    value="resume"
                    class="no-transition"
                  >
                    <VRow>
                      <VCol
                        cols="12"
                        lg="5"
                      >
                        <OwnedBy
                          :owner-name="simulation.ownedBy.fullName"
                          :owner-image="simulation.ownedBy.picture ? simulation.ownedBy.picture : null"
                          @change-owner-name="e => (simulation.ownedBy.fullName = e)"
                          @change-owner-image="e => (simulation.ownedBy.picture = e)"
                        />
                        <SummaryOffer
                          :installation-price-ht="
                            simulation.installationPriceHT ? simulation.installationPriceHT : null
                          "
                          :final-price-ht="simulation.finalPriceHT ? simulation.finalPriceHT : null"
                          :installation-total-power="simulation.totalPower ? simulation.totalPower : null"
                          :panel-power="simulation.panel ? simulation.panel.power : null"
                          :nb-panel="simulation.nbPanelsTotal ? simulation.nbPanelsTotal : 0"
                          :manual-price="simulation.manualPrice ? simulation.manualPrice : null"
                          :can-deduct-vat="
                            null !== simulation.customerInfos.canDeductVAT
                              ? simulation.customerInfos.canDeductVAT
                              : true
                          "
                          :nb-roof="simulation.nbToitures"
                          :nb-concrete-framework="simulation.nbCharpentesBeton"
                          :nb-not-visible-framework="simulation.nbCharpentesNonVisibles"
                          :installation-location="
                            simulation.installationLocation ? simulation.installationLocation : null
                          "
                          :is-ardoise-clouee="simulation.isArdoiseClouee ? simulation.isArdoiseClouee : false"
                          :profile="simulation.profile"
                          :nb-other-building="
                            simulation.nbSurveyOtherBuildings && simulation.nbSurveyOtherBuildings > 0
                              ? simulation.nbSurveyOtherBuildings
                              : null
                          "
                          :is-survey-main-building="
                            simulation.surveyMainBuilding ? simulation.surveyMainBuilding : false
                          "
                        />
                      </VCol>
                      <VCol
                        cols="12"
                        lg="7"
                      >
                        <SummaryCustomer
                          class="mt-3"
                          :customer-infos="simulation.customerInfos"
                          @force-update-data="getSimulation"
                        />
                        <SignatureSimulation
                          class="mt-5"
                          :signatures="simulation.signatureSimulations"
                          :status-signature="simulation.isSigned ? simulation.statusSimulations : []"
                        />
                      </VCol>
                    </VRow>
                  </VWindowItem>
                  <VWindowItem
                    key="2"
                    value="panneaux"
                    class="no-transition"
                  >
                    <VRow class="mt-2 mb-8 mx-1">
                      <VCol
                        cols="12"
                        xl="7"
                      >
                        <VCard>
                          <VCardTitle class="text-left">
                            <VIcon
                              icon="tabler:solar-panel"
                              color="primary"
                              size="large"
                              class="mr-2"
                            />
                            <span>Panneaux et performances</span>
                          </VCardTitle>
                          <VDivider class="mb-3 mt-2 mr-6" />
                          <VCardText>
                            <DetailSimulationInstallations
                              :total-panel="simulation.nbPanelsTotal ? simulation.nbPanelsTotal : 0"
                              :simulation-items="simulation.simulationItems"
                              :panel="simulation.panel ? simulation.panel : null"
                              :total-power="simulation.totalPower ? simulation.totalPower : 0"
                              :installation-location="
                                simulation.installationLocation ? simulation.installationLocation : null
                              "
                              :buildings="simulation.buildings"
                            />
                          </VCardText>
                        </VCard>
                      </VCol>
                      <VCol
                        cols="12"
                        xl="5"
                      >
                        <DetailSimulationConsumption
                          :consumption-price="simulation.consumptionPrice"
                          :consumption-quantity="simulation.consumptionQuantity"
                          :profile="simulation.profile"
                          :price-escalation="simulation.priceEscalation"
                          :sales-price-escalation="simulation.salesPriceEscalation"
                          :reduced-yield-first-year="
                            simulation.reducedYieldFirstYear ? simulation.reducedYieldFirstYear : null
                          "
                          :reduced-yield="simulation.reducedYield"
                        />
                        <DetailSimulationRoof
                          v-if="simulation.installationLocation !== 'S'"
                          class="mt-5"
                          :nb-roof="simulation.nbToitures ? simulation.nbToitures : 1"
                          :nb-concrete-framework="simulation.nbCharpentesBeton"
                          :nb-not-visible-framework="simulation.nbCharpentesNonVisibles"
                          :nb-panel="simulation.nbPanelsTotal ? simulation.nbPanelsTotal : 0"
                          :is-ardoise-clouee="simulation.isArdoiseClouee ? simulation.isArdoiseClouee : false"
                        />
                        <DetailSimulationBonus
                          class="mt-5"
                          :bonus-amount="simulation.bonusAmount"
                        />
                      </VCol>
                    </VRow>
                  </VWindowItem>
                  <VWindowItem
                    key="5"
                    value="administration"
                    class="no-transition"
                  >
                    <AdministrationSimulation
                      :current-price="
                        simulation.finalPriceHT
                          ? simulation.finalPriceHT
                          : simulation.installationPriceHT
                            ? simulation.installationPriceHT
                            : null
                      "
                      :manual-price="simulation.manualPrice ? simulation.manualPrice : null"
                      :simulation-id="simulationId"
                      :nb-panel="simulation.nbPanelsTotal ? simulation.nbPanelsTotal : 0"
                      :nb-roof="simulation.nbToitures"
                      :nb-concrete-framework="simulation.nbCharpentesBeton"
                      :nb-not-visible-framework="simulation.nbCharpentesNonVisibles"
                      :glued-slate="simulation.isArdoiseClouee ? simulation.isArdoiseClouee : false"
                      :panel-type-id="simulation.panel ? simulation.panel.id : null"
                      :is-locked-simulation="simulation.isSigned ? simulation.isSigned : false"
                      :identifier="simulation.identifier"
                      @change-manual-price="e => (simulation.installationPriceHT = e)"
                      :signed-at="simulation.signedAt ? simulation.signedAt : null"
                      @change-signed-at="e => onSaveSignedAt(e)"
                    />
                  </VWindowItem>
                  <VWindowItem
                    key="6"
                    value="historique"
                    class="no-transition"
                  >
                    <VRow class="mb-5">
                      <VCol
                        cols="12"
                        lg="7"
                      >
                        <History
                          :statuses="simulation.statusSimulations"
                          :histories="simulation.histories"
                          :simulation-id="simulationId"
                          :last-edit-date="simulation.updatedAt ? simulation.updatedAt : null"
                          @update-history="getHistory"
                        />
                      </VCol>
                    </VRow>
                  </VWindowItem>
                  <VWindowItem
                    key="7"
                    value="surveys"
                    class="no-transition"
                  >
                    <SurveysList
                      :surveys="simulation.surveys"
                      :survey-simulation="simulation.surveySimulations"
                      :id-simulation="simulationId"
                    />
                  </VWindowItem>
                  <VWindowItem
                    key="8"
                    value="management"
                    class="no-transition"
                  >
                    <VRow class="mb-5">
                      <VCol
                        cols="12"
                        lg="7"
                        class="mt-3"
                      >
                        <TaskManagement
                          :id-simulation="simulationId"
                          :simulation-number="simulation.name"
                          :customer-name="
                            simulation?.customerInfos?.fullname ? simulation?.customerInfos?.fullname : null
                          "
                        />
                      </VCol>
                      <VCol
                        cols="12"
                        lg="5"
                        class="mt-3"
                      >
                        <ManagementFile :id-simulation="simulationId" />
                      </VCol>
                    </VRow>
                  </VWindowItem>
                  <VWindowItem
                    key="9"
                    value="bonus"
                    class="no-transition"
                  >
                    <TabSellerBonus
                      :panel-power="simulation.panel ? simulation.panel.power : null"
                      :panel-nb="simulation.nbPanelsTotal ? simulation.nbPanelsTotal : 0"
                      :user="simulation?.ownedBy"
                      :creation-timestamp="Math.floor(+new Date(simulation.createdAt) / 1000)"
                      :is-signed="simulation.isSigned"
                    />
                  </VWindowItem>
                </VWindow>
              </VCardTitle>
            </VCard>
          </VCol>
        </VRow>
      </VMain>
    </VFadeTransition>
    <StatusManagement
      :open-dialog-status="openStatusDialog"
      :is-saving="isPersistingStatus"
      @is-close-status-dialog="e => (openStatusDialog = !openStatusDialog)"
      @on-submit-status="onChangeStatus"
    />
    <VSnackbar
      :timeout="5000"
      :color="notificationContent.alertType"
      v-model="isDisplayAlert"
    >
      <h3 class="text-h6 text-white font-weight-bold mb-2">{{ notificationContent.title }}</h3>
      {{ notificationContent.text }}
    </VSnackbar>
  </div>
</template>
