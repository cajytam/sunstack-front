<script setup lang="ts">
import { useDisplay } from 'vuetify'

import {
  deleteFileSurvey,
  getSurveySimulation,
  patchSurvey,
  patchSurveySimulation,
  rotateImageSurvey,
  statusesSurvey,
} from '@/services/surveyService'
import { getCurrentDateForDatabase, getDateFormat } from '@/utils/dateUtils'
import { useUserStore } from '@/stores/user'
import { postNotificationSurveyToUser } from '@/services/notificationService'

interface Props {
  surveyId: number | null
  surveySimulationId: string
  surveyName: string
  surveyType: string
  surveyOptions: Array | null
  surveyValue: string | null
  surveyStatus: string | null
  surveyReviewedAt: string | null
  surveyReviewedBy: string | null
  surveySendBy: string | null
  surveyComment: string | null
  surveyFiles: Array | null
  canControlSurvey: boolean
  surveySendAt: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  changeContent: [value: string]
  uploadFile: [value: Array<File>]
  refreshData: [value: boolean]
}>()

const baseURLFileSurvey = import.meta.env.VITE_API_SURVEY_FILE

/*
 preview Image
 */
const url = ref([])
const fileInput = ref([])
const selectedItem = ref([])

const previewImage = image => {
  url.value = []
  if (image && image.length > 0) {
    image.forEach(file => {
      url.value.push(URL.createObjectURL(file))
      emit('uploadFile', file)
    })
  }
}

const isFileImage = file => {
  return file && file.type.split('/')[0] === 'image'
}

const isImage = filename => {
  if (!filename) return false

  const imageExtensions = ['gif', 'jpg', 'jpeg', 'png', 'webp']

  return imageExtensions.includes(filename.split('.').pop())
}

const { mdAndDown } = useDisplay()

/**
 * Gestion décisions
 */
const listDecisions = [
  { key: 'V', name: 'Valider', color: 'success' },
  { key: 'C', name: 'À corriger', color: 'warning' },
  { key: 'R', name: 'Rejeter le projet', color: 'error' },
]

const selectedDecision = ref()
const justificationDecision = ref('')
const isPersistingDecision = ref(false)
const responseDecision = ref(null)

const deleteFileDisplayAlert = ref([])

const userStore = useUserStore()
const { authUser } = userStore

const onChangeDecision = () => {
  if (selectedDecision.value.length > 0) {
    isPersistingDecision.value = true

    patchSurvey(props.surveyId, {
      statusValidation: selectedDecision.value,
      reviewedAt: getCurrentDateForDatabase(),
      reviewedBy: authUser.uri,
    })
      .then(res => {
        if (process.env.NODE_ENV === 'development') console.log(res)

        responseDecision.value = res.statusValidation

        getSurveySimulation(props.surveySimulationId)
          .then(res => {
            if (process.env.NODE_ENV === 'development') console.log(res)

            const notificationTitle = `Devis ${res.simulation.name}`
            const idSimulation = res.simulation.id

            patchSurveySimulation(props.surveySimulationId, {
              status: res.highestStatus,
              statusUpdatedAt: getCurrentDateForDatabase(),
            })
              .then(res => {
                if (process.env.NODE_ENV === 'development') console.log(res)

                if (res && res.statusForSendingNotification) {
                  let notificationBody

                  switch (res.highestStatus) {
                    case 'C':
                      notificationBody = '⚠️ Survey à corriger'
                      break

                    case 'V':
                      notificationBody = '✅ Survey validé'
                      break

                    case 'R':
                      notificationBody = '❌ Survey rejeté : projet refusé'
                      break

                    default:
                      notificationBody = 'Survey traité'
                  }

                  postNotificationSurveyToUser(
                    res.surveyListOfUsersWhoParticipated,
                    notificationTitle,
                    notificationBody,
                    idSimulation,
                    { tab: 'surveys' },
                  )
                    .then(response => {
                      if (process.env.NODE_ENV === 'development') console.log('notifications', response)
                    })
                    .catch(err => console.error(err))
                }
              })
              .catch(err => console.error(err))
          })
          .catch(err => console.error(err))
      })
      .catch(err => console.error(err))
      .finally(() => (isPersistingDecision.value = false))
  }
}

const onDeleteFile = idFile => {
  deleteFileSurvey(idFile)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      emit('refreshData', true)
    })
    .catch(err => console.error(err))
}

/**
 * Gestion commentaire
 */
const isPersistingComment = ref(false)
const isCommentPersisted = ref(false)

const addComment = () => {
  isPersistingComment.value = true

  patchSurvey(props.surveyId, {
    comment: justificationDecision.value,
  })
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      isCommentPersisted.value = true
      setTimeout(() => {
        isCommentPersisted.value = false
      }, 5000)
    })
    .catch(err => console.error(err))
    .finally(() => (isPersistingComment.value = false))
}

const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

const cacheKey = ref([])
const isRotatingImage = ref([])
const isLockedRotation = ref(false)

const onRotateImage = (idImage, direction) => {
  isRotatingImage.value[direction] = true
  isLockedRotation.value = true
  rotateImageSurvey(idImage, direction)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)
    })
    .catch(err => console.error(err))
    .finally(() => {
      isLockedRotation.value = false
      isRotatingImage.value[direction] = false
      cacheKey.value[idImage] = new Date().getTime()
    })
}
</script>

<template>
  <VRow align="stretch">
    <VCol
      cols="12"
      :md="props.surveyStatus && props.surveyStatus !== 'B' ? 8 : 12"
      :class="{ 'pb-0': mdAndDown }"
    >
      <VCard
        class="py-4 px-8 fill-height"
        :class="{ 'rounded-b-0': mdAndDown }"
      >
        <h6 class="d-flex align-center text-h6 font-weight-bold">
          <VIcon
            icon="solar:pin-list-bold"
            color="primary"
            class="me-5"
          />
          {{ props.surveyName }}
        </h6>
        <template
          v-if="
            canControlSurvey
              ? props.surveyStatus !== 'V' && props.surveyStatus !== 'R'
              : props.surveyStatus !== 'V' && props.surveyStatus !== 'A' && props.surveyStatus !== 'R'
          "
        >
          <VCardText v-if="props.surveyType === 'select'">
            <VSelect
              :placeholder="props.surveyName"
              variant="filled"
              :items="props.surveyOptions"
              :model-value="props.surveyValue"
              :item-title="props.surveyOptions"
              @update:model-value="$emit('changeContent', $event)"
            />
          </VCardText>
          <VCardText v-else-if="props.surveyType === 'text' || props.surveyType === 'date'">
            <VTextField
              :placeholder="props.surveyName"
              :type="props.surveyType"
              :min="props.surveyType === 'date' ? '1900-01-01' : null"
              :model-value="props.surveyValue"
              @update:model-value="$emit('changeContent', $event)"
            />
          </VCardText>
          <VCardText v-else-if="props.surveyType === 'file'">
            <VFileInput
              v-model="fileInput"
              clearable
              chips
              multiple
              capture="environment"
              show-size
              :accept="isMobile() ? 'image/*' : 'image/*, application/pdf'"
              @change="previewImage(fileInput)"
              @click:clear="url = []"
              @update:model-value="$emit('uploadFile', fileInput)"
            />
            <VExpandXTransition mode="out-in">
              <VContainer v-if="url && url.length > 0">
                <VRow
                  justify="start"
                  align="baseline"
                >
                  <VCol
                    v-for="(file, index) in fileInput"
                    :key="index"
                    :cols="props.surveyStatus && props.surveyStatus !== 'B' ? 4 : 3"
                  >
                    <VCard
                      variant="outlined"
                      color="secondary"
                    >
                      <VCardText class="pb-0">
                        <h6 class="text-h6">Aperçu du fichier</h6>
                        <span class="font-italic text-caption">
                          Le fichier n'est pas encore enregistré. Pour uploader ce fichier, merci de cliquer sur
                          "Enregistrer" ou "Envoyer pour validation" en bas de la page
                        </span>
                      </VCardText>
                      <VCardItem>
                        <VImg
                          v-if="file && isFileImage(file)"
                          :src="url[index]"
                          aspect-ratio="16/9"
                          cover
                        />
                        <iframe
                          v-if="file.name.split('.').pop() === 'pdf'"
                          height="300"
                          :src="url[index]"
                          title="Vidéo YouTube : L'accessibilité numérique à toutes les étapes d'un projet"
                        />
                      </VCardItem>
                    </VCard>
                  </VCol>
                </VRow>
              </VContainer>
            </VExpandXTransition>
          </VCardText>
        </template>
        <VCardText
          v-else-if="!props.surveyFiles"
          class="text-h6 font-weight-bold text-secondary"
        >
          <span>
            {{ props.surveyType === 'date' ? getDateFormat(props.surveyValue, 'dateFormatFRBis') : props.surveyValue }}
          </span>
        </VCardText>
        <VCardText v-if="props.surveyFiles">
          <VContainer>
            <VRow
              justify="start"
              align="baseline"
            >
              <VCol
                v-for="(image, index) in props.surveyFiles"
                :key="image.id"
                :cols="props.surveyStatus && props.surveyStatus !== 'B' ? 6 : 4"
              >
                <VCard
                  class="mt-5 card-file"
                  border
                  max-width="500"
                  :set="cacheKey[image.id] = new Date().getTime()"
                >
                  <VCardTitle class="d-flex justify-space-between px-2 mb-3">
                    <span>{{ isImage(image.filename) ? 'Photo actuelle' : 'Fichier actuel' }}</span>
                    <div v-if="isImage(image.filename)">
                      <VBtn
                        icon="ant-design:rotate-left-outlined"
                        variant="tonal"
                        size="small"
                        color="info"
                        class="card-file__btn-rotate-right mr-2"
                        :loading="isRotatingImage.left"
                        :disabled="isLockedRotation"
                        @click="onRotateImage(image.id, 'left')"
                      />
                      <VBtn
                        icon="ant-design:rotate-right-outlined"
                        variant="tonal"
                        size="small"
                        color="info"
                        class="card-file__btn-rotate-left"
                        :loading="isRotatingImage.right"
                        :disabled="isLockedRotation"
                        @click="onRotateImage(image.id, 'right')"
                      />
                    </div>
                    <VMenu
                      v-if="
                        canControlSurvey
                          ? props.surveyStatus !== 'V' && props.surveyStatus !== 'R'
                          : props.surveyStatus !== 'V' && props.surveyStatus !== 'A' && props.surveyStatus !== 'R'
                      "
                      v-model="deleteFileDisplayAlert[index]"
                      location="top"
                      transition="slide-y-reverse-transition"
                    >
                      <template #activator="{ props }">
                        <VBtn
                          size="small"
                          variant="tonal"
                          color="error"
                          icon="mdi-delete"
                          v-bind="props"
                          class="card-file__btn-delete"
                        />
                      </template>
                      <VCard
                        min-width="300"
                        class="border"
                      >
                        <VCardTitle class="text-center">
                          <span class="text-caption font-italic"> Confirmer la suppression ? </span>
                        </VCardTitle>
                        <VCardActions class="justify-center">
                          <VBtn
                            prepend-icon="fluent:delete-12-regular"
                            text="Supprimer"
                            color="error"
                            variant="elevated"
                            size="small"
                            @click="onDeleteFile(image.id)"
                          />
                          <VBtn
                            text="Annuler"
                            color="secondary"
                            variant="text"
                            size="small"
                          />
                        </VCardActions>
                      </VCard>
                    </VMenu>
                  </VCardTitle>
                  <div v-if="isImage(image.filename)">
                    <VImg
                      class="cursor-pointer current-img"
                      :src="`${baseURLFileSurvey + image.id}?cache=${cacheKey[image.id]}`"
                      max-height="300"
                      @click="selectedItem[index] = true"
                    />
                    <VDialog
                      v-model="selectedItem[index]"
                      fullscreen
                    >
                      <VImg
                        width="100vw"
                        :src="
                          selectedItem[index]
                            ? `${baseURLFileSurvey + image.id}/display?cache=${cacheKey[image.id]}`
                            : ''
                        "
                        @click="selectedItem[index] = false"
                      />
                    </VDialog>
                  </div>
                  <div v-else>
                    <iframe
                      width="500"
                      height="300"
                      :src="`${baseURLFileSurvey + image.id}/display`"
                    />
                    <VCardText>
                      <VBtn
                        text="Ouvrir dans un nouvel onglet"
                        variant="elevated"
                        prepend-icon="lucide:eye"
                        color="green-sunstack-darker"
                        size="small"
                        :href="`${baseURLFileSurvey + image.id}/display`"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    </VCardText>
                  </div>
                </VCard>
              </VCol>
            </VRow>
          </VContainer>
        </VCardText>
      </VCard>
    </VCol>
    <VCol
      v-if="props.surveyStatus && props.surveyStatus !== 'B'"
      cols="12"
      md="4"
      :class="{ 'pt-0': mdAndDown }"
    >
      <VCard
        class="fill-height"
        :class="{ 'rounded-t-0': mdAndDown }"
        :color="canControlSurvey && props.surveyStatus === 'A' ? null : statusesSurvey[props.surveyStatus].color"
        :variant="canControlSurvey && props.surveyStatus === 'A' ? 'elevated' : 'tonal'"
        elevation="14"
      >
        <VCardText class="d-flex align-center justify-center">
          <VProgressCircular
            v-if="isPersistingDecision"
            indeterminate
            color="info"
            :size="28"
            :width="5"
          />
          <VChip
            v-else-if="responseDecision"
            :text="responseDecision === 'V' ? 'Validé' : responseDecision === 'C' ? 'A corriger' : 'Dossier refusé'"
            :color="responseDecision === 'V' ? 'success' : responseDecision === 'C' ? 'warning' : 'error'"
          />
          <VChip
            v-else
            :text="statusesSurvey[props.surveyStatus].text"
            :color="statusesSurvey[props.surveyStatus].color"
            variant="elevated"
          />
        </VCardText>
        <VCardText v-if="canControlSurvey && props.surveyStatus === 'A'">
          <VRow v-if="props.surveySendBy">
            <VCol class="d-flex align-end flex-column font-italic">
              <div class="d-flex align-center justify-center">
                <span class="text-caption">Envoyé par&nbsp;</span>
                <span class="text-body-1 text-info font-weight-bold">
                  {{ props.surveySendBy }}
                </span>
              </div>
              <div
                v-if="props.surveySendAt"
                class="text-caption"
              >
                <span>le </span>
                <span class="font-weight-bold">
                  {{ getDateFormat(props.surveySendAt) }}
                </span>
              </div>
            </VCol>
          </VRow>
          <VRow>
            <VCol>
              <VRadioGroup
                v-model="selectedDecision"
                inline
                @update:model-value="onChangeDecision"
              >
                <VRadio
                  v-for="radio in listDecisions"
                  :key="radio.key"
                  :label="radio.name"
                  :color="radio.color"
                  :value="radio.key"
                  true-icon="typcn:tick"
                />
              </VRadioGroup>
            </VCol>
          </VRow>
          <VRow>
            <VCol>
              <VTextarea
                v-model="justificationDecision"
                prepend-icon="pepicons-print:text-bubble"
                label="Justification (facultative)"
                variant="outlined"
                :loading="isPersistingComment"
              />
            </VCol>
          </VRow>
          <VExpandTransition mode="out-in">
            <VRow v-if="isCommentPersisted">
              <VCol>
                <VAlert
                  title="Le commentaire a bien été enregistré"
                  border="start"
                  color="success"
                  variant="tonal"
                />
              </VCol>
            </VRow>
          </VExpandTransition>
          <VRow>
            <VCol class="d-flex justify-end">
              <VScaleTransition mode="out-in">
                <VBtn
                  v-if="justificationDecision.length > 0"
                  color="yellow-sunstack"
                  prepend-icon="akar-icons:save"
                  text="Enregistrer commentaire"
                  size="small"
                  :loading="isPersistingComment"
                  @click="addComment"
                />
              </VScaleTransition>
            </VCol>
          </VRow>
        </VCardText>
        <VCardText v-else-if="props.surveyReviewedBy">
          <div class="text-h6">
            <span>par </span>
            <span class="font-weight-bold text-decoration-underline">
              {{ props.surveyReviewedBy }}
            </span>
            <span class="d-block text-caption">le {{ getDateFormat(surveyReviewedAt) }}</span>
          </div>
          <p
            v-if="props.surveyComment"
            class="cartoon-bubble mt-6"
            :class="`cartoon-bubble__${statusesSurvey[props.surveyStatus].color}`"
          >
            {{ props.surveyComment }}
          </p>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style scoped lang="scss">
p.cartoon-bubble {
  position: relative;
  max-width: 30em;

  background-color: #fff;
  padding: 0.875em 1em;
  border-radius: 1rem;
  box-shadow:
    0 0.125rem 0.5rem rgba(0, 0, 0, 0.3),
    0 0.0625rem 0.125rem rgba(0, 0, 0, 0.2);

  &::before {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    bottom: 100%;
    left: 1.5em;
    border: 0.75rem solid transparent;
    border-top: none;

    border-bottom-color: #fff;
    filter: drop-shadow(0 -0.0625rem 0.0625rem rgba(0, 0, 0, 0.1));
  }
}

.cartoon-bubble__error {
  border-left: rgb(var(--v-theme-error)) 10px solid;
}

.cartoon-bubble__warning {
  border-left: rgb(var(--v-theme-warning)) 10px solid;
}

.current-img {
  transition: all 0.2s ease-in;

  &:hover {
    opacity: 0.5;
  }
}

.card-file {
  transition: all 0.2s ease-out;

  .card-file__btn-delete,
  .card-file__btn-rotate-left,
  .card-file__btn-rotate-right {
    visibility: hidden;
    opacity: 0;
  }

  &:hover {
    .card-file__btn-delete,
    .card-file__btn-rotate-left,
    .card-file__btn-rotate-right {
      visibility: visible;
      opacity: 1;
    }
  }
}
</style>
