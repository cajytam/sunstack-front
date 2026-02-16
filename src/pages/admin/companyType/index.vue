<script setup lang="ts">
import { getAll, patchById, post } from '@/services/api'

const dialogNew = ref(false)
const labelOperation = ref('Ajouter')
const idRow = ref(null)

const companyTypesList = ref()
const isError = ref(false)
const isLoading = ref(true)
const search = ref('')
const companyTypeName = ref(null)
const companyTypeFullname = ref(null)
const companyTypeInsee = ref([])
const companyTypeVAT = ref(false)

const isDisplayAlert = ref(false)
const isPersisting = ref(false)

const notificationContent = reactive({
  alertType: '',
  title: '',
  text: '',
})

const headers = [
  { title: 'Nom abrégé', align: 'start', key: 'name' },
  { title: 'Nom', align: 'start', key: 'fullname' },
  { title: 'Mapping INSEE', align: 'start', key: 'mapInseeCategoriesJuridiques' },
  { title: 'Peut déduire la TVA', align: 'start', key: 'isSubjectToVAT' },
]

const getAllCompanyTypes = () => {
  getAll('company_type')
    .then(res => {
      companyTypesList.value = res.data
    })
    .catch(err => {
      isError.value = true
      console.error(err)
    })
    .finally(() => {
      isLoading.value = false
    })
}

const initValues = () => {
  companyTypeName.value = null
  companyTypeFullname.value = null
  companyTypeInsee.value = null
  companyTypeVAT.value = null
}

onMounted(() => {
  getAllCompanyTypes()
})

const onSubmit = () => {
  if (
    (companyTypeName.value === null && companyTypeFullname.value === null) ||
    (companyTypeName.value.trim().length < 1 && companyTypeFullname.value.trim().length < 1)
  )
    return

  const companyTypeData = {
    name: companyTypeName.value,
    fullname: companyTypeFullname.value,
    isSubjectToVAT: companyTypeVAT.value,
    mapInseeCategoriesJuridiques: companyTypeInsee.value,
  }

  isPersisting.value = true

  if (idRow.value) {
    patchById('company_type', idRow.value, companyTypeData)
      .then(() => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'success'
        notificationContent.title = `Le type de société ${companyTypeName.value} a bien été modifié`
        dialogNew.value = false
        initValues()
        getAllCompanyTypes()
      })
      .catch(err => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'error'
        notificationContent.title = 'erreur lors de la modification du type de société'
        notificationContent.text = err.response ? err.response.data['hydra:description'] : null
        console.error(err)
      })
      .finally(() => (isPersisting.value = false))
  } else {
    post('company_type', companyTypeData)
      .then(() => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'success'
        notificationContent.title = `Le type de société ${companyTypeName.value} a bien été ajouté`
        dialogNew.value = false
        initValues()
        getAllCompanyTypes()
      })
      .catch(err => {
        console.error(err)
        isDisplayAlert.value = true
        notificationContent.alertType = 'error'
        notificationContent.title = "Erreur lors de l'enregistrement du type de société"
        notificationContent.text = err.response ? err.response.data['hydra:description'] : null
        console.error(err)
      })
      .finally(() => (isPersisting.value = false))
  }
}

const onAddCompanyType = () => {
  idRow.value = null
  labelOperation.value = 'Ajouter'
  initValues()

  dialogNew.value = true
}

const onSelect = row => {
  labelOperation.value = 'Modifier'

  idRow.value = row.id
  dialogNew.value = true
  companyTypeName.value = row.name
  companyTypeFullname.value = row.fullname
  companyTypeInsee.value = row.mapInseeCategoriesJuridiques
  companyTypeVAT.value = row.isSubjectToVAT
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
          <span class="text-h5"> {{ labelOperation }} un type de société </span>
        </VCardTitle>
        <VCardText>
          <VContainer>
            <VRow>
              <VCol
                cols="12"
                lg="3"
              >
                <VTextField
                  v-model="companyTypeName"
                  autofocus
                  label="Nom abrégé du type"
                  required
                />
              </VCol>
              <VCol
                cols="12"
                lg="9"
              >
                <VTextField
                  v-model="companyTypeFullname"
                  label="Nom complet du type"
                  required
                />
              </VCol>
              <VCol cols="12">
                <VCombobox
                  v-model="companyTypeInsee"
                  label="Mapping Catégories juridiques de l'INSEE (faites ENTRER pour valider)"
                  chips
                  multiple
                />
              </VCol>
              <VCol cols="12">
                <VSwitch
                  v-model="companyTypeVAT"
                  label="Peut déduire la TVA ?"
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
          <h1 class="text-lg-h4 text-body-1 font-weight-bold">Gestion des types de société</h1>
        </VCardTitle>
        <VCardText class="d-flex flex-wrap gap-4">
          <div class="flex-grow-1" />
          <div class="d-flex gap-6 app-user-search-filter align-center">
            <VTextField
              v-model="search"
              density="compact"
              clearable
              placeholder="Rechercher type de société..."
            />
            <VBtn
              text="Ajouter un type de société"
              color="info"
              @click.prevent="onAddCompanyType"
            />
          </div>
        </VCardText>
        <VDataTable
          class="rounded-0 text-body-1"
          :headers="headers"
          :loading="isLoading"
          :search="search"
          :items="companyTypesList"
          :sort-by="[{ key: 'name', order: 'asc' }]"
        >
          <template #item="{ item }">
            <tr
              class="cursor-pointer"
              @click="onSelect(item)"
            >
              <td>{{ item.name }}</td>
              <td>{{ item.fullname }}</td>
              <td>{{ item.mapInseeCategoriesJuridiques }}</td>
              <td>
                <VSwitch
                  v-model="item.isSubjectToVAT"
                  readonly
                />
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
