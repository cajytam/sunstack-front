<script setup lang="ts">
import { getAll, patchById, post } from '@/services/api'

import { roles } from '@/services/roleService'

const dialogNew = ref(false)
const labelOperation = ref('Ajouter')
const idRow = ref(null)

const statusGroupList = ref()
const isError = ref(false)
const isLoading = ref(true)
const search = ref('')

const rolesList = ref([])

const statusGroupName = ref(null)
const statusGroupSort = ref(null)
const statusGroupWhoCanChange = ref([])

const isDisplayAlert = ref(false)
const isPersisting = ref(false)

const notificationContent = reactive({
  icon: '',
  alertType: '',
  title: '',
  text: '',
})

const headers = [
  { title: 'Nom', align: 'start', key: 'name' },
  { title: 'Ordre', align: 'start', key: 'sort' },
  { title: 'Roles pour modifier', align: 'start', key: 'whoCanChange' },
]

const getAllStatusGroups = () => {
  getAll('statusGroup')
    .then(res => {
      statusGroupList.value = res.data
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
  getAllStatusGroups()

  const rolesWithAdmin = roles
  if (rolesWithAdmin.includes('ROLE_ADMIN')) rolesWithAdmin.splice(rolesWithAdmin.indexOf('ROLE_ADMIN'), 1)

  rolesList.value = rolesWithAdmin
})

const initialValues = () => {
  statusGroupName.value = null
  statusGroupSort.value = null
  statusGroupWhoCanChange.value = []
}

const onSubmit = () => {
  if (statusGroupName.value === null || statusGroupName.value.trim().length < 1) return

  isPersisting.value = true

  if (idRow.value) {
    patchById('statusGroup', idRow.value, {
      name: statusGroupName.value,
      sort: statusGroupSort.value ? Number.parseInt(statusGroupSort.value) : null,
      whoCanChange: statusGroupWhoCanChange.value,
    })
      .then(() => {
        isDisplayAlert.value = true
        notificationContent.icon = 'teenyicons:shield-tick-solid'
        notificationContent.alertType = 'success'
        notificationContent.title = `Le groupe de statut ${statusGroupName.value} a bien été modifié`
        dialogNew.value = false
        initialValues()
        getAllStatusGroups()
      })
      .catch(err => {
        isDisplayAlert.value = true
        notificationContent.icon = 'ic:outline-error'
        notificationContent.alertType = 'error'
        notificationContent.title = 'erreur lors de la modification du groupe de statut'
        notificationContent.text = err.response.data['hydra:description']
        console.error(err)
      })
      .finally(() => (isPersisting.value = false))
  } else {
    post('statusGroup', {
      name: statusGroupName.value,
      sort: statusGroupSort.value ? Number.parseInt(statusGroupSort.value) : null,
      whoCanChange: statusGroupWhoCanChange.value,
    })
      .then(() => {
        isDisplayAlert.value = true
        notificationContent.icon = 'teenyicons:shield-tick-solid'
        notificationContent.alertType = 'success'
        notificationContent.title = `Le groupe de statut ${statusGroupName.value} a bien été ajouté`
        dialogNew.value = false
        initialValues()
        getAllStatusGroups()
      })
      .catch(err => {
        isDisplayAlert.value = true
        notificationContent.icon = 'ic:outline-error'
        notificationContent.alertType = 'error'
        notificationContent.title = "Erreur lors de l'enregistrement du groupe de statut"
        notificationContent.text = err.response.data['hydra:description']
        console.error(err)
      })
      .finally(() => (isPersisting.value = false))
  }
}

const onAddStatusGroup = () => {
  idRow.value = null
  labelOperation.value = 'Ajouter'
  initialValues()
  dialogNew.value = true
}

const onSelect = row => {
  labelOperation.value = 'Modifier'

  idRow.value = row.id
  dialogNew.value = true
  statusGroupName.value = row.name
  statusGroupSort.value = row.sort

  const dataRole = row.whoCanChange
  if (dataRole.includes('ROLE_ADMIN')) dataRole.splice(dataRole.indexOf('ROLE_ADMIN'), 1)

  statusGroupWhoCanChange.value = dataRole
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
          <span class="text-h5"> {{ labelOperation }} un groupe de statuts </span>
        </VCardTitle>
        <VCardText>
          <VContainer>
            <VRow>
              <VCol
                cols="12"
                md="8"
              >
                <VTextField
                  v-model="statusGroupName"
                  autofocus
                  label="Nom du groupe"
                  required
                />
              </VCol>
              <VCol
                cols="12"
                md="4"
              >
                <VTextField
                  v-model="statusGroupSort"
                  type="number"
                  step="1"
                  min="0"
                  label="Ordre (laissez vide si dernier)"
                  required
                />
              </VCol>
              <VCol cols="12">
                <VAutocomplete
                  v-model="statusGroupWhoCanChange"
                  label="Rôles pour modifier dans ce groupe de statut"
                  chips
                  multiple
                  :items="rolesList"
                >
                  <template #chip="{ props, item }">
                    <VChip
                      color="primary"
                      v-bind="props"
                      :text="item.raw.name"
                    />
                  </template>
                </VAutocomplete>
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
          <h1 class="text-lg-h4 text-body-1 font-weight-bold">Gestion des groupes de statuts</h1>
        </VCardTitle>
        <VCardText class="d-flex flex-wrap gap-4">
          <div class="flex-grow-1" />
          <div class="d-flex gap-6 app-user-search-filter align-center">
            <VTextField
              v-model="search"
              density="compact"
              clearable
              placeholder="Rechercher groupe..."
            />
            <VBtn
              text="Ajouter un groupe"
              color="info"
              @click.prevent="onAddStatusGroup"
            />
          </div>
        </VCardText>
        <VDataTable
          class="rounded-0 text-body-1"
          :headers="headers"
          :loading="isLoading"
          :search="search"
          :items="statusGroupList"
          :sort-by="[{ key: 'sort', order: 'asc' }]"
        >
          <template #item="{ item }">
            <tr
              class="cursor-pointer"
              @click="onSelect(item)"
            >
              <td>{{ item.name }}</td>
              <td>{{ item.sort }}</td>
              <td>
                <h6
                  v-if="
                    (item.whoCanChange.length <= 1 && item.whoCanChange.includes('ROLE_ADMIN')) ||
                    item.whoCanChange.length < 1
                  "
                  class="text-body-2 font-italic"
                >
                  Aucun rôle spécifique requis
                </h6>
                <template
                  v-for="role in item.whoCanChange"
                  :key="role.id"
                >
                  <VChip
                    v-if="role !== 'ROLE_ADMIN'"
                    class="me-2 cursor-pointer"
                    color="yellow-sunstack"
                    :text="role"
                  />
                </template>
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
    <Notification
      v-if="isDisplayAlert"
      :icon="notificationContent.icon"
      :alert-type="notificationContent.alertType"
      :title="notificationContent.title"
      :text="notificationContent.text"
      :is-closable="true"
      :autoclose-time="3000"
      @is-auto-closed="e => (isDisplayAlert = !isDisplayAlert)"
    />
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
