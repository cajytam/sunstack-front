<script setup lang="ts">
import {
  conditionsLimitTypes,
  conditionsTypes,
  deletePricingFactorCondition,
  getAllPricingFactorTypes,
  patchPricingFactorPrice,
  patchPricingFactorType,
  postPricingFactorCondition,
  postPricingFactorPrice,
  postPricingFactorType,
} from '@/services/pricingFactorService'
import { isInListOfObject } from '@/utils/arrayUtils'
import { useUserStore } from '@/stores/user'
import { getCurrentDateForDatabase, getDateFormat, isDate } from '@/utils/dateUtils'
import { getNumberFormat } from '@/utils/numberUtils'
import type { Ref } from 'vue'
import type { PricingFactorPrice, PricingFactorType } from '@core/types'
import { patchInverterPrice } from '@/services/inverterService'

const baseURL = import.meta.env.VITE_API_URI

const userStore = useUserStore()
const { authUser } = userStore

/** Gestion Erreur et Persistance **/
const isDisplayAlert = ref(false)
const isError = ref(false)
const isPersisting = ref(false)
const notificationContent = reactive({
  alertType: '',
  title: '',
  text: '',
})
const isLoading = ref(true)
const dialogNew = ref(false)
const dialogNewPrice = ref(false)
const labelOperation = ref('Ajouter')
const idRow = ref(null)

const pricingFactorPrices: Ref<PricingFactorPrice[]> = ref([])
const latestDate = ref(null)
const isPersistingPrice = ref(false)

const search = ref('')
/** FIN Gestion Erreur **/

const headers = [{ title: 'Nom', align: 'start', key: 'name' }]

const pricingFactorTypesList = ref([])
const data: Ref<PricingFactorType> = ref({
  name: null,
})

const initialValues = () => {
  data.value.name = null
  pricingFactorPrices.value = []
}

const getAllFactorPriceTypes = async () => {
  await getAllPricingFactorTypes()
    .then(res => {
      pricingFactorTypesList.value = res.data['hydra:member']
      if (process.env.NODE_ENV === 'development') console.log(res.data)
    })
    .catch(err => {
      isError.value = true
      console.error(err)
    })
    .finally(() => {
      isLoading.value = false
    })
}

const onAddPricingFactor = () => {
  idRow.value = null
  idPrice.value = null
  labelOperation.value = 'Ajouter'
  initialValues()
  dialogNew.value = true
}

const onSelect = idCurrentRow => {
  labelOperation.value = 'Modifier'
  latestDate.value = null

  isAddEndDateAvailable.value = false

  const dataCurrentData = pricingFactorTypesList.value.find(pricingFactor => {
    return pricingFactor.id === idCurrentRow
  })

  idRow.value = dataCurrentData.id
  dialogNew.value = true
  data.value.name = dataCurrentData.name

  pricingFactorPrices.value = dataCurrentData.pricingFactorPrices.sort((a, b) => {
    if (!latestDate.value || new Date(b.endAt) > new Date(latestDate.value)) latestDate.value = b.endAt
    else if (new Date(b.startAt) > new Date(latestDate.value)) latestDate.value = b.startAt

    return new Date(b.startAt) - new Date(a.startAt)
  })
  isAddEndDateAvailable.value = pricingFactorPrices.value.filter(item => !item.endAt).length > 0
  endDateForm.value = null
}

const onSubmit = () => {
  if (!data.value.name) return

  isPersisting.value = true

  if (idRow.value) {
    patchPricingFactorType(idRow.value, data.value)
      .then(async res => {
        if (process.env.NODE_ENV === 'development') console.log(res)

        latestDate.value = null

        isDisplayAlert.value = true
        notificationContent.alertType = 'success'
        notificationContent.title = `Le facteur de prix ${data.value.name} a bien été modifié`

        await getAllFactorPriceTypes()
      })
      .catch(err => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'error'
        notificationContent.title = 'Erreur lors de la modification du facteur de prix'
        notificationContent.text = err.response.data['hydra:description']
        console.error(err)
      })
      .finally(() => (isPersisting.value = false))
  } else {
    postPricingFactorType(data.value)
      .then(async res => {
        initPriceValue()

        if (process.env.NODE_ENV === 'development') console.log(res.data)
        idRow.value = res.data.id

        labelOperation.value = 'Modifier'
        latestDate.value = null

        isDisplayAlert.value = true
        notificationContent.alertType = 'success'
        notificationContent.title = `Le facteur de prix ${data.value.name} a bien été ajouté`
        await getAllFactorPriceTypes()
      })
      .catch(err => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'error'
        notificationContent.title = "Erreur lors de l'enregistrement du facteur de prix"
        notificationContent.text = err.response.data['hydra:description']
        console.error(err)
      })
      .finally(() => (isPersisting.value = false))
  }
}

const initDataPrice: PricingFactorPrice = {
  pricingFactor: null,
  markedPrice: null,
  unmarkedPrice: null,
  startAt: null,
  endAt: null,
  addedBy: null,
  addedAt: null,
  updatedBy: null,
  updatedAt: null,
}

const selectedCondition = ref(null)
const selectedValue = ref(null)
const selectedLimitType = ref(null)
const listConditions = ref([])
const isPersistingPriceCondition = ref(false)

const conditionsTypesList = Object.entries(conditionsTypes)
  .map(([key, value]) => {
    return { key, ...value }
  })
  .sort((a, b) => {
    return a.name.localeCompare(b.name)
  })

const conditionsLimitTypesList = Object.entries(conditionsLimitTypes).map(([key, value]) => {
  return { key, ...value }
})

const onAddPrice = () => {
  dialogNewPrice.value = true
  labelOperationPrice.value = 'Ajouter'
  colorOperationPrice.value = 'primary'
}

const errorConditionAlreadyExists = ref(false)
const errorDatePrice = ref(false)

const onCheckDate = () => {
  errorDatePrice.value = !!(
    dataPrice.value.endAt &&
    isDate(dataPrice.value.endAt) &&
    isDate(dataPrice.value.startAt) &&
    dataPrice.value.endAt <= dataPrice.value.startAt
  )
}

const onUpdateConditionTypeForm = () => {
  if (selectedCondition.value && selectedCondition.value['type'] === 'list') {
    selectedValue.value = null
    selectedLimitType.value = null
  } else if (selectedCondition.value && selectedCondition.value['type'] === 'bool') {
    selectedValue.value = true
    selectedLimitType.value = { key: 'bool' }
  } else {
    selectedValue.value = 1
    selectedLimitType.value = conditionsLimitTypesList[0]
  }
}

const addCondition = () => {
  if (!selectedCondition.value || !selectedValue.value) return

  const valueToCheck = !!selectedLimitType.value
    ? `${selectedCondition.value['key']}_${selectedLimitType.value['key']}`
    : `${selectedCondition.value['key']}`

  if (
    isInListOfObject(listConditions.value, valueToCheck, !!selectedLimitType.value ? ['type', 'limitType'] : ['type'])
  ) {
    errorConditionAlreadyExists.value = true
    setTimeout(() => {
      errorConditionAlreadyExists.value = false
    }, 4000)
  } else {
    isPersistingPriceCondition.value = true

    postPricingFactorCondition({
      pricingFactorPrice: `/api/pricing_factor_prices/${idPrice.value}`,
      type: selectedCondition.value['key'],
      value: selectedValue.value,
      ...(selectedLimitType.value && { limitType: selectedLimitType.value['key'] }),
    })
      .then(async res => {
        if (process.env.NODE_ENV === 'development') console.log(res.data)
        listConditions.value.push(res.data)
        selectedValue.value = null
        selectedCondition.value = null

        await getAllFactorPriceTypes()

        onSelect(idRow.value)
      })
      .catch(err => console.error(err))
      .finally(() => (isPersistingPriceCondition.value = false))
  }
}

const isDeletingCondition = ref([])

const onRemoveCondition = (idCondition: number, index: number) => {
  isDeletingCondition.value[index] = true

  deletePricingFactorCondition(idCondition)
    .then(async res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      await getAllFactorPriceTypes()
      onSelect(idRow.value)
      listConditions.value.splice(index, 1)
    })
    .catch(err => console.error(err))
    .finally(() => (isDeletingCondition.value[index] = false))
}

const getConditionText = condition => {
  const particularPlural = ['Panneau']
  const { type, value, limitType } = condition
  const conditionType = conditionsTypes[type]
  const conditionLimitType = conditionsLimitTypes[limitType]

  if (conditionType.type === 'bool') {
    return `si ${conditionType.name}`
  } else if (conditionType.type === 'list') {
    return `${conditionType.name} (${value})`
  } else if (value > 1) {
    return (
      conditionLimitType.name +
      ' ' +
      value +
      ' ' +
      conditionType.name +
      (particularPlural.includes(conditionType.name) ? 'x' : 's')
    )
  } else {
    if (limitType === 'by') {
      return `Par ${conditionType.name}`
    } else {
      return `${conditionLimitType.name} ${value} ${conditionType.name}`
    }
  }
}

const idPrice = ref(null)
const labelOperationPrice = ref('Ajouter')
const colorOperationPrice = ref('primary')

const initPriceValue = () => {
  dataPrice.value = {
    ...initDataPrice,
  }
  selectedCondition.value = null
  selectedValue.value = null
  selectedLimitType.value = null
  listConditions.value = []
  idPrice.value = null
}

const submitPrice = async () => {
  onCheckDate()
  if (errorDatePrice.value) return

  isPersistingPrice.value = true

  dataPrice.value.pricingFactor = `/api/pricing_factor_types/${idRow.value}`

  if (dataPrice.value.endAt === '') dataPrice.value.endAt = null

  try {
    let response
    if (idPrice.value) {
      dataPrice.value.updatedBy = authUser.uri
      dataPrice.value.updatedAt = getCurrentDateForDatabase()
      response = await patchPricingFactorPrice(idPrice.value, { ...dataPrice.value })
    } else {
      dataPrice.value.addedBy = authUser.uri
      dataPrice.value.addedAt = getCurrentDateForDatabase()
      response = await postPricingFactorPrice({ ...dataPrice.value })
      idPrice.value = response.data.id
    }

    if (process.env.NODE_ENV === 'development') console.log(response.data)

    latestDate.value = null

    isDisplayAlert.value = true
    notificationContent.alertType = 'success'
    notificationContent.title = `Le prix pour ${data.value.name} a bien été ajouté`

    await getAllFactorPriceTypes()

    onSelect(idRow.value)
  } catch (error) {
    console.error(error)
  } finally {
    isPersistingPrice.value = false
  }
}

const onEditPrice = (idCurrentPrice: number) => {
  dialogNewPrice.value = true
  labelOperationPrice.value = 'Modifier'
  colorOperationPrice.value = 'warning'
  idPrice.value = idCurrentPrice

  const dataToEdit: PricingFactorPrice = pricingFactorPrices.value.find(price => {
    return price.id === idCurrentPrice
  })

  dataPrice.value = {
    pricingFactor: dataToEdit.pricingFactor,
    markedPrice: dataToEdit.markedPrice,
    unmarkedPrice: dataToEdit.unmarkedPrice,
    startAt: getDateFormat(dataToEdit.startAt, 'dateFormatHTMLElement'),
    endAt: dataToEdit.endAt ? getDateFormat(dataToEdit.endAt, 'dateFormatHTMLElement') : null,
  }

  if (dataToEdit.pricingFactorConditions) {
    listConditions.value = dataToEdit.pricingFactorConditions
  }
}

const dataPrice: Ref<PricingFactorPrice> = ref({
  ...initDataPrice,
})

const onCloseDialog = () => {
  dialogNew.value = false
  initialValues()
}

const onCloseDialogPrice = () => {
  dialogNewPrice.value = false
  initPriceValue()
}

/**
 * Gestion date de fin
 */
const dialogAddEndDate = ref(false)
const isAddEndDateAvailable = ref(false)
const endDateForm = ref(null)

const onAddEndDate = () => {
  if (endDateForm.value) {
    isPersistingPrice.value = true

    const promises = pricingFactorPrices.value.map(price => {
      if (!price.endAt) {
        return patchPricingFactorPrice(price.id, {
          endAt: new Date(endDateForm.value),
        })
          .then(res => {
            if (process.env.NODE_ENV === 'development') console.log(res)
          })
          .catch(err => console.error(err))
          .finally(() => {
            price.endDate = new Date(endDateForm.value)
          })
      } else {
        return Promise.resolve()
      }
    })

    Promise.all(promises).finally(async () => {
      await getAllFactorPriceTypes()
      onSelect(idRow.value)
      isPersistingPrice.value = false
      dialogAddEndDate.value = false
    })
  }
}

/**
 * FIN Gestion date de fin
 */

const isPersistingEndDateToNull = ref(false)
const onSetEndDateToNull = idPrice => {
  isPersistingEndDateToNull.value = true
  patchPricingFactorPrice(idPrice, {
    endAt: null,
  })
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)
    })
    .catch(err => console.error(err))
    .finally(async () => {
      isPersistingEndDateToNull.value = false
      await getAllFactorPriceTypes()
      onSelect(idRow.value)
      onEditPrice(idPrice)
    })
}

onMounted(async () => {
  await getAllFactorPriceTypes()
})
</script>

<template>
  <div>
    <VDialog
      v-model="dialogNew"
      width="1440"
      persistent
    >
      <VCard>
        <DialogCloseBtn @click="onCloseDialog" />
        <VCardTitle>
          <span class="text-h5"> {{ labelOperation }} un facteur </span>
        </VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12">
              <VTextField
                label="Nom"
                v-model="data.name"
                required
                id="nameFactorPrice"
                name="nameFactorPrice"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardText>
          <div class="d-flex my-5 justify-center">
            <VBtn
              prepend-icon="tabler:edit"
              color="primary"
              variant="elevated"
              :text="labelOperation"
              :loading="isPersisting"
              @click="onSubmit"
            />
          </div>
          <VCardText
            v-if="idRow"
            class="rounded bg-var-theme-background pt-2"
          >
            <h3 class="mb-5 text-h6 font-weight-bold">Gestion des prix</h3>
            <VRow>
              <VCol>
                <VBtn
                  prepend-icon="ic:baseline-new-label"
                  size="small"
                  text="Ajout de prix"
                  @click="onAddPrice"
                />

                <VBtn
                  v-if="isAddEndDateAvailable"
                  class="ms-2"
                  prepend-icon="fa:close"
                  variant="outlined"
                  color="warning"
                  size="small"
                  text="Ajout date fin prise en compte du facteur"
                  @click="dialogAddEndDate = true"
                />
              </VCol>
            </VRow>
            <VRow v-if="pricingFactorPrices.length > 0">
              <VCol cols="12">
                <VTable
                  hover
                  class="rounded"
                >
                  <thead>
                    <tr>
                      <th class="text-center">Prix Margé</th>
                      <th class="text-center">Prix non margé</th>
                      <th class="text-center">Date de début</th>
                      <th class="text-center">Date de fin</th>
                      <th class="text-center">Conditions</th>
                      <th class="text-center">historique</th>
                      <th class="text-center">actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="price in pricingFactorPrices"
                      :key="price.id"
                      class="text-center"
                      :class="{
                        'bg-primary-900 text-white':
                          new Date(price.startAt) <= new Date() &&
                          (!price.endAt || new Date(price.endAt) >= new Date()),
                      }"
                    >
                      <td
                        :class="{
                          'text-white font-weight-bold text-body-1':
                            new Date(price.startAt) <= new Date() &&
                            (!price.endAt || new Date(price.endAt) >= new Date()),
                        }"
                      >
                        {{ price.markedPrice ? `${getNumberFormat(price.markedPrice)}€` : '-' }}
                      </td>
                      <td
                        :class="{
                          'text-white font-weight-bold text-body-1':
                            new Date(price.startAt) <= new Date() &&
                            (!price.endAt || new Date(price.endAt) >= new Date()),
                        }"
                      >
                        {{ price.unmarkedPrice ? `${getNumberFormat(price.unmarkedPrice)}€` : '-' }}
                      </td>
                      <td>
                        {{ getDateFormat(price.startAt, 'dateFormatFRBis') }}
                      </td>
                      <td v-if="price.endAt">
                        {{ getDateFormat(price.endAt, 'dateFormatFRBis') }}
                      </td>
                      <td v-else>-</td>
                      <td>
                        <VChip
                          v-for="condition in price.pricingFactorConditions"
                          class="me-1 my-1"
                          density="compact"
                          color="secondary"
                          variant="elevated"
                        >
                          {{ getConditionText(condition) }}
                        </VChip>
                      </td>
                      <td class="py-1">
                        {{ price.updatedAt ? 'Modifié' : 'Ajouté' }} le
                        {{ getDateFormat(price.updatedAt ?? price.addedAt) }} par
                        <VSpacer class="my-1" />
                        <VChip
                          :prepend-avatar="
                            price.updatedBy
                              ? price.updatedBy.picture
                                ? `${baseURL}img/users/${price.updatedBy.picture}`
                                : `${baseURL}img/logo/no-avatar.jpg
                            `
                              : price.addedBy.picture
                                ? `${baseURL}img/users/${price.addedBy.picture}`
                                : `${baseURL}img/logo/no-avatar.jpg
                            `
                          "
                          class="px-2"
                        >
                          {{ price.updatedBy?.fullName ?? price.addedBy.fullName }}
                        </VChip>
                      </td>
                      <td class="text-overline text-white">
                        <VBtn
                          icon="typcn:edit"
                          color="warning"
                          size="small"
                          @click="onEditPrice(price.id)"
                        />
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
      v-model="dialogAddEndDate"
      max-width="800"
      min-width="500"
      persistent
    >
      <VCard>
        <DialogCloseBtn @click="dialogAddEndDate = false" />
        <VCardTitle>
          <h6 class="text-h6">Ajouter une date de fin de prise en compte</h6>
          <span class="text-primary text-body-1 font-italic">
            {{ data.name }}
          </span>
        </VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12">
              <VTextField
                autofocus
                v-model="endDateForm"
                label="Date de fin de prise en compte du facteur"
                type="date"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardText class="d-flex justify-end align-center gap-x-2">
          <VBtn
            color="primary"
            text="Ajouter"
            prepend-icon="ic:baseline-add"
            :loading="isPersistingPrice"
            :disabled="isPersistingPrice"
            @click="onAddEndDate"
          />
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
        <VCardTitle>
          <span>{{ labelOperationPrice }} le prix pour </span>
          <span class="text-primary font-weight-bold"> {{ data.name }}</span>
          <DialogCloseBtn @click="onCloseDialogPrice" />
        </VCardTitle>
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="dataPrice.markedPrice"
                autofocus
                label="Prix margé"
                type="number"
                min="0"
                step="0.01"
                suffix="€"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="dataPrice.unmarkedPrice"
                label="Prix non margé"
                type="number"
                min="0"
                step="0.01"
                suffix="€"
              />
            </VCol>
          </VRow>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="dataPrice.startAt"
                label="Date de début"
                type="date"
                @update:model-value="onCheckDate"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="dataPrice.endAt"
                label="Date de fin"
                type="date"
                @update:model-value="onCheckDate"
              />
            </VCol>
          </VRow>
          <VRow class="mb-3">
            <VCol class="d-flex justify-end align-center">
              <VBtn
                @click="onSetEndDateToNull(idPrice)"
                prepend-icon="icon-park-outline:change-date-sort"
                variant="tonal"
                color="info"
                size="x-small"
                text="Effacer date de fin"
                :disabled="isPersistingEndDateToNull"
                :loading="isPersistingEndDateToNull"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardText class="d-flex align-center gap-x-4 justify-end">
          <VSlideYReverseTransition mode="out-in">
            <div
              v-if="errorDatePrice"
              class="text-error d-flex align-center gap-x-1"
            >
              <VIcon
                color="error"
                icon="bx:error"
              />
              <span>Il y a une incohérence entre les dates, merci de corriger</span>
            </div>
          </VSlideYReverseTransition>
          <VBtn
            :color="colorOperationPrice"
            :text="`${labelOperationPrice} prix`"
            prepend-icon="ic:baseline-add"
            :loading="isPersistingPrice"
            :disabled="isPersistingPrice"
            @click="submitPrice"
          />
        </VCardText>
        <VCardText v-if="idPrice">
          <VCard
            border
            class="border-primary mt-5"
            elevation="12"
          >
            <VCardTitle class="text-h6">
              Condition(s) à remplir afin que <span class="text-primary font-weight-bold">{{ data.name }}</span>
              s'ajoute au prix
            </VCardTitle>
            <div class="border mx-4 rounded px-4 py-3 elevation-5">
              <span
                v-if="listConditions.length <= 0"
                class="text-caption font-italic text-secondary"
              >
                Aucune condition n'a été renseignée pour le moment
              </span>
              <template v-else>
                <VChip
                  v-for="(condition, index) in listConditions"
                  :key="index"
                  closable
                  :disabled="isDeletingCondition[index]"
                  variant="elevated"
                  color="primary"
                  class="me-2 mb-1"
                >
                  <template #close>
                    <v-icon
                      class="chip-delete-condition__icon"
                      :icon="isDeletingCondition[index] ? 'line-md:loading-loop' : 'material-symbols:close'"
                      @click.stop="onRemoveCondition(condition.id, index)"
                    />
                  </template>
                  {{ getConditionText(condition) }}
                </VChip>
              </template>
            </div>
            <VCardText>
              <div class="d-flex align-center justify-center gap-x-2 mb-2">
                <VIcon
                  icon="fluent:tab-new-24-filled"
                  color="primary"
                />
                <h4 class="text-primary">Paramétrer une condition</h4>
              </div>
              <VRow
                align="center"
                justify="center"
              >
                <VCol cols="3"> Type condition</VCol>
                <VCol cols="9">
                  <VSelect
                    v-model="selectedCondition"
                    :items="conditionsTypesList"
                    item-value="key"
                    item-title="name"
                    return-object
                    variant="filled"
                    @update:model-value="onUpdateConditionTypeForm"
                  />
                </VCol>
              </VRow>
              <VScaleTransition>
                <VRow
                  v-if="selectedCondition && selectedCondition['type'] === 'list'"
                  align="center"
                  justify="center"
                >
                  <VCol cols="3">Choix du type</VCol>
                  <VCol cols="9">
                    <VSelect
                      v-model="selectedValue"
                      :items="selectedCondition['list']"
                      variant="solo"
                    />
                  </VCol>
                </VRow>
                <VRow
                  v-else-if="selectedCondition && selectedCondition['type'] === 'bool'"
                  align="center"
                  justify="center"
                >
                  <VCol class="text-center font-italic">Ajouter pour valider le choix</VCol>
                </VRow>
                <VRow
                  v-else-if="selectedValue"
                  align="center"
                  justify="center"
                >
                  <VCol cols="3">Type de limite</VCol>
                  <VCol cols="9">
                    <VSelect
                      v-model="selectedLimitType"
                      :items="conditionsLimitTypesList"
                      item-value="key"
                      item-title="name"
                      return-object
                      variant="filled"
                    />
                  </VCol>
                  <VCol cols="3">Nombre</VCol>
                  <VCol cols="9">
                    <VTextField
                      v-model="selectedValue"
                      type="number"
                      step="1"
                      min="0"
                      variant="solo"
                    />
                  </VCol>
                </VRow>
              </VScaleTransition>
              <div class="d-flex align-center justify-end my-5 gap-x-5">
                <VDialogTransition mode="out-in">
                  <div
                    v-if="errorConditionAlreadyExists"
                    class="text-error"
                  >
                    <span>La condition </span>
                    <span class="font-weight-bold">
                      {{
                        (selectedLimitType && selectedLimitType.key !== 'bool' ? selectedLimitType.name + ' ' : '') +
                        conditionsTypes[selectedCondition['key']].name
                      }}
                    </span>
                    <span> existe déjà</span>
                  </div>
                  <VSpacer v-else />
                </VDialogTransition>
                <VBtn
                  @click="addCondition"
                  size="small"
                  color="primary"
                  text="Ajouter condition"
                  prepend-icon="material-symbols:add"
                  :loading="isPersistingPriceCondition"
                  :disabled="isPersistingPriceCondition"
                />
              </div>
            </VCardText>
          </VCard>
        </VCardText>
      </VCard>
    </VDialog>
    <VMain>
      <VCard>
        <VCardTitle>
          <h1 class="text-lg-h4 text-body-1 font-weight-bold">Gestion des autres facteurs de prix</h1>
        </VCardTitle>
        <VCardText class="d-flex flex-wrap gap-4">
          <div class="flex-grow-1" />
          <div class="d-flex gap-6 app-user-search-filter align-center">
            <VTextField
              v-model="search"
              clearable
              density="compact"
              placeholder="Rechercher facteur..."
            />
            <VBtn
              text="Ajouter un facteur de prix"
              color="info"
              @click="onAddPricingFactor"
              prepend-icon="material-symbols:box-add"
            />
          </div>
        </VCardText>
        <VDataTable
          class="rounded-0 text-body-1"
          :headers="headers"
          :search="search"
          :items="pricingFactorTypesList"
          :loading="isLoading"
          :sort-by="[{ key: 'name', order: 'asc' }]"
        >
          <template #item="{ item }">
            <tr
              @click="onSelect(item.id)"
              class="cursor-pointer"
            >
              <td>{{ item.name }}</td>
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
  inline-size: 32rem;
}

.panel--disabled {
  opacity: 0.65 !important;
}

.panel--active {
  color: rgb(var(--v-theme-on-background));
  font-size: 1.1rem;
  font-weight: 700;
}

.chip-delete-condition__icon:focus {
  outline: none;
}
</style>
