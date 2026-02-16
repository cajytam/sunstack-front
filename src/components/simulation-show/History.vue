<script setup lang="ts">
import { postSimulationHistory } from '@/services/historyService'
import { useUserStore } from '@/stores/user'
import { getDateFormat } from '@/utils/dateUtils'

interface Props {
  statuses: object
  histories: object
  simulationId: string
  lastEditDate: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  updateHistory
}>()

/**
 * Traitement data
 */
const addHistoryData = reactive({
  title: null,
  content: null,
})

/**
 * Utilisateurs
 */
const userStore = useUserStore()
const { authUser } = userStore

/**
 * UX
 */
const isDisplayAlert = ref(false)

const notificationContent = reactive({
  alertType: '',
  title: '',
  text: '',
})

/**
 * Dialogue ajout historique
 */
const openHistoryDialog = ref(false)
const isPersistingHistory = ref(false)

const onAddHistoryComment = () => {
  if (addHistoryData.title) {
    isPersistingHistory.value = true

    postSimulationHistory(props.simulationId, addHistoryData.title, authUser.uri, addHistoryData.content)
      .then(() => {
        addHistoryData.title = null
        addHistoryData.content = null
        openHistoryDialog.value = false
        isDisplayAlert.value = true
        notificationContent.alertType = 'success'
        notificationContent.title = 'Votre commentaire a bien été pris en compte'
      })
      .catch(err => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'error'
        notificationContent.title = "Erreur lors de l'enregistrement du commentaire"
        notificationContent.text = err.response.data['hydra:description']
        console.error(err)
      })
      .finally(() => {
        isPersistingHistory.value = false
        emit('updateHistory')
      })
  }
}
</script>

<template>
  <VRow
    class="my-2"
    justify="center"
  >
    <VCol
      cols="12"
      class="text-left"
    >
      <div class="d-flex align-center justify-space-between">
        <VBtn
          prepend-icon="mdi-pen-add"
          text="Ajouter un commentaire"
          variant="elevated"
          color="primary"
          @click.prevent="openHistoryDialog = true"
        />
        <div v-if="props.lastEditDate">
          <span class="text-body-2"> Dernière modification du devis : </span>
          <span class="text-caption text-primary font-weight-bold">
            {{ getDateFormat(props.lastEditDate) }}
          </span>
        </div>
      </div>
    </VCol>
  </VRow>
  <VRow justify="center">
    <VCol
      cols="12"
      class="mb-5"
    >
      <SummaryTimeline
        :statuses="props.statuses"
        :histories="props.histories"
        direction="end"
      />
    </VCol>
  </VRow>
  <HistoryComment
    v-model:title="addHistoryData.title"
    v-model:content="addHistoryData.content"
    :open-dialog-history="openHistoryDialog"
    :is-saving="isPersistingHistory"
    @on-submit="onAddHistoryComment"
    @is-close-history-dialog="e => (openHistoryDialog = !openHistoryDialog)"
    @title="e => (addHistoryData.title = e)"
    @content="e => (addHistoryData.content = e)"
  />
  <VSnackbar
    :timeout="5000"
    :color="notificationContent.alertType"
    v-model="isDisplayAlert"
  >
    <h3 class="text-h6 text-white font-weight-bold mb-2">{{ notificationContent.title }}</h3>
    {{ notificationContent.text }}
  </VSnackbar>
</template>
