<script setup lang="ts">
import { roles } from '@/services/roleService'
import { getAllUsers } from '@/services/userService'
import { postFileTaskSimulation } from '@/services/fileService'
import {
  getAllTasksFromSimulation,
  postNotificationTask,
  postTaskSimulationData,
} from '@/services/taskSimulationService'
import { useUserStore } from '@/stores/user'
import { ability } from '@/plugins/casl/casl'

interface Props {
  idSimulation: string
  customerName: string | null
  simulationNumber: string
}

const props = defineProps<Props>()

const baseURL = import.meta.env.VITE_API_URI

/**
 * Route
 */
const route = useRoute()

const userStore = useUserStore()
const { authUser } = userStore

const dialogNew = ref(false)

const taskData = reactive({
  title: null,
  description: null,
  openedBy: null,
  targetGroups: [],
  targetUser: null,
  idSimulation: props.idSimulation,
})

const itemRoles = roles
const itemUsers = ref([])
const taskDataLoaded = ref([])
const countTaskVisibleClosed = ref(0)
const countTaskVisibleOpened = ref(0)

const panelTask = ref([])
const panelTaskClosed = ref([])

const chosenFiles = ref([])
const isPersistingFile = ref(false)
let countTreatedData

const isSubmitted = ref(false)
const isPersisting = ref(false)
const isLoading = ref(true)

const getAllTasks = () => {
  isLoading.value = true
  taskDataLoaded.value = []

  getAllTasksFromSimulation(props.idSimulation)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      // on construit un tableau avec les data de Task
      if (res.length > 0) {
        res.forEach((task, index) => {
          const data = {}
          const taskStep = []

          data.createdAt = task.createdAt
          data.doneAt = task.doneAt ? task.doneAt : null
          data.closedBy = task.closedBy ? task.closedBy : null
          data.openedBy = task.openedBy
          data.targetGroups = task.targetGroups
          data.targetUser = task.targetUser
          data.title = task.title
          data.description = task.description
          data.id = task.id
          data.isVisible = setIsVisibleByUser(task.openedBy, task.targetGroups, task.targetUser)
          data.index = index

          if (data.isVisible && data.closedBy) {
            countTaskVisibleClosed.value++
          } else if (data.isVisible && !data.closedBy) {
            countTaskVisibleOpened.value++
          }

          if (task.fileTasks && task.fileTasks.length > 0) {
            task.fileTasks.forEach(file => {
              const dataFile = {}

              dataFile.type = 'file'
              dataFile.date = file.addedAt
              dataFile.user = file.user
              dataFile.id = file.id
              dataFile.content = file.name
              taskStep.push(dataFile)
            })
          }

          if (task.taskCommentSimulations && task.taskCommentSimulations.length > 0) {
            task.taskCommentSimulations.forEach(comment => {
              const dataComment = {}

              dataComment.type = 'comment'
              dataComment.date = comment.createdAt
              dataComment.user = comment.addedBy
              dataComment.id = comment.id
              dataComment.content = comment.comment
              taskStep.push(dataComment)
            })
          }

          // on trie les éléments par date
          if (taskStep.length > 0) {
            taskStep.sort((elem1, elem2) => {
              return new Date(elem1.date).getTime() - new Date(elem2.date).getTime()
            })
          }
          data.data = taskStep

          taskDataLoaded.value.push(data)
        })
      }
    })
    .catch(err => console.error(err))
    .finally(() => (isLoading.value = false))
}

const setIsVisibleByUser = (openedBy: Object, targetRoles?: Array, targetUser?: Object): boolean => {
  if ((targetUser && authUser.id === targetUser.id) || ability.can('manage', 'all') || openedBy.id === authUser.id)
    return true

  if (targetRoles.length > 0) {
    return authUser.roles.some(r => {
      return targetRoles.includes(r)
    })
  }

  return false
}

onMounted(() => {
  if (itemRoles.includes('ROLE_ADMIN')) itemRoles.splice(itemRoles.indexOf('ROLE_ADMIN'), 1)

  getAllTasks()

  getAllUsers().then(res => {
    if (process.env.NODE_ENV === 'development') console.log(res.data)

    itemUsers.value = res.data['hydra:member'].sort((a, b) =>
      a.fullName > b.fullName ? 1 : b.fullName.toUpperCase() > a.fullName.toUpperCase() ? -1 : 0,
    )
  })

  if (route.query && route.query.task) {
    panelTask.value.push(Number.parseInt(route.query.task))
    console.log(panelTask.value)
  }
})

const onSubmit = () => {
  isSubmitted.value = true
  if (!isErrorMandatoryFields.value && !isErrorSendTo.value) {
    taskData.openedBy = authUser.uri
    isPersisting.value = true

    postTaskSimulationData(taskData)
      .then(async res => {
        if (process.env.NODE_ENV === 'development') console.log(res)

        if (chosenFiles.value && chosenFiles.value.length > 0) {
          isPersistingFile.value = true

          await new Promise(resolve => {
            countTreatedData = 0

            chosenFiles.value.forEach(file => {
              postFileTaskSimulation(res['@id'], file, authUser.uri)
                .then(res => {
                  if (process.env.NODE_ENV === 'development') console.log(res)

                  countTreatedData++
                  if (countTreatedData === chosenFiles.value.length) resolve()
                })
                .catch(err => console.error(err))
            })
          })
        }
        initValue()
        isPersistingFile.value = false
      })
      .catch(err => console.error(err))
      .finally(() => (isPersisting.value = false))
  }
}

const initValue = () => {
  isSubmitted.value = false
  dialogNew.value = false

  taskData.title = null
  taskData.description = null
  taskData.openedBy = null
  taskData.targetGroups = []
  taskData.targetUser = null

  chosenFiles.value = []
  getAllTasks()
}

const isErrorSendTo = computed(() => {
  return !(taskData.targetUser || taskData.targetGroups.length > 0)
})

const isErrorMandatoryFields = computed(() => {
  return !(taskData.title || taskData.description)
})

const doLimitTitleLength = () => {
  if (taskData.title.length >= 255) taskData.title = taskData.title.slice(0, 254)
}
</script>

<template>
  <VDialog
    v-model="dialogNew"
    width="1024"
    persistent
  >
    <VCard class="px-5 py-3">
      <VCardText>
        <span class="text-h5"> Créer une tâche pour un devis </span>
      </VCardText>
      <VCardText>
        <VTextField
          v-model="taskData.title"
          label="Titre*"
          variant="outlined"
          autofocus
          required
          :counter="255"
          @update:model-value="doLimitTitleLength"
        />
      </VCardText>
      <VCardText>
        <VTextarea
          v-model="taskData.description"
          label="Description*"
          variant="outlined"
          required
        />
      </VCardText>
      <VRow
        justify="center"
        align="center"
      >
        <VCol
          cols="12"
          lg="9"
          class="bg-var-theme-background rounded mt-3 pt-0"
        >
          <VFadeTransition mode="out-in">
            <span
              v-if="isErrorSendTo && isSubmitted"
              class="d-flex align-center justify-center text-error pt-2"
            >
              <VIcon
                icon="typcn:warning-outline"
                class="me-1"
              />
              Merci de renseigner le(s) destinataire(s)
            </span>
          </VFadeTransition>
          <VCardText>
            <VAutocomplete
              v-model="taskData.targetGroups"
              :items="itemRoles"
              prepend-inner-icon="fa-solid:users"
              label="Envoyer au(x) groupe(s)"
              chips
              closable-chips
              multiple
              auto-select-first
            />
          </VCardText>
          <VCardText>
            <VAutocomplete
              v-model="taskData.targetUser"
              prepend-inner-icon="fa-solid:user"
              label="Envoyer à"
              :items="itemUsers"
              item-value="@id"
              item-title="fullName"
              variant="outlined"
              auto-select-first
              clearable
            >
              <template #selection="{ props, item }">
                <VListItem
                  v-bind="props"
                  :prepend-avatar="
                    item.raw.picture
                      ? `${baseURL}img/users/${item.raw.picture}`
                      : `${baseURL}img/logo/no-avatar.jpg
                  `
                  "
                  :title="item.raw.fullName"
                  :subtitle="item.raw.location ? item.raw.location.name : ''"
                />
              </template>
              <template #item="{ props, item }">
                <VListItem
                  v-bind="props"
                  :prepend-avatar="
                    item.raw.picture
                      ? `${baseURL}img/users/${item.raw.picture}`
                      : `${baseURL}img/logo/no-avatar.jpg
                  `
                  "
                  :title="item.raw.fullName"
                  :subtitle="item.raw.location ? item.raw.location.name : ''"
                />
              </template>
            </VAutocomplete>
          </VCardText>
        </VCol>
      </VRow>
      <VCardText class="text-center">
        <VFileInput
          v-model="chosenFiles"
          label="Joindre des fichiers"
          chips
          multiple
          variant="underlined"
          :loading="isPersistingFile"
        />
        <span class="mt-3 text-xs font-italic">Les fichiers seront enregistrés avec leur nom d'origine</span>
      </VCardText>
      <VFadeTransition mode="out-in">
        <span
          v-if="isErrorMandatoryFields && isSubmitted"
          class="d-flex align-center justify-center text-error pt-2"
        >
          <VIcon
            icon="typcn:warning-outline"
            class="me-1"
          />
          Merci de compléter les champs obligatoires
        </span>
      </VFadeTransition>
      <VCardText class="d-flex justify-end mt-5 gap-x-2">
        <VBtn
          color="secondary"
          variant="text"
          text="Fermer"
          @click="dialogNew = false"
          prepend-icon="material-symbols:close"
        />
        <VBtn
          text="Créer"
          color="primary"
          variant="elevated"
          prepend-icon="mingcute:task-line"
          :loading="isPersisting"
          @click="onSubmit"
        />
      </VCardText>
    </VCard>
  </VDialog>
  <VCard
    border
    class="mb-8"
  >
    <VCardTitle class="text-left task-card-title__container">
      <h2 class="text-h6 task-card-title__text">
        <VIcon
          icon="mingcute:task-2-fill"
          size="small"
        />
        Gestion des tâches
      </h2>
    </VCardTitle>
    <VCardItem>
      <div class="d-flex justify-start">
        <VBtn
          text="Créer une tâche"
          prepend-icon="tdesign:task-add"
          color="primary"
          @click="dialogNew = true"
        />
      </div>
    </VCardItem>
    <VFadeTransition mode="out-in">
      <VCardItem v-if="isLoading">
        <VProgressCircular
          indeterminate
          width="8"
          size="80"
        />
      </VCardItem>
      <VCardItem
        v-else-if="taskDataLoaded.length > 0 && (countTaskVisibleClosed > 0 || countTaskVisibleOpened > 0)"
        class="pt-3"
      >
        <div v-if="countTaskVisibleOpened > 0">
          <div class="d-flex align-center justify-center mb-3">
            <h3 class="text-h5 font-weight-bold text-info">
              <VIcon icon="eos-icons:workload" />
              En cours
            </h3>
          </div>
          <VExpansionPanels
            v-model="panelTask"
            variant="popout"
            multiple
            color="primary"
          >
            <template
              v-for="task in taskDataLoaded"
              :key="task.id"
            >
              <TaskExpansionPanel
                v-if="!task.doneAt && task.isVisible"
                :task="task"
                :customer-name="props.customerName"
                :simulation-number="props.simulationNumber"
                :simulation-id="props.idSimulation"
                @has-added-message-or-file="e => taskDataLoaded[e.indexTask].data.push(e.dataTask)"
                @has-been-closed="
                  e => {
                    taskDataLoaded[e.indexTask].doneAt = e.doneAt
                    taskDataLoaded[e.indexTask].closedBy = e.closedBy
                    countTaskVisibleClosed++
                    countTaskVisibleOpened--
                  }
                "
              />
            </template>
          </VExpansionPanels>
        </div>
        <div v-if="countTaskVisibleClosed > 0">
          <div class="d-flex align-center justify-center mb-3 mt-8">
            <h3 class="text-h5 font-weight-bold text-secondary">
              <VIcon icon="eos-icons:storage-class" />
              Cloturées
            </h3>
          </div>
          <VExpansionPanels
            v-model="panelTaskClosed"
            variant="popout"
            multiple
          >
            <template
              v-for="task in taskDataLoaded"
              :key="task.id"
            >
              <TaskExpansionPanel
                v-if="task.doneAt && task.isVisible"
                :task="task"
                :customer-name="props.customerName"
                :simulation-number="props.simulationNumber"
                :simulation-id="props.idSimulation"
                @has-added-message-or-file="
                  e => {
                    return
                  }
                "
                @has-been-closed="
                  e => {
                    return
                  }
                "
              />
            </template>
          </VExpansionPanels>
        </div>
      </VCardItem>
      <VCardItem
        v-else
        class="font-italic text-subtitle-2"
      >
        Aucune tâche trouvée
      </VCardItem>
    </VFadeTransition>
  </VCard>
</template>

<style scoped lang="scss"></style>
