<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { getNumberFormat } from '@/utils/numberUtils'
import { getDateFormat } from '@/utils/dateUtils'
import {
  addChargingPointPrice,
  getAllChargingPoint,
  patchChargingPointData,
  patchChargingPointPrice,
  postChargingPointData,
} from '@/services/chargingPointService'
import { deepClone } from '@/utils/jsonUtils'
import { isIntValid, isStringValid } from '@/utils/formUtils'

const baseURL = import.meta.env.VITE_API_URI

const userStore = useUserStore()
const { authUser } = userStore

const dialogNew = ref(false)
const labelOperation = ref('Ajouter')
const idRow = ref(null)

const chargingPointsList = ref([])

const isLoading = ref(true)
const search = ref('')

const chargingPointData = reactive({
  brand: null,
  model: null,
  power: null,
})

const isDisplayAlert = ref(false)
const isPersisting = ref(false)

const headers = [
  { title: 'Marque', align: 'center', key: 'brand' },
  { title: 'Modèle', align: 'center', key: 'model' },
  { title: 'Puissance (en kW)', align: 'center', key: 'power' },
]

const getAllChargingPoints = () => {
  getAllChargingPoint()
    .then(res => {
      chargingPointsList.value = res.data
      if (process.env.NODE_ENV === 'development') console.log(res.data)
    })
    .catch(err => {
      isError.value = true
      alertText.value = err.response.data['hydra:description']

      console.error(err)
    })
    .finally(() => {
      isLoading.value = false
    })
}

onMounted(() => {
  getAllChargingPoints()
})

const displaySnackbar = ref(false)
const isError = ref(false)
const isSuccess = ref(false)
const alertText = ref('')

watch([isSuccess, isError], () => {
  displaySnackbar.value = true
  setTimeout(() => {
    isSuccess.value = false
    isError.value = false
  }, 5000)
})

const initialValues = () => {
  chargingPointData.brand = null
  chargingPointData.model = null
  chargingPointData.power = null
  chargingPointPrices.value = []
}

const onAddChargingPoint = () => {
  idRow.value = null
  labelOperation.value = 'Ajouter'
  initialValues()
  dialogNew.value = true
}

const onSubmit = async () => {
  if (!isDataValid(chargingPointData)) return

  isPersisting.value = true

  try {
    let res
    let libelleAction = 'modifié'

    if (idRow.value) {
      res = await patchChargingPoint(idRow.value, chargingPointData)
    } else {
      res = await postChargingPoint(chargingPointData)
      idRow.value = res.data.id
      labelOperation.value = 'Modifier'
      libelleAction = 'ajouté'
    }

    if (process.env.NODE_ENV === 'development') console.log(res)

    isSuccess.value = true
    alertText.value = `Le modèle de borne <strong>${chargingPointData.brand} ${chargingPointData.model}</strong> a bien été ${libelleAction}`

    getAllChargingPoints()
  } catch (err) {
    alertText.value = err.response.data['hydra:description']
    isError.value = true
    console.error(err)
  } finally {
    isPersisting.value = false
  }
}

const isDataValid = data => {
  return isStringValid(data.brand) && isStringValid(data.model) && isIntValid(data.power)
}

const patchChargingPoint = async (id, data) => {
  return await patchChargingPointData(id, deepClone(data))
}

const postChargingPoint = async data => {
  return await postChargingPointData(deepClone(data))
}

const initPriceValues = () => {
  latestDate.value = null
  isDateDebutIncorrect.value = false
}

const onSelect = item => {
  labelOperation.value = 'Modifier'
  idRow.value = item.id
  dialogNew.value = true
  initPriceValues()

  chargingPointData.brand = item.brand
  chargingPointData.model = item.model
  chargingPointData.power = item.power

  const prices = item.chargingPointPrices ?? []

  chargingPointPrices.value = prices.sort((a, b) => {
    if (!latestDate.value || new Date(b.endDate) > new Date(latestDate.value)) latestDate.value = b.endDate
    else if (new Date(b.startDate) > new Date(latestDate.value)) latestDate.value = b.startDate

    return new Date(b.startDate) - new Date(a.startDate)
  })
  if (latestDate.value) latestDate.value = new Date(latestDate.value).setDate(new Date(latestDate.value).getDate() + 1)
}

const dialogNewPrice = ref(false)
const chargingPointPrices = ref([])
const latestDate = ref(null)
const isPersistingPrice = ref(false)
const isDateDebutIncorrect = ref(false)

const newPrice = reactive({
  debutDate: null,
  price: null,
})

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

  addChargingPointPrice(idRow.value, authUser.uri, newPrice.price, newPrice.debutDate)
    .then(async res => {
      const chargingPointId = res.chargingPoint.id

      if (process.env.NODE_ENV === 'development') console.log(`ajout du prix de la borne ${chargingPointId} => `, res)

      isSuccess.value = true
      alertText.value = `Le prix pour la borne <strong>${chargingPointData.brand} ${chargingPointData.model}</strong> a bien été ajouté`

      await updateEndDateOtherPrice(chargingPointId)

      chargingPointsList.value.find(obj => obj.id === chargingPointId).chargingPointPrices.push(res)

      chargingPointPrices.value = chargingPointsList.value
        .find(obj => obj.id === chargingPointId)
        .chargingPointPrices.sort((a, b) => {
          if (!latestDate.value || new Date(b.endDate) > new Date(latestDate.value)) latestDate.value = b.endDate
          else if (new Date(b.startDate) > new Date(latestDate.value)) latestDate.value = b.startDate

          return new Date(b.startDate) - new Date(a.startDate)
        })

      if (latestDate.value)
        latestDate.value = new Date(latestDate.value).setDate(new Date(latestDate.value).getDate() + 1)

      dialogNewPrice.value = false

      getAllChargingPoints()
      initPriceValue()
    })

    .finally(() => (isPersistingPrice.value = false))
}

const updateEndDateOtherPrice = async chargingPointId => {
  const chargingPointToUpdate = chargingPointsList.value.find(obj => obj.id === chargingPointId)

  for (let price of chargingPointToUpdate.chargingPointPrices) {
    if (!price.endDate) {
      const priceEndDate = new Date(newPrice.debutDate).setDate(new Date(newPrice.debutDate).getDate() - 1)

      try {
        const res = await patchChargingPointPrice(price.id, {
          endDate: new Date(priceEndDate),
        })
        if (process.env.NODE_ENV === 'development') console.log('mise à jour date de fin => ', res)

        const index = chargingPointToUpdate.chargingPointPrices.indexOf(price)
        chargingPointToUpdate.chargingPointPrices.splice(index, 1)
        chargingPointToUpdate.chargingPointPrices.push(res)
      } catch (err) {
        console.error(err)
        alertText.value = err.response.data['hydra:description']
        isError.value = true
      }
    }
  }
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
          <span class="text-h5"> {{ labelOperation }} un modèle de borne </span>
          <DialogCloseBtn @click="dialogNew = false" />
        </VCardTitle>
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="chargingPointData.brand"
                autofocus
                label="Marque de la borne"
                required
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="chargingPointData.model"
                label="Modèle de la borne"
                required
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="chargingPointData.power"
                type="number"
                min="0"
                label="Puissance de la borne (en kW)"
                required
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardText class="d-flex align-center justify-end">
          <VBtn
            color="primary"
            variant="elevated"
            :text="labelOperation"
            :loading="isPersisting"
            :prepend-icon="labelOperation === 'Modifier' ? 'tabler:edit' : 'material-symbols:add-ad'"
            @click="onSubmit"
          />
        </VCardText>
        <VCardText>
          <VCardItem
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
            <VRow v-if="chargingPointPrices.length > 0">
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
                      v-for="price in chargingPointPrices"
                      :key="price.id"
                      :set="
                        isCurrentPrice =
                          new Date(price.startDate) <= new Date() &&
                          (!price.endDate || new Date(price.endDate) >= new Date())
                      "
                      :class="{ 'bg-primary-500 text-white': isCurrentPrice }"
                    >
                      <td :class="{ 'text-white font-weight-bold text-body-1': isCurrentPrice }">
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
                            price.updatedBy && price.updatedBy.picture
                              ? `${baseURL}img/users/${price.updatedBy.picture}`
                              : `${baseURL}img/logo/no-avatar.jpg`
                          "
                          :color="isCurrentPrice ? 'yellow-sunstack' : 'secondary'"
                          class="px-2"
                        >
                          {{ price.updatedBy?.fullName || 'Utilisateur inconnu' }}
                        </VChip>
                      </td>
                    </tr>
                  </tbody>
                </VTable>
              </VCol>
            </VRow>
          </VCardItem>
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
          <h5 class="text-h5">Ajout de prix pour la borne</h5>
          <span class="text-primary font-weight-bold text-body-1 font-italic">
            {{ chargingPointData.brand }} - {{ chargingPointData.model }}
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
          <h1 class="text-lg-h4 text-body-1 font-weight-bold">Gestion des modèles de bornes de recharge</h1>
        </VCardTitle>
        <VCardText class="d-flex justify-end align-center gap-4 mt-3">
          <VResponsive max-width="500">
            <VTextField
              v-model="search"
              density="compact"
              clearable
              placeholder="Recherche de borne..."
            />
          </VResponsive>
          <VBtn
            text="Ajouter un modèle de borne"
            color="info"
            prepend-icon="material-symbols:battery-plus-rounded"
            elevation="8"
            @click.prevent="onAddChargingPoint"
          />
        </VCardText>
        <VDataTable
          class="rounded-0 text-body-1 text-center"
          :headers="headers"
          :loading="isLoading"
          :search="search"
          :items="chargingPointsList"
          :sort-by="[
            { key: 'brand', order: 'asc' },
            { key: 'model', order: 'asc' },
          ]"
        >
          <template #item="{ item }">
            <tr
              @click="onSelect(item)"
              class="cursor-pointer"
            >
              <td>{{ item.brand }}</td>
              <td>{{ item.model }}</td>
              <td>{{ item.power }}</td>
            </tr>
          </template>
        </VDataTable>
      </VCard>
    </VMain>
    <VSnackbar
      v-model="displaySnackbar"
      :color="isError ? 'error' : 'success'"
      close-delay="5000"
      location="top"
    >
      <VIcon
        :icon="isError ? 'ic:outline-error' : 'teenyicons:shield-tick-solid'"
        start
      />
      <span v-html="alertText"></span>
    </VSnackbar>
  </div>
</template>

<style scoped lang="scss">
:deep(.v-data-table__th) {
  background-color: var(--primary-600) !important;
  color: white !important;
}

.inverter-without-price {
  opacity: 0.45 !important;
}
</style>
