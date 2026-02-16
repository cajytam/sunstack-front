<script setup lang="ts">
import { getAll } from '@/services/api'
import { useUserStore } from '@/stores/user'
import { getNumberFormat } from '@/utils/numberUtils'
import { getDateFormat } from '@/utils/dateUtils'
import { addBatteryPrice, patchBatteryData, patchBatteryPrice, postBatteryData } from '@/services/batteryService'
import { deepClone } from '@/utils/jsonUtils'
import { isIntValid, isStringValid } from '@/utils/formUtils'

const baseURL = import.meta.env.VITE_API_URI

const userStore = useUserStore()
const { authUser } = userStore

const dialogNew = ref(false)
const labelOperation = ref('Ajouter')
const idRow = ref(null)

const batteriesList = ref()

const isLoading = ref(true)
const search = ref('')

const batteryData = reactive({
  brand: null,
  model: null,
  capacity: null,
})

const isDisplayAlert = ref(false)
const isPersisting = ref(false)

const headers = [
  { title: 'Marque', align: 'center', key: 'brand' },
  { title: 'Modèle', align: 'center', key: 'model' },
  { title: 'Capacité (en kW)', align: 'center', key: 'capacity' },
]

const getAllBatteries = () => {
  getAll('battery')
    .then(res => {
      batteriesList.value = res.data
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
  getAllBatteries()
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
  batteryData.brand = null
  batteryData.model = null
  batteryData.capacity = null

  batteryPrices.value = []
}

const onAddBattery = () => {
  idRow.value = null
  labelOperation.value = 'Ajouter'
  initialValues()
  dialogNew.value = true
}

const onSubmit = async () => {
  if (!isDataValid(batteryData)) return

  isPersisting.value = true

  try {
    let res
    let libelleAction = 'modifié'

    if (idRow.value) {
      res = await patchBattery(idRow.value, batteryData)
    } else {
      res = await postBattery(batteryData)
      idRow.value = res.data.id
      labelOperation.value = 'Modifier'
      libelleAction = 'ajouté'
    }

    if (process.env.NODE_ENV === 'development') console.log(res)

    isSuccess.value = true
    alertText.value = `Le modèle de batterie <strong>${batteryData.brand} ${batteryData.model}</strong> a bien été ${libelleAction}`

    getAllBatteries()
  } catch (err) {
    alertText.value = err.response.data['hydra:description']
    isError.value = true
    console.error(err)
  } finally {
    isPersisting.value = false
  }
}

const isDataValid = data => {
  return isStringValid(data.brand) && isStringValid(data.model) && isIntValid(data.capacity)
}

const patchBattery = async (id, data) => {
  return await patchBatteryData(id, deepClone(data))
}

const postBattery = async data => {
  return await postBatteryData(deepClone(data))
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

  batteryData.brand = item.brand
  batteryData.model = item.model
  batteryData.capacity = item.capacity

  batteryPrices.value = item.batteryPrices.sort((a, b) => {
    if (!latestDate.value || new Date(a.startDate) > new Date(latestDate.value)) latestDate.value = a.startDate
    return new Date(b.startDate) - new Date(a.startDate)
  })
  setLatestDate()
}

const dialogNewPrice = ref(false)
const batteryPrices = ref([])
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

  addBatteryPrice(idRow.value, authUser.uri, newPrice.price, newPrice.debutDate)
    .then(async res => {
      const batteryId = res.battery.id

      if (process.env.NODE_ENV === 'development') console.log(`ajout du prix de la batterie ${batteryId} => `, res)

      isSuccess.value = true
      alertText.value = `Le prix pour la batterie <strong>${batteryData.brand} ${batteryData.model}</strong> a bien été ajouté`

      await updateEndDateOtherPrice(batteryId)

      batteriesList.value.find(obj => obj.id === batteryId).batteryPrices.push(res)

      batteryPrices.value = batteriesList.value
        .find(obj => obj.id === batteryId)
        .batteryPrices.sort((a, b) => {
          if (!latestDate.value || new Date(a.startDate) > new Date(latestDate.value)) latestDate.value = a.startDate
          return new Date(b.startDate) - new Date(a.startDate)
        })

      setLatestDate()

      dialogNewPrice.value = false

      getAllBatteries()
      initPriceValue()
    })

    .finally(() => (isPersistingPrice.value = false))
}

const updateEndDateOtherPrice = async batteryId => {
  const batteryToUpdate = batteriesList.value.find(obj => obj.id === batteryId)

  for (let price of batteryToUpdate.batteryPrices) {
    if (!price.endDate) {
      const priceEndDate = new Date(newPrice.debutDate).setDate(new Date(newPrice.debutDate).getDate() - 1)

      try {
        const res = await patchBatteryPrice(price.id, {
          endDate: new Date(priceEndDate),
        })
        if (process.env.NODE_ENV === 'development') console.log('mise à jour date de fin => ', res)

        const index = batteryToUpdate.batteryPrices.indexOf(price)
        batteryToUpdate.batteryPrices.splice(index, 1)
        batteryToUpdate.batteryPrices.push(res)
      } catch (err) {
        console.error(err)
        alertText.value = err.response.data['hydra:description']
        isError.value = true
      }
    }
  }
}

const setLatestDate = () => {
  if (latestDate.value) latestDate.value = new Date(latestDate.value).setDate(new Date(latestDate.value).getDate() + 1)
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
          <span class="text-h5"> {{ labelOperation }} un modèle de batterie </span>
          <DialogCloseBtn @click="dialogNew = false" />
        </VCardTitle>
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="batteryData.brand"
                autofocus
                label="Marque de la batterie"
                required
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="batteryData.model"
                label="Modèle de la batterie"
                required
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="batteryData.capacity"
                type="number"
                min="0"
                label="Capacité de la batterie (en kW)"
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
            <VRow v-if="batteryPrices.length > 0">
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
                      v-for="price in batteryPrices"
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
                            price.updatedBy.picture
                              ? `${baseURL}img/users/${price.updatedBy.picture}`
                              : `${baseURL}img/logo/no-avatar.jpg`
                          "
                          :color="isCurrentPrice ? 'yellow-sunstack' : 'secondary'"
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
          <h5 class="text-h5">Ajout de prix pour la batterie</h5>
          <span class="text-primary font-weight-bold text-body-1 font-italic">
            {{ batteryData.brand }} - {{ batteryData.model }}
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
          <h1 class="text-lg-h4 text-body-1 font-weight-bold">Gestion des modèles de batteries</h1>
        </VCardTitle>
        <VCardText class="d-flex justify-end align-center gap-4 mt-3">
          <VResponsive max-width="500">
            <VTextField
              v-model="search"
              density="compact"
              clearable
              placeholder="Recherche de batterie..."
            />
          </VResponsive>
          <VBtn
            text="Ajouter un modèle de batterie"
            color="info"
            prepend-icon="material-symbols:battery-plus-rounded"
            elevation="8"
            @click.prevent="onAddBattery"
          />
        </VCardText>
        <VDataTable
          class="rounded-0 text-body-1 text-center"
          :headers="headers"
          :loading="isLoading"
          :search="search"
          :items="batteriesList"
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
              <td>{{ item.capacity }}</td>
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
