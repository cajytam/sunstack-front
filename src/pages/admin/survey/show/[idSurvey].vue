<script setup lang="ts">
import { getById } from '@/services/api'
import { roles } from '@/services/roleService'
import {
  getItemsSurveyFromStep,
  patchItemSurvey,
  patchSurveysStep,
  postItemSurvey,
  postSurveysStep,
} from '@/services/surveyService'

const route = useRoute()

const idRow = ref(false)
const idSurvey = ref(null)

const surveyStepData = reactive({
  name: '',
  whoCanControl: [],
  whoCanDo: [],
  minProjectStatus: null,
  surveyItems: [],
})

const surveyItemData = ref({
  name: null,
  type: null,
  surveyStep: null,
  options: null,
})

const listRoles = ref([])

const listType = [
  { key: 'file', name: 'Upload de fichiers' },
  { key: 'text', name: 'Indiquer une valeur' },
  { key: 'date', name: 'Indiquer une date' },
  { key: 'select', name: 'Sélection dans une liste' },
]

const dialogSurveyItem = ref(false)
const labelOperation = ref('Ajouter')
const isPersisting = ref(false)
const isLoadingSurveyItems = ref(false)
const isPersistingStep = ref(false)

const alertMessage = ref({
  display: false,
  color: null,
  text: null,
})

const initValue = () => {
  surveyItemData.value = {
    name: null,
    type: null,
    options: null,
    surveyStep: getURISurveyStep(idSurvey.value),
  }
}

onMounted(() => {
  idSurvey.value = route.params.idSurvey && route.params.idSurvey !== 'new' ? route.params.idSurvey : null
  surveyItemData.value.surveyStep = getURISurveyStep(idSurvey.value)

  const rolesWithAdmin = roles
  if (rolesWithAdmin.includes('ROLE_ADMIN')) rolesWithAdmin.splice(rolesWithAdmin.indexOf('ROLE_ADMIN'), 1)

  listRoles.value = rolesWithAdmin

  if (idSurvey.value) {
    getById('surveyStep', idSurvey.value).then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      surveyStepData.name = res.data.name
      surveyStepData.whoCanControl = res.data.whoCanControl
      surveyStepData.whoCanDo = res.data.whoCanDo
      surveyStepData.surveyItems = res.data.surveyItems
      surveyStepData.minProjectStatus = res.data.minProjectStatus
    })
  }
})

const doRefreshSurveyItems = () => {
  isLoadingSurveyItems.value = true
  getItemsSurveyFromStep(idSurvey.value)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      surveyStepData.surveyItems = res
    })
    .catch(err => console.error(err))
    .finally(() => (isLoadingSurveyItems.value = false))
}

const onAdd = () => {
  labelOperation.value = 'Ajouter'
  dialogSurveyItem.value = true
  idRow.value = null
  initValue()
}

const onSubmit = () => {
  isPersistingStep.value = true

  if (idSurvey.value) {
    patchSurveysStep(idSurvey.value, surveyStepData)
      .then(res => {
        if (process.env.NODE_ENV === 'development') console.log(res)
      })
      .catch(err => console.error(err))
      .finally(() => (isPersistingStep.value = false))
  } else {
    postSurveysStep(surveyStepData)
      .then(res => {
        if (process.env.NODE_ENV === 'development') console.log(res)

        idSurvey.value = res.id
        surveyItemData.value.surveyStep = res['@id']
      })
      .catch(err => console.error(err))
      .finally(() => (isPersistingStep.value = false))
  }
}

const onSubmitItem = () => {
  if (surveyItemData.value.name && surveyItemData.value.type) {
    isPersisting.value = true
    alertMessage.value.display = false

    if (surveyItemData.value.type !== 'select') surveyItemData.value.options = null

    if (idRow.value) {
      patchItemSurvey(idRow.value, surveyItemData.value).then(res => {
        if (process.env.NODE_ENV === 'development') console.log(res)

        initValue()
        isPersisting.value = false
        dialogSurveyItem.value = false
        doRefreshSurveyItems()
      })
    } else {
      postItemSurvey(surveyItemData.value)
        .then(res => {
          if (process.env.NODE_ENV === 'development') console.log(res)

          alertMessage.value = {
            display: true,
            text: 'Champ ajouté avec succès',
            color: 'success',
          }
          doRefreshSurveyItems()
          initValue()
          isPersisting.value = false
        })
        .catch(err => console.error(err))
        .finally(() => (isPersisting.value = false))
    }
  } else {
    alertMessage.value = {
      display: true,
      text: 'Merci de renseigner tous les champs',
      color: 'error',
    }
  }
  setTimeout(() => {
    alertMessage.value.display = false
  }, 5000)
}

const onEditItem = surveyItem => {
  labelOperation.value = 'Modifier'
  dialogSurveyItem.value = true

  idRow.value = surveyItem.id
  surveyItemData.value = {
    name: surveyItem.name,
    type: surveyItem.type,
    surveyStep: getURISurveyStep(surveyItem.surveyStep),
    options: surveyItem?.options,
  }
}

const getURISurveyStep = idSurveyItem => {
  if (idSurveyItem === null) return null
  if (idSurveyItem.id) idSurveyItem = idSurveyItem.id

  return idSurveyItem.toString().startsWith('/api/') ? idSurveyItem : `/api/survey_steps/${idSurveyItem}`
}
</script>

<template>
  <div>
    <VDialog
      v-model="dialogSurveyItem"
      width="1024"
      persistent
    >
      <VCard>
        <VCardTitle>
          <span class="text-h5">
            {{ labelOperation }} un champ au survey <span class="text-primary">{{ surveyStepData.name }}</span>
          </span>
        </VCardTitle>
        <VCardText>
          <VContainer>
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="surveyItemData.name"
                  autofocus
                  label="Nom du champ"
                  required
                />
              </VCol>
              <VCol cols="12">
                <VSelect
                  v-model="surveyItemData.type"
                  label="Type de champs"
                  :items="listType"
                  item-title="name"
                  item-value="key"
                />
              </VCol>
              <VScrollYTransition mode="out-in">
                <VCol v-if="surveyItemData.type === 'select'">
                  <VCombobox
                    v-model="surveyItemData.options"
                    chips
                    multiple
                    closable-chips
                    variant="underlined"
                    density="compact"
                    placeholder="Liste de choix (ENTRÉE pour ajouter)"
                  />
                </VCol>
              </VScrollYTransition>
            </VRow>
          </VContainer>
        </VCardText>
        <VCardText class="d-flex justify-space-between">
          <div class="ml-6">
            <VAlert
              v-if="alertMessage.display"
              density="compact"
              variant="tonal"
              border="start"
              :color="alertMessage.color"
              :title="alertMessage.text"
            />
          </div>
          <div>
            <VBtn
              color="secondary"
              variant="text"
              text="Fermer"
              @click="dialogSurveyItem = false"
            />
            <VBtn
              color="primary"
              variant="elevated"
              :text="labelOperation"
              :loading="isPersisting"
              @click="onSubmitItem"
            />
          </div>
        </VCardText>
      </VCard>
    </VDialog>
    <VMain>
      <VRow>
        <VCol cols="12">
          <span class="text-lg-h4 text-body-1">
            {{ idSurvey ? 'Modification du survey : ' : 'Création de survey' }}
          </span>
          <span
            v-if="idSurvey"
            class="text-primary font-weight-bold text-lg-h4 text-body-1"
          >
            {{ surveyStepData.name }}
          </span>
        </VCol>
        <VCol>
          <VCard>
            <VCardText>
              <VForm>
                <VRow>
                  <VCol>
                    <VRow
                      justify="center"
                      align="center"
                    >
                      <VCol
                        cols="12"
                        md="3"
                      >
                        <VLabel for="title"> Nom</VLabel>
                      </VCol>
                      <VCol
                        cols="12"
                        md="9"
                      >
                        <VTextField
                          id="title"
                          v-model="surveyStepData.name"
                        />
                      </VCol>
                    </VRow>
                    <VRow
                      justify="center"
                      align="center"
                    >
                      <VCol
                        cols="12"
                        md="3"
                      >
                        <VLabel for="roles-filler"> Rôles nécessaires</VLabel>
                      </VCol>
                      <VCol
                        cols="12"
                        md="9"
                      >
                        <VAutocomplete
                          id="roles-filler"
                          v-model="surveyStepData.whoCanDo"
                          chips
                          multiple
                          :items="listRoles"
                        >
                          <template #chip="{ props, item }">
                            <VChip
                              color="info"
                              v-bind="props"
                              :text="item.raw.name"
                            />
                          </template>
                        </VAutocomplete>
                      </VCol>
                    </VRow>
                    <VRow
                      justify="center"
                      align="center"
                    >
                      <VCol
                        cols="12"
                        md="3"
                      >
                        <VLabel for="roles-controller"> Rôles contrôleurs</VLabel>
                      </VCol>
                      <VCol
                        cols="12"
                        md="9"
                      >
                        <VAutocomplete
                          id="roles-controller"
                          v-model="surveyStepData.whoCanControl"
                          chips
                          multiple
                          :items="listRoles"
                        >
                          <template #chip="{ props, item }">
                            <VChip
                              color="warning"
                              v-bind="props"
                              :text="item.raw.name"
                            />
                          </template>
                        </VAutocomplete>
                      </VCol>
                    </VRow>
                    <VRow
                      v-if="false"
                      justify="center"
                      align="center"
                    >
                      <VCol
                        cols="12"
                        md="3"
                      >
                        <VLabel for="status-min"> Statut minimal du projet</VLabel>
                      </VCol>
                      <VCol
                        cols="12"
                        md="9"
                      >
                        <VAutocomplete
                          id="status-min"
                          v-model="surveyStepData.minProjectStatus"
                        />
                      </VCol>
                    </VRow>
                  </VCol>
                </VRow>
                <VRow>
                  <VCol class="d-flex justify-end">
                    <VBtn
                      prepend-icon="akar-icons:save"
                      color="info"
                      text="Enregistrer"
                      :loading="isPersistingStep"
                      @click="onSubmit"
                    />
                  </VCol>
                </VRow>
              </VForm>
            </VCardText>
          </VCard>
          <VContainer class="mt-6 container__survey-items">
            <VCardText>
              <h4 class="text-h5 font-weight-bold mb-5">Contenu du survey</h4>
              <VBtn
                text="Ajouter"
                prepend-icon="gridicons:add-outline"
                :disabled="!idSurvey"
                @click="onAdd"
              />
            </VCardText>
            <VFadeTransition mode="out-in">
              <VRow
                v-if="isLoadingSurveyItems"
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
                    :width="7"
                  />
                </VCol>
              </VRow>
              <div v-else>
                <VCard
                  v-for="item in surveyStepData.surveyItems"
                  :key="item.id"
                  class="my-3 mx-6 cursor-pointer card-survey-item"
                  @click="onEditItem(item)"
                >
                  <VCardText>
                    <h3 class="text-h6 text-info font-weight-bold">
                      {{ item.name }}
                    </h3>
                    <span>
                      {{ listType.find(e => e.key === item.type)?.name }}
                    </span>
                    <VCard v-if="item.type === 'select'">
                      <VList class="py-3">
                        <VListItem
                          v-for="option in item.options"
                          prepend-icon="octicon:dot-16"
                          class="py-0 bg-var-theme-background"
                          density="compact"
                        >
                          <span class="text-body-2">
                            {{ option }}
                          </span>
                        </VListItem>
                      </VList>
                    </VCard>
                  </VCardText>
                </VCard>
              </div>
            </VFadeTransition>
          </VContainer>
        </VCol>
      </VRow>
    </VMain>
  </div>
</template>

<style scoped lang="scss">
.container__survey-items {
  padding: 0.8rem 1.2rem;
  border: 1px solid var(--info-A700);
  border-radius: 1.2rem;
}

.card-survey-item {
  transition: all 0.2s ease-in-out;
  border: 3px solid transparent;

  &:hover {
    border-color: var(--info-700);
  }
}
</style>
