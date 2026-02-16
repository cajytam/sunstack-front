<script setup lang="ts">
import { getAll } from '@/services/api'
import { getDateFormat } from '@/utils/dateUtils'
import { addPanelPrice, patchPanelData, patchPanelPrice, postPanelData } from '@/services/panelService'
import { getNumberFormat } from '@/utils/numberUtils'
import { useUserStore } from '@/stores/user'

const baseURL = import.meta.env.VITE_API_URI

const stcNormalTemperature: int = 25

const userStore = useUserStore()
const { authUser } = userStore

const dialogNew = ref(false)
const labelOperation = ref('Ajouter')
const idRow = ref(null)

const panelList = ref()
const isError = ref(false)
const isLoading = ref(true)
const search = ref('')

const panelData = reactive({
  installationType: null,
  model: null,
  power: null,
  yieldLossFirstYear: null,
  yieldLossOtherYears: null,
  debutOnSaleAt: null,
  voltageOpenCircuit: null,
  coefVoc: null,
  shortCircuitCurrent: null,
  coefIsc: null,
})

const isDisplayAlert = ref(false)
const isPersisting = ref(false)

const notificationContent = reactive({
  alertType: '',
  title: '',
  text: '',
})

const headers = [
  { title: 'Modèle', align: 'start', key: 'model' },
  { title: 'Puissance (en Wc)', align: 'start', key: 'power' },
  { title: 'Type', align: 'start', key: 'installationType' },
  { title: 'En vente depuis', align: 'start', key: 'debutOnSaleAt' },
]

const itemsType = [
  { key: 'C', name: 'Commercial' },
  { key: 'I', name: 'Industriel' },
]

const getAllPanels = () => {
  const panelType = {
    I: false,
    C: false,
  }

  getAll('panel')
    .then(res => {
      panelList.value = res.data
        .sort((a, b) => {
          return new Date(b.debutOnSaleAt) - new Date(a.debutOnSaleAt)
        })
        .map(panel => {
          const isActive = {
            isActive: !panelType[panel.installationType] && new Date() >= new Date(panel.debutOnSaleAt),
          }

          if (!panelType[panel.installationType] && new Date() >= new Date(panel.debutOnSaleAt))
            panelType[panel.installationType] = true

          return {
            ...panel,
            ...isActive,
          }
        })
    })
    .catch(err => {
      isError.value = true
      console.error(err)
    })
    .finally(() => (isLoading.value = false))
}

const isStringValid = data => {
  return data !== null && data.trim().length > 0
}

const isIntValid = data => {
  return data !== null && data > 0
}

const initialValues = () => {
  panelData.model = null
  panelData.power = null
  panelData.installationType = null
  panelData.yieldLossFirstYear = null
  panelData.yieldLossOtherYears = null
  panelData.debutOnSaleAt = null
  panelData.voltageOpenCircuit = null
  panelData.coefVoc = null
  panelData.shortCircuitCurrent = null
  panelData.coefIsc = null

  panelPrices.value = []
}

onMounted(() => {
  getAllPanels()
})

const onSubmit = () => {
  if (
    !isStringValid(panelData.model) ||
    !isIntValid(panelData.power) ||
    !isStringValid(panelData.installationType) ||
    !isIntValid(panelData.yieldLossFirstYear) ||
    !isIntValid(panelData.yieldLossOtherYears)
  )
    return

  if (panelData.debutOnSaleAt !== null && panelData.debutOnSaleAt.length === 0) panelData.debutOnSaleAt = null

  const data = JSON.parse(JSON.stringify(panelData))

  isPersisting.value = true

  if (idRow.value) {
    patchPanelData(idRow.value, data)
      .then(() => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'success'
        notificationContent.title = `Le modèle de panneau ${panelData.model} a bien été modifié`
        dialogNew.value = false
        initialValues()
        getAllPanels()
      })
      .catch(err => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'error'
        notificationContent.title = 'erreur lors de la modification du panneau'
        notificationContent.text = err.response.data['hydra:description']
        console.error(err)
      })
      .finally(() => (isPersisting.value = false))
  } else {
    postPanelData(data)
      .then(() => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'success'
        notificationContent.title = `Le modèle de panneau ${panelData.model} a bien été ajouté`
        dialogNew.value = false
        initialValues()
        getAllPanels()
      })
      .catch(err => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'error'
        notificationContent.title = "Erreur lors de l'enregistrement du panneau"
        notificationContent.text = err.response.data['hydra:description']
        console.error(err)
      })
      .finally(() => (isPersisting.value = false))
  }
}

const onAddPanel = () => {
  idRow.value = null
  labelOperation.value = 'Ajouter fiche'
  initialValues()
  dialogNew.value = true
}

const onSelect = row => {
  labelOperation.value = 'Modifier fiche'
  latestDate.value = null
  isDateDebutIncorrect.value = false

  initPriceValue()

  idRow.value = row.id
  dialogNew.value = true
  panelData.model = row.model
  panelData.power = row.power
  panelData.installationType = row.installationType
  panelData.yieldLossOtherYears = row.yieldLossOtherYears
  panelData.yieldLossFirstYear = row.yieldLossFirstYear
  panelData.coefVoc = row.coefVoc
  panelData.coefIsc = row.coefIsc
  panelData.voltageOpenCircuit = row.voltageOpenCircuit
  panelData.shortCircuitCurrent = row.shortCircuitCurrent
  panelData.debutOnSaleAt = row.debutOnSaleAt ? getDateFormat(row.debutOnSaleAt, 'dateFormatHTMLElement') : null

  panelPrices.value = row.panelPrices.sort((a, b) => {
    if (!latestDate.value || new Date(b.endDate) > new Date(latestDate.value)) latestDate.value = b.endDate
    else if (new Date(b.startDate) > new Date(latestDate.value)) latestDate.value = b.startDate

    return new Date(b.startDate) - new Date(a.startDate)
  })
  if (latestDate.value) latestDate.value = new Date(latestDate.value).setDate(new Date(latestDate.value).getDate() + 1)
}

/*
  GESTION DES PRIX
*/
const dialogNewPrice = ref(false)

const newPrice = reactive({
  debutDate: null,
  price: null,
})

const panelPrices = ref([])
const latestDate = ref(null)
const isPersistingPrice = ref(false)
const isDateDebutIncorrect = ref(false)

const initPriceValue = () => {
  newPrice.debutDate = null
  newPrice.price = null
}

const addPrice = () => {
  isDateDebutIncorrect.value = false

  if (!newPrice.price || !newPrice.debutDate) return

  if (new Date(newPrice.debutDate) <= new Date(latestDate.value)) {
    isDateDebutIncorrect.value = true

    return
  }

  isPersistingPrice.value = true

  addPanelPrice(idRow.value, authUser.uri, newPrice.price, newPrice.debutDate)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      panelList.value
        .find(obj => obj.id === res.panel.id)
        .panelPrices.forEach(price => {
          if (!price.endDate) {
            const priceEndDate = new Date(newPrice.debutDate).setDate(new Date(newPrice.debutDate).getDate() - 1)

            patchPanelPrice(price.id, {
              endDate: new Date(priceEndDate),
            })
              .then(res => {
                if (process.env.NODE_ENV === 'development') console.log(res)
              })
              .catch(err => console.error(err))
              .finally(() => (price.endDate = priceEndDate))
          }
        })

      panelList.value.find(obj => obj.id === res.panel.id).panelPrices.push(res)

      panelPrices.value = panelList.value
        .find(obj => obj.id === res.panel.id)
        .panelPrices.sort((a, b) => {
          if (!latestDate.value || new Date(b.endDate) > new Date(latestDate.value)) latestDate.value = b.endDate
          else if (new Date(b.startDate) > new Date(latestDate.value)) latestDate.value = b.startDate

          return new Date(b.startDate) - new Date(a.startDate)
        })

      if (latestDate.value)
        latestDate.value = new Date(latestDate.value).setDate(new Date(latestDate.value).getDate() + 1)

      dialogNewPrice.value = false
      initPriceValue()
    })
    .catch(err => console.error(err))
    .finally(() => (isPersistingPrice.value = false))
}

/*
  FIN GESTION DES PRIX
*/

const getVocMax = (voc, coefVoc) => {
  return Math.round(voc * (1 + (coefVoc / 100) * (-20 - stcNormalTemperature)) * 100) / 100
}

const getIscMax = (isc, coefIsc) => {
  return Math.round(isc * (1 + (coefIsc / 100) * (80 - stcNormalTemperature)) * 100) / 100
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
        <VCardTitle class="d-flex justify-space-between">
          <span class="text-h5"> {{ labelOperation }} un modèle de panneau </span>
          <DialogCloseBtn @click="dialogNew = false" />
        </VCardTitle>
        <VCardText>
          <VContainer>
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="panelData.model"
                  autofocus
                  label="Modèle du panneau"
                  required
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="panelData.power"
                  label="Puissance du panneau (en Wc)"
                  required
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VSelect
                  v-model="panelData.installationType"
                  :items="itemsType"
                  label="Type de panneau (Indutriel ou Commercial)"
                  required
                  item-title="name"
                  item-value="key"
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="panelData.yieldLossFirstYear"
                  label="Perte d'efficacité la première année (en %)"
                  required
                  suffix="%"
                  type="number"
                  step="1"
                  min="0"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="panelData.yieldLossOtherYears"
                  label="Perte d'efficacité les années suivantes (par an) en %"
                  required
                  suffix="%"
                  type="number"
                  step="0.01"
                  min="0"
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol cols="6">
                <VTextField
                  v-model="panelData.debutOnSaleAt"
                  type="date"
                  label="Date de début commercialisation"
                />
              </VCol>
            </VRow>
          </VContainer>
        </VCardText>
        <VCardText>
          <h2 class="mb-3">Données techniques</h2>
          <VRow
            align="center"
            justify="center"
          >
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="panelData.voltageOpenCircuit"
                density="compact"
                type="number"
                step="0.001"
                min="0"
                label="Voc/V"
                required
                suffix="V"
              />
            </VCol>
            <VCol
              cols="12"
              md="3"
            >
              <VTextField
                v-model="panelData.coefVoc"
                density="compact"
                type="number"
                step="0.001"
                label="Coefficient Voc"
                required
                suffix="%/°C"
              />
            </VCol>
            <VCol
              v-if="panelData.coefVoc && panelData.voltageOpenCircuit"
              class="text-center bg-var-theme-background rounded"
              md="3"
              cols="12"
            >
              <span>Voc max(T° min) : </span>
              <span>
                {{ getVocMax(panelData.voltageOpenCircuit, panelData.coefVoc) }}
              </span>
            </VCol>
            <VSpacer v-else />
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="panelData.shortCircuitCurrent"
                density="compact"
                type="number"
                step="0.001"
                min="0"
                label="Isc/A"
                required
                suffix="A"
              />
            </VCol>
            <VCol
              cols="12"
              md="3"
            >
              <VTextField
                v-model="panelData.coefIsc"
                density="compact"
                type="number"
                step="0.001"
                label="Coefficient Isdc"
                required
                suffix="%/°C"
              />
            </VCol>
            <VDialogTransition mode="out-in">
              <VCol
                v-if="panelData.shortCircuitCurrent && panelData.coefIsc"
                class="text-center bg-var-theme-background rounded"
                md="3"
                cols="12"
              >
                <span>Isc Max(T° max) : </span>
                <span>
                  {{ getIscMax(panelData.shortCircuitCurrent, panelData.coefIsc) }}
                </span>
              </VCol>
              <VSpacer v-else />
            </VDialogTransition>
          </VRow>
          <VRow
            justify="end"
            class="mt-3 font-italic text-xs"
          >
            Les valeurs VocMax et IscMax sont calculées à partir d'une température STC de {{ stcNormalTemperature }}°C
          </VRow>
          <VCardText class="d-flex justify-center px-0 my-5">
            <VBtn
              color="primary"
              variant="elevated"
              :text="labelOperation"
              :loading="isPersisting"
              prepend-icon="tabler:edit"
              @click="onSubmit"
            />
          </VCardText>
          <VCardText
            v-if="idRow"
            class="rounded bg-var-theme-background pt-2 pb-8"
          >
            <h3 class="mb-5 text-h6 font-weight-bold">Gestion des prix</h3>
            <VRow>
              <VCol>
                <VBtn
                  prepend-icon="ic:baseline-new-label"
                  size="small"
                  text="Ajout de prix"
                  @click="dialogNewPrice = true"
                />
              </VCol>
            </VRow>
            <VRow v-if="panelPrices.length > 0">
              <VCol cols="12">
                <VTable
                  hover
                  class="rounded"
                >
                  <thead>
                    <tr>
                      <th>Prix</th>
                      <th>Date de début</th>
                      <th>Date de fin</th>
                      <th>historique</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="price in panelPrices"
                      :key="price.id"
                      :class="{
                        'bg-primary-900 text-white':
                          new Date(price.startDate) <= new Date() &&
                          (!price.endDate || new Date(price.endDate) >= new Date()),
                      }"
                    >
                      <td
                        :class="{
                          'text-white font-weight-bold text-body-1':
                            new Date(price.startDate) <= new Date() &&
                            (!price.endDate || new Date(price.endDate) >= new Date()),
                        }"
                      >
                        {{ getNumberFormat(price.price) }} €
                      </td>
                      <td class="text-center">
                        {{ getDateFormat(price.startDate, 'dateFormatFRBis') }}
                      </td>
                      <td
                        v-if="price.endDate"
                        class="text-center"
                      >
                        {{ getDateFormat(price.endDate, 'dateFormatFRBis') }}
                      </td>
                      <td
                        v-else
                        class="text-overline text-center text-white"
                      >
                        -
                      </td>
                      <td class="text-center py-1">
                        Ajouté le {{ getDateFormat(price.updatedAt) }} par
                        <VSpacer class="my-1" />
                        <VChip
                          :prepend-avatar="
                            price.updatedBy.picture
                              ? `${baseURL}img/users/${price.updatedBy.picture}`
                              : `${baseURL}img/logo/no-avatar.jpg`
                          "
                          color="yellow-sunstack"
                          class="px-2"
                        >
                          {{ price.updatedBy.fullName }}
                        </VChip>
                      </td>
                    </tr>
                  </tbody>
                </VTable>
              </VCol>
            </VRow>
          </VCardText>
        </VCardText>
      </VCard>
    </VDialog>
    <VDialog
      v-model="dialogNewPrice"
      max-width="800"
      min-width="500"
      persistent
    >
      <VCard>
        <DialogCloseBtn @click="dialogNewPrice = false" />
        <VCardTitle>
          <h5 class="text-h5">Ajout de prix pour le panneau</h5>
          <span class="text-primary font-weight-bold text-body-1 font-italic">
            {{ panelData.model }} - {{ panelData.power }}
          </span>
        </VCardTitle>
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="newPrice.price"
                autofocus
                label="Prix"
                type="number"
                min="0"
                step="0.01"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="newPrice.debutDate"
                label="Date de début"
                type="date"
                :min="latestDate ? getDateFormat(latestDate, 'dateFormatHTMLElement') : '2023-01-01'"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VFadeTransition mode="out-in">
          <VCardText v-if="isDateDebutIncorrect">
            <VRow justify="center">
              <VCol cols="9">
                <VAlert
                  density="compact"
                  variant="tonal"
                  color="error"
                  icon="ic:sharp-error"
                  prominent
                  :title="`La date de début ne peut être inférieure au ${getDateFormat(latestDate, 'dateFormatFRBis')}`"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VFadeTransition>
        <VCardText class="d-flex justify-end align-center gap-x-2">
          <VBtn
            color="primary"
            text="Ajouter"
            prepend-icon="ic:baseline-add"
            :loading="isPersistingPrice"
            :disabled="isPersistingPrice"
            @click="addPrice"
          />
        </VCardText>
      </VCard>
    </VDialog>
    <VMain>
      <VCard>
        <VCardTitle>
          <h1 class="text-lg-h4 text-body-1 font-weight-bold">Gestion des modèles de panneau</h1>
        </VCardTitle>
        <VCardText class="d-flex flex-wrap gap-4">
          <div class="flex-grow-1" />
          <div class="d-flex gap-6 app-user-search-filter align-center">
            <VTextField
              v-model="search"
              density="compact"
              clearable
              placeholder="Recherche d'un panneau..."
            />
            <VBtn
              text="Ajouter un panneau"
              color="info"
              @click.prevent="onAddPanel"
            />
          </div>
        </VCardText>
        <VDataTable
          class="rounded-0 text-body-1"
          :headers="headers"
          :loading="isLoading"
          :search="search"
          :items="panelList"
          :sort-by="[
            { key: 'debutOnSaleAt', order: 'desc' },
            { key: 'power', order: 'asc' },
          ]"
        >
          <template #item="{ item }">
            <tr
              class="cursor-pointer"
              :class="item.isActive ? 'panel--active' : 'panel--disabled'"
              @click="onSelect(item)"
            >
              <td>{{ item.model }}</td>
              <td>{{ item.power }}</td>
              <td>{{ item.installationType === 'I' ? 'Industriel' : 'Commercial' }}</td>
              <td>{{ item.debutOnSaleAt ? getDateFormat(item.debutOnSaleAt, 'dateFormatFRBis') : '-' }}</td>
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

.panel--disabled {
  opacity: 0.65 !important;
}

.panel--active {
  color: rgb(var(--v-theme-on-background));
  font-weight: 700;
}
</style>
