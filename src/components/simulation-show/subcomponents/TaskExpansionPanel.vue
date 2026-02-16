<script setup lang="ts">
import { roles_name } from '@/services/roleService'
import { useUserStore } from '@/stores/user'
import { getCurrentDateForDatabase, getDateFormat, getTimeAgo } from '@/utils/dateUtils'
import {
  patchTaskSimulationData,
  postNotificationTask,
  postTaskSimulationCommentData,
} from '@/services/taskSimulationService'
import { postFileTaskSimulation } from '@/services/fileService'

interface Props {
  task: Object
  simulationId: string
  customerName: string | null
  simulationNumber: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  hasAddedMessageOrFile: [value: Object]
  hasBeenClosed: [value: Object]
}>()

const baseURLFileTask = import.meta.env.VITE_API_TASK_FILE
const baseURL = import.meta.env.VITE_API_URI

const userStore = useUserStore()
const { authUser } = userStore

const taskMessage = ref([])
const isPersistingMessage = ref([])
const isPersistingFile = ref(false)
let countTreatedData

const onAddComment = () => {
  if (!taskMessage.value[props.task.id] || taskMessage.value[props.task.id] < 0) return

  isPersistingMessage.value[props.task.id] = true

  postTaskSimulationCommentData({
    uriUser: authUser.uri,
    comment: taskMessage.value[props.task.id],
    idTask: props.task.id,
  })
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log('ajout_commentaire => ', res)

      patchTaskSimulationData(props.task.id, {
        updatedAt: getCurrentDateForDatabase(),
      })
        .then(res => {
          if (process.env.NODE_ENV === 'development') console.log('update date updatedAt task => ', res)
        })
        .catch(err => console.error(err))

      const dataComment = {}

      dataComment.type = 'comment'
      dataComment.date = res.createdAt
      dataComment.user = res.addedBy
      dataComment.id = res.id
      dataComment.content = res.comment
      emit('hasAddedMessageOrFile', { dataTask: dataComment, indexTask: props.task.index })
      taskMessage.value[props.task.id] = null
    })
    .catch(err => console.error(err))
    .finally(() => (isPersistingMessage.value[props.task.id] = false))
}

/*
   GESTION AJOUT FICHIER CHAT
*/
const dialogChatAddFile = ref(false)
const chatChosenFiles = ref([])

const onSubmitChatFile = async () => {
  if (chatChosenFiles.value && chatChosenFiles.value.length > 0) {
    isPersistingFile.value = true

    await new Promise(resolve => {
      countTreatedData = 0

      chatChosenFiles.value.forEach(file => {
        postFileTaskSimulation(`/api/task_simulations/${props.task.id}`, file, authUser.uri)
          .then(res => {
            if (process.env.NODE_ENV === 'development') console.log('ajout fichier task => ', res.data)

            patchTaskSimulationData(props.task.id, {
              updatedAt: getCurrentDateForDatabase(),
            })
              .then(res => {
                if (process.env.NODE_ENV === 'development') console.log('update date updatedAt task => ', res)
              })
              .catch(err => console.error(err))

            const dataFile = {}

            dataFile.type = 'file'
            dataFile.date = res.data.addedAt
            dataFile.user = res.data.user
            dataFile.id = res.data.id
            dataFile.content = res.data.name
            emit('hasAddedMessageOrFile', { dataTask: dataFile, indexTask: props.task.index })

            countTreatedData++
            if (countTreatedData === chatChosenFiles.value.length) resolve()
          })
          .catch(err => console.error(err))
      })
    })
    isPersistingFile.value = false
    dialogChatAddFile.value = false
    chatChosenFiles.value = []
  }
}
/*
   FIN GESTION AJOUT FICHIER CHAT
*/

/*
  NOTIFICATION TASK
*/
const sendTaskNotification: Promise = (message: string) => {
  postNotificationTask(
    authUser.id,
    props.task.targetGroups,
    props.task.targetUser,
    `${props.customerName} - ${props.simulationNumber}`,
    message,
    props.simulationId,
    props.task.openedBy.id,
    { tab: 'management', task: props.task.id },
  )
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log('notification:tâche cloturée =>', res)
    })
    .catch(err => console.error(err))
}

/*
  FIN NOTIFICATION TASK
*/

/*
  GESTION CLOTURE D'UNE TACHE
 */
const isClosingTask = ref(false)

const onCloseTask = () => {
  isClosingTask.value = true
  patchTaskSimulationData(props.task.id, {
    closedBy: authUser.uri,
    doneAt: getCurrentDateForDatabase(),
  })
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      sendTaskNotification('🔏 Tâche cloturée')

      emit('hasBeenClosed', { doneAt: res.doneAt, closedBy: res.closedBy, indexTask: props.task.index })
    })
    .catch(err => console.error(err))
    .finally(() => (isClosingTask.value = false))
}

/*
  FIN GESTION CLOTURE D'UNE TACHE
 */
</script>

<template>
  <VDialog
    v-model="dialogChatAddFile"
    width="1024"
  >
    <VCard class="pt-3">
      <VCardText class="text-center">
        <VFileInput
          v-model="chatChosenFiles"
          label="Joindre des fichiers"
          chips
          multiple
          variant="underlined"
          :loading="isPersistingFile"
        />
        <span class="mt-3 text-xs font-italic">Les fichiers seront enregistrés avec leur nom d'origine</span>
      </VCardText>
      <VCardText class="d-flex justify-end">
        <VBtn
          color="secondary"
          variant="text"
          text="Fermer"
          size="small"
          @click="dialogChatAddFile = false"
        />
        <VBtn
          text="Ajouter fichier(s)"
          color="primary"
          variant="elevated"
          prepend-icon="mdi-file-document-add-outline"
          :loading="isPersistingFile"
          size="small"
          @click="onSubmitChatFile"
        />
      </VCardText>
    </VCard>
  </VDialog>
  <VExpansionPanel
    class="mb-1"
    :value="props.task.id"
  >
    <VExpansionPanelTitle
      :class="{ 'font-weight-bold text-h6': !props.task.doneAt }"
      :color="props.task.doneAt ? 'secondary' : 'info'"
    >
      {{ props.task.title }}
    </VExpansionPanelTitle>
    <VExpansionPanelText
      class="border rounded-b chat-content-container text-wrap text-left"
      :class="props.task.doneAt ? 'border-secondary' : 'border-info'"
    >
      <div class="d-flex align-start">
        <div class="me-4">
          <VAvatar
            size="36"
            :image="
              props.task.openedBy.picture
                ? `${baseURL}img/users/${props.task.openedBy.picture}`
                : `${baseURL}img/logo/no-avatar.jpg
            `
            "
          />
        </div>
        <div class="d-inline-flex flex-column align-start">
          <div class="text-sm mt-2 mb-3">
            <span>Tâche créée par&nbsp;</span>
            <span class="font-weight-bold">
              {{ props.task.openedBy.fullName }}
            </span>
            <span>&nbsp;le&nbsp;</span>
            <span class="font-weight-bold">
              {{ getDateFormat(props.task.createdAt) }}
            </span>
            <span> et attribuée à </span>
            <template v-if="props.task.targetGroups && props.task.targetGroups.length > 0">
              <VChip
                v-for="(group, index) in props.task.targetGroups"
                :class="{ 'mr-1': index !== props.task.targetGroups.length - 1 }"
                class="px-2"
                color="info"
              >
                {{ roles_name[group].fullname }}
              </VChip>
            </template>
            <template v-if="props.task.targetUser">
              <VChip
                :prepend-avatar="
                  props.task.targetUser.picture
                    ? `${baseURL}img/users/${props.task.targetUser.picture}`
                    : `${baseURL}img/logo/no-avatar.jpg
                  `
                "
                class="px-2 mx-2"
                color="info"
              >
                {{ props.task.targetUser.fullName }}
              </VChip>
            </template>
          </div>
        </div>
      </div>
      <template v-if="props.task.description">
        <div
          class="bg-surface text-h6 font-weight-bold mx-auto elevation-12 py-3 px-5 mb-5 text-left border rounded border-info-200 chat-content__main-description"
          v-html="props.task.description.replaceAll(/\r\n|\r|\n/g, '<br>')"
        />
      </template>
      <div
        v-else
        class="mx-auto elevation-2 py-1 px-5 mb-5 text-left border rounded chat-content__main-description"
      >
        <span class="text-caption font-italic"> Aucune description n'a été saisie </span>
      </div>
      <div v-for="(data, index) in props.task.data">
        <div
          class="d-flex align-center"
          :class="[
            props.task.data.length - 1 !== index && data.user.id !== props.task.data[index + 1].user.id
              ? 'mb-8'
              : 'mb-2',
            data.user.id === authUser.id ? 'flex-row-reverse' : '',
          ]"
        >
          <div :class="data.user.id === authUser.id ? 'ms-4' : 'me-4'">
            <VAvatar
              size="36"
              :image="
                data.user.picture
                  ? `${baseURL}img/users/${data.user.picture}`
                  : `${baseURL}img/logo/no-avatar.jpg
              `
              "
            />
          </div>
          <div
            class="d-inline-flex flex-column"
            :class="data.user.id === authUser.id ? 'align-end' : 'align-start mt-2'"
          >
            <h6
              v-if="data.type === 'comment' && data.user.id !== authUser.id"
              class="text-secondary"
            >
              {{ data.user.fullName }}
            </h6>
            <div
              v-if="data.type === 'comment'"
              class="text-body-1 chat-content bg-surface elevation-8 px-4 d-inline py-2 mb-0"
              :class="data.user.id === authUser.id ? 'text-right chat-right' : 'text-left chat-left'"
              v-html="data.content.replaceAll(/\r\n|\r|\n/g, '<br>')"
            />
            <div
              v-else-if="data.type === 'file'"
              class="text-body-1 mt-2 d-block"
              :class="data.user.id === authUser.id ? 'text-right' : 'text-left'"
            >
              <div>
                <span v-if="data.user.id === authUser.id"> Vous </span>
                <span
                  v-else
                  class="font-weight-bold"
                >
                  {{ data.user.fullName }}
                </span>
                <span> {{ data.user.id === authUser.id ? 'avez ' : '&nbsp;a' }} ajouté le fichier </span>
                <VChip
                  :text="data.content"
                  :href="`${baseURLFileTask + data.id}/display`"
                  target="_blank"
                  size="small"
                  rel="noopener noreferrer"
                  prepend-icon="material-symbols:attachment"
                  variant="tonal"
                  color="yellow-sunstack"
                />
              </div>
            </div>
            <div>
              <VTooltip
                :text="getDateFormat(data.date)"
                :location="data.user.id === authUser.id ? 'start' : 'end'"
              >
                <template #activator="{ props }">
                  <span
                    v-bind="props"
                    :class="{ 'text-right': data.user.id === authUser.id }"
                    class="text-caption font-italic mb-1 text-secondary"
                  >
                    {{ getTimeAgo(data.date) }}
                  </span>
                </template>
              </VTooltip>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="!props.task.doneAt"
        class="mt-12 bg-surface"
      >
        <VTextarea
          v-model="taskMessage[props.task.id]"
          rows="3"
          placeholder="Saisissez votre texte (Entrée + Ctrl pour envoyer)"
          @keydown.enter.ctrl.prevent="onAddComment"
        >
          <template #append-inner>
            <div class="d-flex flex-row gap-y-3 justify-center align-center ml-3">
              <VMenu
                location="left"
                transition="slide-y-reverse-transition"
              >
                <template #activator="{ props }">
                  <VBtn
                    icon="ic-outline-lock"
                    variant="text"
                    color="warning"
                    size="small"
                    v-bind="props"
                  />
                </template>
                <VCard
                  min-width="300"
                  class="border"
                >
                  <VCardTitle class="text-center">
                    <span class="text-caption font-italic"> Clôturer cette tâche ? </span>
                  </VCardTitle>
                  <VCardActions class="justify-center gap-x-3">
                    <VBtn
                      prepend-icon="tabler:lock"
                      text="Clôturer"
                      color="warning"
                      variant="elevated"
                      size="small"
                      :loading="isClosingTask"
                      :disabled="isClosingTask"
                      @click="onCloseTask"
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
              <VBtn
                icon="material-symbols:attachment"
                variant="text"
                @click="dialogChatAddFile = true"
              />
              <VBtn
                text="Envoyer"
                prepend-icon="tabler:send"
                :loading="isPersistingMessage[props.task.id]"
                :disabled="isPersistingMessage[props.task.id]"
                @click="onAddComment"
              />
            </div>
          </template>
        </VTextarea>
      </div>
      <div
        v-else
        class="d-flex align-start"
      >
        <div class="me-4">
          <VAvatar
            size="36"
            :image="
              props.task.closedBy.picture
                ? `${baseURL}img/users/${props.task.closedBy.picture}`
                : `${baseURL}img/logo/no-avatar.jpg
            `
            "
          />
        </div>
        <div class="d-inline-flex flex-column align-start">
          <div class="text-sm mt-2 mb-3">
            <span>La tâche a été cloturée par&nbsp;</span>
            <span class="font-weight-bold">
              {{ props.task.closedBy.fullName }}
            </span>
            <span>&nbsp;le&nbsp;</span>
            <span class="font-weight-bold">
              {{ getDateFormat(props.task.doneAt) }}
            </span>
          </div>
        </div>
      </div>
    </VExpansionPanelText>
  </VExpansionPanel>
</template>

<style scoped lang="scss">
.task-card-title__container {
  background-color: var(--grey-sunstack-darker) !important;
}

.task-card-title__text {
  color: white !important;
}

.chat-content-container {
  padding: 0.8rem 1rem 1rem;
  background-color: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
}

.chat-content__main-description {
  width: 90%;
  font-size: 1.1rem !important;
  line-height: 2rem !important;
  border-left-width: 0.7rem !important;
  border-right-width: 0.7rem !important;
}

.chat-content {
  border-end-end-radius: 0.6rem !important;
  border-end-start-radius: 0.6rem !important;
}

.chat-left {
  border-start-end-radius: 0.6rem !important;
}

.chat-right {
  border-start-start-radius: 0.6rem !important;
}

:deep(textarea.v-field__input) {
  resize: none !important;
}
</style>
