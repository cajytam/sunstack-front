<script setup lang="ts">
import { fetchPatchById, getAll } from '@/services/api'
import { getNumberFormat } from '@/utils/numberUtils'
import { postSimulationHistory } from '@/services/historyService'
import { useUserStore } from '@/stores/user'
import { getDateFormat } from '@/utils/dateUtils'

interface Props {
  simulationId: string
  currentPrice: number | undefined
  manualPrice: number | undefined
  nbPanel: number
  nbRoof: number | undefined
  nbNotVisibleFramework: number | undefined
  nbConcreteFramework: number | undefined
  gluedSlate: boolean
  panelTypeId: number | null
  isLockedSimulation: boolean
  identifier: string | undefined
  signedAt: Date | undefined
}

const props = defineProps<Props>()

const emit = defineEmits<{
  changeManualPrice: [value: number | null]
  changeSignedAt: [value: Date | null]
}>()

const baseURL = import.meta.env.VITE_API_URI

const router = useRouter()

const userStore = useUserStore()
const { authUser } = userStore

/**
 * UX
 */
const isLoading = ref(false)
const isPersisting = ref(false)
const isDisplayAlert = ref(false)

const notificationContent = reactive({
  alertType: '',
  title: '',
  text: '',
})

/**
 * changement de prix
 */
const manualPrice = ref(null)

const onSubmitManualPrice = () => {
  isPersisting.value = true

  fetchPatchById(
    'simulation',
    props.simulationId,
    {
      manualPrice: Number.parseFloat(manualPrice.value),
    },
    true,
  )
    .then(() => {
      emit('changeManualPrice', Number.parseFloat(manualPrice.value))
      isDisplayAlert.value = true
      notificationContent.alertType = 'success'
      notificationContent.title = 'Le prix manuel a bien été pris en compte'

      if (
        getNumberFormat(manualPrice.value) !== getNumberFormat(props.manualPrice) &&
        getNumberFormat(manualPrice.value) !== getNumberFormat(props.currentPrice)
      ) {
        postSimulationHistory(
          props.simulationId,
          'Modification manuel du prix',
          userStore.user.uri,
          `Nouveau prix : ${getNumberFormat(manualPrice.value)} € (Précédemment : ${getNumberFormat(props.manualPrice ? props.manualPrice : props.currentPrice)} €)`,
        )
          .then(res => {
            if (process.env.NODE_ENV === 'development') console.log(res)
          })
          .catch(err => console.error(err))
      }
    })

    .catch(err => {
      console.error(err)
      isDisplayAlert.value = true
      notificationContent.alertType = 'error'
      notificationContent.title = 'Erreur lors de la prise en compte du tarif manuel'

      // notificationContent.text = err.response.data['hydra:description']
    })
    .finally(() => (isPersisting.value = false))
}

/**
 * Modification type de panneau
 */
const itemsPanel = ref([])
const isLoadingPanels = ref(false)
const idPanel = ref(null)
const isPersistingPanel = ref(false)

const onChangePanel = () => {
  if (idPanel.value && props.panelTypeId && idPanel.value !== props.panelTypeId) {
    isPersistingPanel.value = true

    const panelSelected = itemsPanel.value.filter(e => e.id === idPanel.value)[0]

    fetchPatchById('simulation', props.simulationId, {
      panel: `/api/panels/${idPanel.value}`,
      isForcePanelType: true,
    }).then(() => {
      postSimulationHistory(
        props.simulationId,
        'Modification du type de panneaux',
        authUser.uri,
        `Les panneaux utilisés seront des ${panelSelected.name}`,
      )
        .then(() => {
          router
            .replace('/')
            .then(() => {
              router.push({
                name: 'simulation-show-simulationId',
                params: { simulationId: props.simulationId },
                query: {
                  tab: 'administration',
                },
              })
            })
            .finally(() => (isPersistingPanel.value = false))
        })
        .catch(err => console.error(err))
    })
  }
}

/**
 * Gestion de la date de signature
 */
const signedAt = ref(null)
const onSaveSignedAt = () => {
  if (!signedAt.value) signedAt.value = null

  emit('changeSignedAt', signedAt.value)
}

onMounted(() => {
  if (props.manualPrice) manualPrice.value = props.manualPrice

  if (props.panelTypeId) idPanel.value = props.panelTypeId

  if (props.signedAt) {
    signedAt.value = getDateFormat(props.signedAt, 'dateFormatHTMLElement')
  }

  isLoadingPanels.value = true
  getAll('panel')
    .then(res => {
      res.data.forEach(item => {
        itemsPanel.value.push({
          id: item.id,
          name: `${item.model} (${item.power} Wc)`,
        })
      })
    })
    .catch(err => console.error(err))
    .finally(() => (isLoadingPanels.value = false))
})
</script>

<template>
  <VRow class="mt-0">
    <VCol cols="12">
      <VCard
        border
        class="pb-5"
      >
        <VCardTitle class="text-left text-white bg-warning d-flex align-center ga-3">
          <VIcon
            icon="ion:pricetag"
            size="small"
          />
          Gestion du prix
        </VCardTitle>
        <VRow
          v-if="props.nbPanel > 0"
          class="mt-2 mx-1"
        >
          <VCol
            cols="12"
            lg="6"
          >
            <VCard :border="true">
              <VCardTitle class="mb-3"> Modifier manuellement le prix</VCardTitle>
              <VCardText>
                <VTextField
                  v-model="manualPrice"
                  label="Prix manuel"
                  type="number"
                  step="0.01"
                />
              </VCardText>
              <VCardText class="d-flex justify-end">
                <VBtn
                  prepend-icon="entypo:price-tag"
                  text="Enregistrer le prix manuel"
                  variant="elevated"
                  color="warning"
                  :loading="isPersisting"
                  :disabled="isPersisting || props.isLockedSimulation"
                  @click.prevent="onSubmitManualPrice"
                />
              </VCardText>
              <VCardTitle>Modifier le type de panneau</VCardTitle>
              <VCardText>
                <VSelect
                  v-model="idPanel"
                  label="Type de panneau"
                  :items="itemsPanel"
                  :loading="isLoadingPanels"
                  item-title="name"
                  item-value="id"
                />
              </VCardText>
              <VCardText class="d-flex justify-end">
                <VBtn
                  prepend-icon="tabler:solar-panel"
                  text="Modifier type panneau"
                  variant="elevated"
                  :loading="isPersistingPanel"
                  :disabled="isPersistingPanel || props.isLockedSimulation"
                  @click.prevent="onChangePanel"
                />
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
        <VRow
          v-else
          justify="center"
          class="my-8"
        >
          <VCol cols="7">
            <VAlert
              color="warning"
              variant="outlined"
              border="start"
              icon="fluent:tag-error-16-filled"
              prominent
              class="text-body-1"
              text="Ajustement du prix non disponible car le devis n'est pas terminé"
            />
          </VCol>
        </VRow>
      </VCard>
    </VCol>
  </VRow>
  <VRow>
    <VCol cols="12">
      <VCard
        border
        class="fill-height"
      >
        <VCardTitle class="text-left text-white bg-primary-900 d-flex align-center ga-3">
          <VIcon
            icon="ri:price-tag-2-line"
            size="small"
          />
          Détails du prix
        </VCardTitle>
        <VCardText class="mt-7">
          <TabAdministrationDetailPrice :simulation-id="props.simulationId" />
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
  <VRow
    class="mb-8"
    align="stretch"
  >
    <VCol
      lg="8"
      cols="12"
    >
      <VCard
        border
        class="fill-height"
      >
        <VCardTitle class="text-left text-white bg-info-800 d-flex align-center ga-3">
          <VIcon
            icon="streamline:city-hall"
            size="small"
          />
          Documents administratifs
        </VCardTitle>
        <VCardText class="mt-7">
          <h6 class="text-left font-weight-bold text-h6 mb-2">ProjetSolaire</h6>
          <div class="d-flex justify-space-between align-center pl-8 mb-2">
            <h4 class="d-flex align-center justify-center text-body-1">
              <VIcon
                class="me-2"
                icon="ph:dot-outline"
                size="small"
              />
              Mandat de représentation
            </h4>
            <VBtn
              prepend-icon="mdi-eye"
              text="Mandat représentation"
              color="info"
              class="ml-6"
              size="small"
              :href="`${baseURL}api/pdf/mandate/representation/${props.identifier}`"
              target="_blank"
              rel="noopener noreferrer"
            />
          </div>
        </VCardText>
        <VDivider />
        <VDivider />
        <VCardText>
          <h6 class="text-left font-weight-bold text-h6 mb-2">Mairie</h6>
          <div class="d-flex justify-space-between align-center pl-8 mb-2">
            <h4 class="d-flex align-center justify-center text-body-1">
              <VIcon
                class="me-2"
                icon="ph:dot-outline"
                size="small"
              />
              Déclaration préalable de travaux (DP)
            </h4>
            <VBtn
              prepend-icon="mdi-eye"
              text="Afficher DP"
              color="info"
              class="ml-6"
              size="small"
              :href="`${baseURL}api/pdf/mandate/representation/${props.identifier}`"
              target="_blank"
              rel="noopener noreferrer"
              disabled
            />
          </div>
          <div class="d-flex justify-space-between align-center pl-8 mb-2">
            <h4 class="d-flex align-center justify-center text-body-1">
              <VIcon
                class="me-2"
                icon="ph:dot-outline"
                size="small"
              />
              Demande d'autorisation de voirie
            </h4>
            <VBtn
              prepend-icon="mdi-eye"
              text="Autorisation voirie"
              color="info"
              class="ml-6"
              size="small"
              :href="`${baseURL}api/pdf/mandate/representation/${props.identifier}`"
              target="_blank"
              rel="noopener noreferrer"
              disabled
            />
          </div>
        </VCardText>
      </VCard>
    </VCol>
    <VCol
      lg="4"
      cols="12"
    >
      <VCard
        border
        class="fill-height"
      >
        <VCardTitle class="text-left text-white bg-secondary d-flex align-center ga-3">
          <VIcon
            icon="fluent-mdl2:new-team-project"
            size="small"
          />
          Gestion du projet
        </VCardTitle>
        <div class="ma-5 pa-5">
          <h5 class="text-h6 font-weight-bold">
            {{ props.signedAt ? 'Modifier la' : 'Ajouter une' }} date de signature
          </h5>
          <VTextField
            v-model="signedAt"
            class="mt-2 mb-5"
            label="Date de signature"
            type="date"
          />
          <div class="d-flex ga-2 justify-end align-center">
            <VBtn
              @click="onSaveSignedAt"
              prepend-icon="material-symbols:save"
              text="Enregistrer"
            />
          </div>
        </div>
      </VCard>
    </VCol>
  </VRow>
  <VSnackbar
    :timeout="5000"
    :color="notificationContent.alertType"
    v-model="isDisplayAlert"
  >
    <h3 class="text-h6 text-white font-weight-bold mb-2">{{ notificationContent.title }}</h3>
    {{ notificationContent.text }}
  </VSnackbar>
</template>

<style lang="scss">
.date-picker-signed_at {
  position: absolute;
  top: 0;
}
</style>
