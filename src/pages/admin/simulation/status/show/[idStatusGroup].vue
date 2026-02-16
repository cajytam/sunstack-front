<script setup lang="ts">
import { getStatusFromGroup, patchStatusData, postStatusData } from '@/services/statusService'
import { getById } from '@/services/api'

const route = useRoute()

const listColors = [
  { id: null, name: '' },
  { id: 'success', name: 'Vert' },
  { id: 'warning', name: 'Jaune' },
  { id: 'error', name: 'Rouge' },
]

const statusGroupId = route.params.idStatusGroup ? route.params.idStatusGroup : null
const statusGroupName = ref('')
const statusGroupItems = ref(null)

const statusItemData = reactive({
  name: null,
  sort: null,
  isKeyStep: false,
  color: null,
  required: [],
})

const idRow = ref(null)

const isLoading = ref(false)
const isPersisting = ref(false)
const dialogStatusItem = ref(false)
const labelOperation = ref('Ajouter')
const selectedRequiredOption = ref(null)
const isAlertRequiredNoOption = ref(false)

const openListRequiredOptions = ref(false)
const listRequiredOptions = ref(["Date de l'évènement", 'Motif', "Sélection d'une option"])

onMounted(() => {
  getAllData()
})

const getAllData = () => {
  isLoading.value = true

  getById('statusGroup', statusGroupId).then(res => {
    statusGroupName.value = res.data.name

    if (statusGroupId) {
      getStatusFromGroup(statusGroupId)
        .then(res => {
          if (process.env.NODE_ENV === 'development') console.log(res)

          statusGroupItems.value = res.data.sort((elem1, elem2) => {
            return elem1.sort - elem2.sort
          })
        })
        .finally(() => (isLoading.value = false))
    }
  })
}

const onAddStatusItem = () => {
  labelOperation.value = 'Ajouter'
  dialogStatusItem.value = true
  idRow.value = null
  statusItemData.name = null
  statusItemData.sort = null
  statusItemData.isKeyStep = false
  statusItemData.color = null
  statusItemData.required = []
  selectedRequiredOption.value = null
}

const onSelect = status => {
  labelOperation.value = 'Modifier'
  dialogStatusItem.value = true

  idRow.value = status.id
  statusItemData.name = status.name
  statusItemData.sort = status.sort
  statusItemData.isKeyStep = status.isKeyStep
  statusItemData.color = status.color
  statusItemData.required = status.required
  selectedRequiredOption.value = null
}

const onAddRequiredOption = () => {
  if (selectedRequiredOption.value) {
    switch (selectedRequiredOption.value) {
      case "Date de l'évènement":
        statusItemData.required = Object.assign({ datetime: true }, statusItemData.required)
        break
      case 'Motif':
        statusItemData.required = Object.assign({ reason: true }, statusItemData.required)
        break
      case "Sélection d'une option":
        statusItemData.required = Object.assign({ select: null }, statusItemData.required)
        break
    }

    openListRequiredOptions.value = false
    selectedRequiredOption.value = null
  }
}

const onSubmit = () => {
  if ('select' in statusItemData.required && statusItemData.required.select === null) {
    isAlertRequiredNoOption.value = true

    return
  }
  isAlertRequiredNoOption.value = false

  isPersisting.value = true

  const data = JSON.parse(JSON.stringify(statusItemData))

  if (idRow.value) {
    patchStatusData(idRow.value, data)
      .then(res => {
        if (process.env.NODE_ENV === 'development') console.log(res)

        dialogStatusItem.value = false
        getAllData()
      })
      .catch(err => console.error(err))
      .finally(() => (isPersisting.value = false))
  } else {
    data.statusGroup = `/api/status_groups/${statusGroupId}`
    postStatusData(data)
      .then(res => {
        if (process.env.NODE_ENV === 'development') console.log(res)

        dialogStatusItem.value = false
        getAllData()
      })
      .catch(err => console.error(err))
      .finally(() => (isPersisting.value = false))
  }
}

const onRemoveRequired = keyRequired => {
  Reflect.deleteProperty(statusItemData.required, keyRequired)
}
</script>

<template>
  <div>
    <VDialog
      v-model="openListRequiredOptions"
      width="480"
      persistent
    >
      <VCard>
        <VCardTitle> Sélectionner le champ à ajouter </VCardTitle>
        <VCardText>
          <VSelect
            v-model="selectedRequiredOption"
            :items="listRequiredOptions"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="secondary"
            variant="text"
            text="Fermer"
            @click="openListRequiredOptions = false"
          />
          <VBtn
            color="primary"
            variant="elevated"
            text="Ajouter"
            @click="onAddRequiredOption"
          />
        </VCardActions>
      </VCard>
    </VDialog>
    <VDialog
      v-model="dialogStatusItem"
      width="1024"
      persistent
    >
      <VCard>
        <VCardTitle>
          <span class="text-h5">
            {{ labelOperation }} un statut de <span class="text-primary">{{ statusGroupName }}</span>
          </span>
        </VCardTitle>
        <VCardText>
          <VContainer>
            <VRow>
              <VCol
                cols="12"
                md="8"
              >
                <VTextField
                  v-model="statusItemData.name"
                  autofocus
                  label="Nom du statut"
                  required
                />
              </VCol>
              <VCol
                cols="12"
                md="4"
              >
                <VTextField
                  v-model="statusItemData.sort"
                  type="number"
                  step="1"
                  min="0"
                  label="Ordre (laissez vide si dernier)"
                  required
                />
              </VCol>
              <VCol cols="6">
                <VSelect
                  v-model="statusItemData.color"
                  :items="listColors"
                  item-title="name"
                  item-value="id"
                  label="Couleur de fond"
                />
              </VCol>
              <VCol
                cols="6"
                class="d-flex justify-center align-center"
              >
                <VCheckbox
                  v-model="statusItemData.isKeyStep"
                  label="Étape clée"
                />
              </VCol>
              <VCol
                v-if="statusItemData.required.length !== 0"
                cols="12"
              >
                <VCardActions>
                  <h6 class="text-caption text-decoration-underline">Liste des champs complémentaires :</h6>
                </VCardActions>
                <template
                  v-for="(item, key) in statusItemData.required"
                  :key="key"
                >
                  <div class="rounded border my-3">
                    <div class="d-flex align-center gap-3 pa-5 position-relative flex-column flex-sm-row">
                      <VBtn
                        text="X"
                        icon="iwwa:delete"
                        size="x-small"
                        variant="text"
                        color="secondary"
                        class="list-status-remove-btn"
                        @click.prevent="onRemoveRequired(key)"
                      />
                      <div v-if="key === 'datetime'">Date de l'évènement</div>
                      <div v-else-if="key === 'reason'">Motif</div>
                      <VCol
                        v-else-if="key === 'select'"
                        cols="7"
                      >
                        Sélection d'un des éléments suivants :
                        <VCombobox
                          v-model="statusItemData.required.select"
                          chips
                          multiple
                          closable-chips
                          class="mt-3"
                          variant="underlined"
                          density="compact"
                          placeholder="Liste de choix (ENTRÉE pour ajouter)"
                        />
                        <VAlert
                          v-if="isAlertRequiredNoOption"
                          text="Merci de renseigner au moins une option"
                          density="compact"
                          border="start"
                          class="mt-2"
                          variant="outlined"
                          color="error"
                        />
                      </VCol>
                    </div>
                  </div>
                </template>
              </VCol>
              <VCol cols="12">
                <VCardActions class="mt-2">
                  <VBtn
                    variant="tonal"
                    color="info"
                    text="Champ supplémentaire"
                    prepend-icon="ic:round-add-box"
                    @click="openListRequiredOptions = true"
                  />
                </VCardActions>
              </VCol>
            </VRow>
          </VContainer>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="secondary"
            variant="text"
            text="Fermer"
            @click="dialogStatusItem = false"
          />
          <VBtn
            color="primary"
            variant="elevated"
            :text="labelOperation"
            :loading="isPersisting"
            @click="onSubmit"
          />
        </VCardActions>
      </VCard>
    </VDialog>
    <VFadeTransition mode="out-in">
      <VContainer
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
              :width="7"
            />
          </VCol>
        </VRow>
      </VContainer>
      <VMain v-else>
        <VRow>
          <VCol cols="12">
            <VCard>
              <VCardTitle>
                <h1 class="text-lg-h4 text-body-1">
                  Liste des statuts de
                  <span
                    v-if="statusGroupName"
                    class="text-primary font-weight-bold"
                  >
                    {{ statusGroupName }}
                  </span>
                </h1>
              </VCardTitle>
              <VCardItem>
                <VBtn
                  text="Ajouter un statut"
                  variant="elevated"
                  prepend-icon="ic:baseline-post-add"
                  @click.prevent="onAddStatusItem"
                />
              </VCardItem>
              <StatusItem
                v-for="status in statusGroupItems"
                :key="status.id"
                :status="status"
                @click.prevent="onSelect(status)"
              />
            </VCard>
          </VCol>
        </VRow>
      </VMain>
    </VFadeTransition>
  </div>
</template>

<style scoped lang="scss">
.list-status-remove-btn {
  position: absolute;
  inset-block-start: 10px;
  inset-inline-end: 10px;
}
</style>
