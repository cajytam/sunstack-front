<script setup lang="ts">
import { post } from '@/services/api'
import { getSurveySimulation, patchSurvey, patchSurveySimulation, postSurvey } from '@/services/surveyService'
import { useUserStore } from '@/stores/user'

import { getCurrentDateForDatabase } from '@/utils/dateUtils'
import { postNotificationSurveyToRoles } from '@/services/notificationService'
import { ability } from '@/plugins/casl/casl'

/**
 * Route
 */
const route = useRoute()
const surveyId = route.params.surveyId && route.params.surveyId !== 'new' ? route.params.surveyId : null

/**
 * Gestion des droits
 */
const userStore = useUserStore()
const { authUser } = userStore
const canControl = ref(false)

/**
 * gestion données
 */
const simulationId = ref(null)
const isError404 = ref(false)
const simulationAndSurveyData = ref([])
const surveyItems = ref([])
const surveys = ref([])
const surveysOld = ref([])
const highestStatus = ref(null)

/**
 * Alert
 */
const alert = ref({
  display: false,
  text: null,
  color: null,
})

const countModification = ref(0)
const countNullContent = ref(0)

/**
 * UX
 */
const isLoading = ref(true)
const isPersisting = ref(false)
const isPersistingForValidation = ref(false)
const isDisabled = ref(false)

onMounted(() => {
  if (surveyId) doLoadData()
  else isLoading.value = false
})

const doLoadData = () => {
  getSurveySimulation(surveyId)
    .then(res => {
      if (res.status === 404) {
        isError404.value = true
        throw new Error('Survey introuvable')
      }
      canControl.value = ability.can('manage', 'all')
        ? true
        : authUser.roles.some(r => {
            res.surveyStep.whoCanControl.includes(r)
          })

      simulationId.value = res.simulation.id

      isDisabled.value = res.status !== 'B' && res.status !== 'C'

      highestStatus.value = res.highestStatus

      surveys.value = res.surveyStep.surveyItems

      surveys.value.forEach(item => {
        const survey = res.simulation.surveys.filter(s => s.surveyItem.id === item.id)
        if (survey.length > 0) {
          item.survey = survey
          item.survey[0].uploadFile = []
        } else {
          item.survey = [
            {
              content: null,
              reviewedBy: { fullName: null },
              statusValidation: null,
              reviewedAt: null,
              comment: null,
              id: null,
              fileSurveys: null,
              uploadFile: [],
            },
          ]
        }
      })

      surveyItems.value = res.surveyStep
      simulationAndSurveyData.value = res.simulation

      if (process.env.NODE_ENV === 'development') console.log(res)

      surveysOld.value = JSON.parse(JSON.stringify(surveys.value))
    })
    .finally(() => (isLoading.value = false))
}

const onSaveSurveys = async (e, isSendForValidation: boolean = false) => {
  countModification.value = 0
  countNullContent.value = 0

  isSendForValidation ? (isPersistingForValidation.value = true) : (isPersisting.value = true)

  if (isSendForValidation) {
    for (const item of surveys.value) {
      if (
        item.survey[0].statusValidation !== 'V' &&
        !(item.survey[0].content || (item.survey[0].uploadFile.length > 0 && item.survey[0].uploadFile[0].length > 0))
      ) {
        countNullContent.value++
      }
    }
  }

  const processItem = async item => {
    if (countNullContent.value > 0) return

    if (item.survey[0].id === null) {
      const res = await postSurvey(
        simulationId.value,
        item.id,
        authUser.uri,
        item.survey[0].content,
        isSendForValidation ? 'A' : 'B',
      )

      countModification.value++
      item.survey[0].id = res.id

      if (item.survey[0].uploadFile.length > 0 && item.survey[0].uploadFile[0].length > 0) {
        await Promise.all(
          item.survey[0].uploadFile[0].map(async file => {
            const uploadRes = await onUploadFile(file, res['@id'])

            if (process.env.NODE_ENV === 'development') console.log(uploadRes)
          }),
        )
      }
    } else {
      const content =
        item.survey[0].uploadFile.length > 0 && item.survey[0].uploadFile[0].length > 0 ? null : item.survey[0].content

      const changeStatus = isSendForValidation
        ? true
        : canControl
          ? highestStatus.value !== null
            ? highestStatus.value === 'V' || highestStatus.value === 'R'
            : true
          : true

      const data = {
        ...(item.survey[0].content && { content }),
        ...(item.survey[0].statusValidation &&
          changeStatus && { statusValidation: isSendForValidation ? 'A' : item.survey[0].statusValidation }),
        ...(item.survey[0].reviewedBy && {
          reviewedBy: isSendForValidation ? null : `/api/users/${item.survey[0].reviewedBy.id}`,
        }),
        ...(item.survey[0].comment && { comment: isSendForValidation ? null : item.survey[0].comment }),
        ...(item.survey[0].sentBy && { sentBy: `/api/users/${item.survey[0].sentBy.id}` }),
        ...(item.survey[0].reviewedAt && { reviewedAt: isSendForValidation ? null : item.survey[0].reviewedAt }),
      }

      const res = await patchSurvey(item.survey[0].id, data)

      countModification.value++

      if (item.survey[0].uploadFile.length > 0 && item.survey[0].uploadFile[0].length > 0) {
        await Promise.all(
          item.survey[0].uploadFile[0].map(async file => {
            const uploadRes = await onUploadFile(file, res['@id'])
            if (process.env.NODE_ENV === 'development') console.log(uploadRes)
          }),
        )
      }
    }
  }

  await Promise.all(surveys.value.map(processItem))

  if (isSendForValidation) {
    await patchSurveySimulation(surveyId, { status: 'A' })
    isDisabled.value = true
  }

  // on met à jour le status de la survey simulation
  getSurveySimulation(surveyId).then(res => {
    if (process.env.NODE_ENV === 'development') console.log(res)

    highestStatus.value = res.highestStatus

    patchSurveySimulation(surveyId, {
      status: res.highestStatus,
      statusUpdatedAt: getCurrentDateForDatabase(),
    })
      .then(res => {
        if (process.env.NODE_ENV === 'development') console.log(res)

        // si des roles sont définies pour controller, on envoie une notification
        if (surveyItems.value.whoCanControl && surveyItems.value.whoCanControl.length > 0 && isSendForValidation) {
          postNotificationSurveyToRoles(
            surveyItems.value.whoCanControl,
            `Devis ${simulationAndSurveyData.value.name}`,
            '🕵️ Survey à valider',
            simulationAndSurveyData.value.id,
            { tab: 'surveys' },
          )
            .then(res => {
              if (process.env.NODE_ENV === 'development') console.log(res)
            })
            .catch(err => console.error(err))
        }
      })
      .catch(err => console.error(err))
  })

  // on affiche l'alerte
  displayPersistanceMessage()
  doLoadData()
}

const displayPersistanceMessage = () => {
  alert.value.display = true
  if (countNullContent.value > 0) {
    alert.value.text = "Certains champs n'ont pas été renseignés"
    alert.value.color = 'error'
  } else if (countModification.value > 0) {
    alert.value.text = 'Les modifications ont bien été enregistrées'
    alert.value.color = 'success'
  } else {
    if (isPersistingForValidation.value) {
      alert.value.text = 'Le survey a bien été envoyé en validation'
      alert.value.color = 'primary'
      isDisabled.value = true
    } else {
      alert.value.text = "Aucune modification n'a été apportée au survey"
      alert.value.color = 'warning'
    }
  }
  isPersistingForValidation.value = false
  isPersisting.value = false
  countModification.value = 0
}

const onUploadFile = (file: File, uriSurvey: string) => {
  return post(
    'fileSurvey',
    {
      file,
      survey: uriSurvey,
    },
    true,
    'multipart',
  )
}
</script>

<template>
  <VFadeTransition mode="out-in">
    <VMain
      v-if="isLoading"
      class="mx-auto mt-10"
    >
      <VRow
        align="center"
        justify="center"
      >
        <VCol
          cols="12"
          class="text-center"
        >
          <VProgressCircular
            color="primary"
            indeterminate
            :size="128"
            :width="12"
          />
        </VCol>
      </VRow>
    </VMain>
    <VMain
      v-else-if="isError404"
      class="mt-5"
    >
      <VRow justify="center">
        <VCol cols="9">
          <VAlert
            prominent
            title="Ce survey n'existe pas"
            icon="mdi-error-outline"
            color="error"
          />
        </VCol>
      </VRow>
    </VMain>
    <VMain v-else>
      <div class="text-h4">
        <span class="font-weight-bold text-primary">
          {{ surveyItems.name }}
        </span>
      </div>
      <div class="text-subtitle-1 font-italic mb-5">
        <span> pour le devis </span>
        <span class="font-weight-bold text-primary">
          {{ simulationAndSurveyData.name }}
        </span>
      </div>
      <template
        v-for="surveyItem in surveys"
        :key="surveyItem.id"
      >
        <SurveyCard
          :survey-id="surveyItem.survey[0].id ?? null"
          :survey-simulation-id="surveyId"
          :survey-name="surveyItem.name"
          :survey-type="surveyItem.type"
          :survey-options="surveyItem.options ?? null"
          :survey-value="surveyItem.survey[0].content ?? null"
          :survey-status="surveyItem.survey[0].statusValidation ?? null"
          :survey-send-by="surveyItem.survey[0].sentBy ? surveyItem.survey[0].sentBy.fullName : null"
          :survey-reviewed-by="surveyItem.survey[0].reviewedBy ? surveyItem.survey[0].reviewedBy.fullName : null"
          :survey-reviewed-at="surveyItem.survey[0].reviewedAt ?? null"
          :survey-comment="surveyItem.survey[0].comment ?? null"
          :survey-files="
            surveyItem.survey[0].fileSurveys && surveyItem.survey[0].fileSurveys.length > 0
              ? surveyItem.survey[0].fileSurveys
              : null
          "
          :can-control-survey="canControl"
          :survey-send-at="
            surveyItem.survey[0].createdAt
              ? surveyItem.survey[0].updatedAt
                ? surveyItem.survey[0].updatedAt
                : surveyItem.survey[0].createdAt
              : null
          "
          @change-content="e => (surveyItem.survey[0].content = e)"
          @upload-file="
            e => {
              if (isProxy(e)) {
                surveyItem.survey[0].uploadFile = []
                surveyItem.survey[0].uploadFile.push(e)
              }
            }
          "
          @refresh-data="
            e => {
              if (e) doLoadData()
            }
          "
        />
      </template>
      <div class="mt-8">
        <VBtn
          class="me-5"
          color="info"
          text="Enregistrer"
          prepend-icon="mdi-content-save"
          :loading="isPersisting"
          :disabled="
            canControl ? (highestStatus ? highestStatus === 'V' || highestStatus === 'R' : isDisabled) : isDisabled
          "
          @click="onSaveSurveys"
        />
        <VBtn
          color="success"
          text="Envoyer pour validation"
          prepend-icon="solar:card-send-outline"
          :loading="isPersistingForValidation"
          :disabled="isDisabled"
          @click="onSaveSurveys(e, true)"
        />
      </div>
      <VSnackbar
        v-model="alert.display"
        timeout="5000"
        :color="alert.color"
      >
        {{ alert.text }}
        <template #actions>
          <VBtn
            :color="alert.color"
            variant="flat"
            text="Fermer"
            @click="alert.display = false"
          />
        </template>
      </VSnackbar>
    </VMain>
  </VFadeTransition>
</template>
