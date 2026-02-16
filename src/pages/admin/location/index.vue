<script setup lang="ts">
import { getAll, patchById, post } from '@/services/api'

const dialogNew = ref(false)
const labelOperation = ref('Ajouter')
const idRow = ref(null)

const locationList = ref()
const isError = ref(false)
const isLoading = ref(true)
const search = ref('')
const locationName = ref(null)
const locationID = ref(null)

const isDisplayAlert = ref(false)
const isPersisting = ref(false)

const notificationContent = reactive({
  alertType: '',
  title: '',
  text: '',
})

const headers = [
  { title: 'Nom', align: 'center', key: 'name' },
  { title: 'Identifiant code client', align: 'center', key: 'identifier', width: '20%' },
]

const getAllLocations = () => {
  getAll('location')
    .then(res => {
      locationList.value = res.data
    })
    .catch(err => {
      isError.value = true
      console.error(err)
    })
    .finally(() => {
      isLoading.value = false
    })
}

onMounted(() => {
  getAllLocations()
})

const onSubmit = () => {
  if (locationName.value === null || locationName.value.trim().length < 1) return

  isPersisting.value = true

  if (idRow.value) {
    patchById('location', idRow.value, {
      name: locationName.value,
      identifier: locationID.value,
    })
      .then(() => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'success'
        notificationContent.title = `La localité ${locationName.value} a bien été modifié`
        dialogNew.value = false
        locationName.value = null
        getAllLocations()
      })
      .catch(err => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'error'
        notificationContent.title = 'erreur lors de la modification de la localité'
        notificationContent.text = err.response.data['hydra:description']
        console.error(err)
      })
      .finally(() => (isPersisting.value = false))
  } else {
    post('location', {
      name: locationName.value,
      identifier: locationID.value,
    })
      .then(() => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'success'
        notificationContent.title = `La localité ${locationName.value} a bien été ajouté`
        dialogNew.value = false
        locationName.value = null
        getAllLocations()
      })
      .catch(err => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'error'
        notificationContent.title = "Erreur lors de l'enregistrement de la localité"
        notificationContent.text = err.response.data['hydra:description']
        console.error(err)
      })
      .finally(() => (isPersisting.value = false))
  }
}

const onAddLocation = () => {
  idRow.value = null
  labelOperation.value = 'Ajouter'
  locationName.value = null
  locationID.value = null

  dialogNew.value = true
}

const onSelect = row => {
  labelOperation.value = 'Modifier'

  idRow.value = row.id
  dialogNew.value = true
  locationName.value = row.name
  locationID.value = row.identifier
}
</script>

<template>
  <div>
    <VDialog
      v-model="dialogNew"
      width="1024"
      persistent
    >
      <VCard>
        <VCardTitle>
          <span class="text-h5"> {{ labelOperation }} une localité </span>
        </VCardTitle>
        <VCardText>
          <VContainer>
            <VRow>
              <VCol cols="9">
                <VTextField
                  v-model="locationName"
                  autofocus
                  label="Nom de la localité"
                  required
                />
              </VCol>
              <VCol cols="3">
                <VTextField
                  v-model="locationID"
                  label="ID pour numéro client"
                  required
                />
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
            @click="dialogNew = false"
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
    <VMain>
      <VCard>
        <VCardTitle>
          <h1 class="text-lg-h4 text-body-1 font-weight-bold">Gestion des agences</h1>
        </VCardTitle>
        <VCardText class="d-flex flex-wrap gap-4">
          <div class="flex-grow-1" />
          <div class="d-flex gap-6 app-user-search-filter align-center">
            <VTextField
              v-model="search"
              density="compact"
              clearable
              placeholder="Rechercher agence..."
            />
            <VBtn
              text="Ajouter une agence"
              color="info"
              @click.prevent="onAddLocation"
            />
          </div>
        </VCardText>
        <VDataTable
          class="rounded-0 text-body-1"
          :headers="headers"
          :loading="isLoading"
          :search="search"
          :items="locationList"
          :sort-by="[{ key: 'name', order: 'asc' }]"
        >
          <template #item="{ item }">
            <tr
              class="cursor-pointer"
              @click="onSelect(item)"
            >
              <td class="text-center">
                {{ item.name }}
              </td>
              <td class="text-center">
                {{ item.identifier }}
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
    </VMain>
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

<style scoped lang="scss">
:deep(.v-data-table__th) {
  background-color: var(--primary-600) !important;
  color: white !important;
}

.app-user-search-filter {
  inline-size: 28.0625rem;
}
</style>
