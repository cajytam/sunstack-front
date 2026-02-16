<script setup lang="ts">
import { getAll } from '@/services/api'
import {
  addInverterPrice,
  getAllInverterCable,
  patchInverterData,
  patchInverterPrice,
  postInverterData,
} from '@/services/inverterService'
import { getNumberFormat } from '@/utils/numberUtils'
import { addDays, getDateFormat } from '@/utils/dateUtils'
import { useUserStore } from '@/stores/user'

const baseURL = import.meta.env.VITE_API_URI

const userStore = useUserStore()
const { authUser } = userStore

const dialogNew = ref(false)
const labelOperation = ref('Ajouter fiche')
const idRow = ref(null)

const inverterList = ref()
const isError = ref(false)
const isLoading = ref(true)
const search = ref('')

const inverterData = reactive({
  brand: null,
  model: null,
  power: null,
  type: null,
  electricalPhase: null,
  inverterCable: null,
  price: null,
  maxInputPower: null,
  nbMppt: null,
  nbStringPerMppt: null,
  mpptVoltageRangeMin: null,
  mpptVoltageRangeMax: null,
  maxDcInputVoltage: null,
  isDcProtectionIntegrated: false,
  maxDcInputCurrentMppt: null,
  maxShortCircuitCurrentMppt: null,
})

const isDisplayAlert = ref(false)
const isPersisting = ref(false)

const notificationContent = reactive({
  alertType: '',
  title: '',
  text: '',
})

const headers = [
  { title: 'Marque', align: 'center', key: 'brand' },
  { title: 'Modèle', align: 'center', key: 'model' },
  { title: 'Puissance (en kVA)', align: 'center', key: 'power' },
  { title: 'Destiné pour', align: 'center', key: 'type' },
  { title: 'Phase', align: 'center', key: 'electricalPhase' },
  { title: 'Type', align: 'center', key: 'typeInverter' },
  { title: 'Prix actuel', align: 'center', key: 'currentPrice' },
]

const itemsType = [
  { key: 'C', name: 'Commercial' },
  { key: 'I', name: 'Industriel' },
]

const itemsElectricalPhase = [
  { key: 'SP', name: 'Monophasé' },
  { key: 'TP', name: 'Triphasé' },
]

const itemsTypeInverter = [
  { key: 'R', name: 'Réseau' },
  { key: 'H', name: 'Hybride' },
  { key: 'M', name: 'Micro-onduleur' },
]

const itemsTypePrice = [
  { key: null, name: "L'onduleur" },
  { key: 'options', name: 'Les options' },
  { key: 'coffret_erp', name: 'Coffret ERP' },
  { key: 'coffret_non_erp', name: 'Coffret non ERP' },
]

const getAllInverters = () => {
  getAll('inverter')
    .then(res => {
      inverterList.value = res.data

      if (process.env.NODE_ENV === 'development') console.log('allInverters => ', res.data)
    })
    .catch(err => {
      isError.value = true
      console.error(err)
    })
    .finally(() => {
      isLoading.value = false
    })
}

const inverterCableList = ref([])
const getAllInvertersCable = () => {
  getAllInverterCable()
    .then(res => {
      inverterCableList.value = res.data
    })
    .catch(err => {
      isError.value = true
      console.error(err)
    })
    .finally(() => {
      isLoading.value = false
    })
}

const isStringValid = data => {
  return data !== null && data.trim().length > 0
}

const isIntValid = data => {
  return data !== null && data > 0
}

const getValueFromJson = (jsonSource, valueKey) => {
  const item = jsonSource.find(item => item.key === valueKey)

  return item ? item.name : '-'
}

onMounted(() => {
  getAllInverters()
  getAllInvertersCable()
})

const initialValues = () => {
  inverterData.brand = null
  inverterData.model = null
  inverterData.power = null
  inverterData.type = null
  inverterData.electricalPhase = null
  inverterData.inverterCable = null

  inverterData.price = null
  inverterData.typeInverter = null
  inverterData.maxInputPower = null
  inverterData.nbMppt = null
  inverterData.nbStringPerMppt = null
  inverterData.mpptVoltageRangeMin = null
  inverterData.mpptVoltageRangeMax = null
  inverterData.maxDcInputVoltage = null
  inverterData.isDcProtectionIntegrated = false
  inverterData.maxDcInputCurrentMppt = null
  inverterData.maxShortCircuitCurrentMppt = null

  inverterPrices.value = []
}

const onSubmit = () => {
  if (
    !isStringValid(inverterData.brand) ||
    !isStringValid(inverterData.model) ||
    !isIntValid(inverterData.power) ||
    !isStringValid(inverterData.type)
  )
    return

  const data = JSON.parse(JSON.stringify(inverterData))

  isPersisting.value = true

  if (idRow.value) {
    patchInverterData(idRow.value, data)
      .then(() => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'success'
        notificationContent.title = `Le modèle d'onduleur ${inverterData.brand} ${inverterData.model} a bien été modifié`
        dialogNew.value = false
        initialValues()
        getAllInverters()
      })
      .catch(err => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'error'
        notificationContent.title = "erreur lors de la modification d'onduleur"
        notificationContent.text = err.response.data['hydra:description']
        console.error(err)
      })
      .finally(() => (isPersisting.value = false))
  } else {
    postInverterData(data)
      .then(() => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'success'
        notificationContent.title = `Le modèle d'onduleur ${inverterData.brand} ${inverterData.model} a bien été ajouté`
        dialogNew.value = false
        initialValues()
        getAllInverters()
      })
      .catch(err => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'error'
        notificationContent.title = "Erreur lors de l'enregistrement de l'onduleur"
        notificationContent.text = err.response.data['hydra:description']
        console.error(err)
      })
      .finally(() => (isPersisting.value = false))
  }
}

const onAddInverter = () => {
  idRow.value = null
  labelOperation.value = 'Ajouter fiche'
  initialValues()
  dialogNew.value = true
}

const onSelect = row => {
  labelOperation.value = 'Modifier fiche'
  latestDate.value = {}

  isDateDebutIncorrect.value = false
  isAddEndDateAvailable.value = false

  initPriceValue()

  idRow.value = row.id
  dialogNew.value = true
  inverterData.brand = row.brand
  inverterData.model = row.model
  inverterData.power = row.power
  inverterData.type = row.type
  inverterData.electricalPhase = row.electricalPhase
  inverterData.inverterCable = row?.inverterCable?.id

  inverterData.price = row.price
  inverterData.typeInverter = row.typeInverter
  inverterData.maxInputPower = row.maxInputPower
  inverterData.nbMppt = row.nbMppt
  inverterData.nbStringPerMppt = row.nbStringPerMppt
  inverterData.mpptVoltageRangeMin = row.mpptVoltageRangeMin
  inverterData.mpptVoltageRangeMax = row.mpptVoltageRangeMax
  inverterData.maxDcInputVoltage = row.maxDcInputVoltage
  inverterData.isDcProtectionIntegrated = row.isDcProtectionIntegrated
  inverterData.maxDcInputCurrentMppt = row.maxDcInputCurrentMppt
  inverterData.maxShortCircuitCurrentMppt = row.maxShortCircuitCurrentMppt

  inverterPrices.value = row.inverterPrices.sort((a, b) => {
    return new Date(b.startDate) - new Date(a.startDate)
  })

  inverterPrices.value.forEach(price => {
    let currentDate
    if (price.endDate) {
      currentDate = new Date(price.endDate)
    } else {
      currentDate = new Date(price.startDate)
    }
    const typePrice = price.type || 'onduleur'

    if (!latestDate.value[typePrice] || currentDate > latestDate.value[typePrice]) {
      latestDate.value[typePrice] = currentDate
    }
  })

  let values = Object.values(latestDate.value)
  for (let i = 0; i < values.length; i++) {
    values[i] = new Date(addDays(values[i], 1))
  }
  Object.keys(latestDate.value).forEach((key, index) => {
    latestDate.value[key] = values[index]
  })

  isAddEndDateAvailable.value = inverterPrices.value.filter(item => !item.endDate).length > 0
  endDateForm.value = null
}

/**
 * Gestion date de fin
 */
const dialogAddEndDate = ref(false)
const isAddEndDateAvailable = ref(false)
const endDateForm = ref(null)

const onAddEndDate = () => {
  if (endDateForm.value) {
    isDateDebutIncorrect.value = false
    if (new Date(endDateForm.value) < new Date(latestDate.value['onduleur'])) {
      isDateDebutIncorrect.value = true

      return
    }
    isPersistingPrice.value = true

    const newPriceType = newPrice.type || 'onduleur'

    inverterList.value
      .find(obj => obj.id === idRow.value)
      .inverterPrices.forEach(price => {
        const priceType = price.type || 'onduleur'
        if (priceType === newPriceType && !price.endDate) {
          patchInverterPrice(price.id, {
            endDate: new Date(endDateForm.value),
          })
            .then(res => {
              if (process.env.NODE_ENV === 'development') console.log(res)
              getAllInverters()
            })
            .catch(err => console.error(err))
            .finally(() => (price.endDate = new Date(endDateForm.value)))
        }
      })

    inverterPrices.value = inverterList.value
      .find(obj => obj.id === idRow.value)
      .inverterPrices.sort((a, b) => {
        if (!latestDate.value[a.type || 'onduleur']) latestDate.value[a.type || 'onduleur'] = a.endDate
        else if (new Date(b.endDate) > new Date(latestDate.value[b.type || 'onduleur']))
          latestDate.value[b.type || 'onduleur'] = b.endDate
        else if (new Date(b.startDate) > new Date(latestDate.value[b.type || 'onduleur']))
          latestDate.value[b.type || 'onduleur'] = b.startDate

        return new Date(b.startDate) - new Date(a.startDate)
      })

    let values = Object.values(latestDate.value)
    for (let i = 0; i < values.length; i++) {
      values[i] = new Date(values[i]).setDate(new Date(values[i]).getDate() + 1)
    }
    Object.keys(latestDate.value).forEach((key, index) => {
      latestDate.value[key] = values[index]
    })

    isPersistingPrice.value = false
    initPriceValue()
    dialogAddEndDate.value = false
    isAddEndDateAvailable.value = false
  }
}

/*
  GESTION DES PRIX
*/
const dialogNewPrice = ref(false)

const newPrice = reactive({
  debutDate: null,
  price: null,
  type: null,
})

const inverterPrices = ref([])
const latestDate = ref(null)
const isPersistingPrice = ref(false)
const isDateDebutIncorrect = ref(false)

const initPriceValue = () => {
  newPrice.debutDate = null
  newPrice.price = null
  newPrice.type = null
}

const addPrice = () => {
  isDateDebutIncorrect.value = false
  if (!newPrice.price || !newPrice.debutDate) return

  const typePrice = newPrice.type || 'onduleur'

  if (new Date(newPrice.debutDate) <= new Date(latestDate.value[typePrice])) {
    isDateDebutIncorrect.value = true

    return
  }

  isPersistingPrice.value = true

  addInverterPrice(idRow.value, authUser.uri, newPrice.price, newPrice.type, newPrice.debutDate)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log('addInverterPrice => ', res)

      const newPriceType = newPrice.type || 'onduleur'

      inverterList.value
        .find(obj => obj.id === res.inverter.id)
        .inverterPrices.forEach(price => {
          const priceType = price.type || 'onduleur'
          if (priceType === newPriceType && !price.endDate) {
            const priceEndDate = new Date(newPrice.debutDate).setDate(new Date(newPrice.debutDate).getDate() - 1)

            patchInverterPrice(price.id, {
              endDate: new Date(priceEndDate),
            })
              .then(res => {
                if (process.env.NODE_ENV === 'development') console.log(res)
              })
              .catch(err => console.error(err))
              .finally(() => (price.endDate = priceEndDate))
          }
        })

      inverterList.value.find(obj => obj.id === res.inverter.id).inverterPrices.push(res)

      inverterPrices.value.sort((a, b) => {
        return new Date(b.startDate) - new Date(a.startDate)
      })

      inverterPrices.value.forEach(price => {
        let currentDate
        if (price.endDate) {
          currentDate = new Date(price.endDate)
        } else {
          currentDate = new Date(price.startDate)
        }
        const typePrice = price.type || 'onduleur'

        if (!latestDate.value[typePrice] || currentDate > latestDate.value[typePrice]) {
          latestDate.value[typePrice] = currentDate
        }
      })

      let values = Object.values(latestDate.value)
      for (let i = 0; i < values.length; i++) {
        values[i] = new Date(addDays(values[i], 1))
      }
      Object.keys(latestDate.value).forEach((key, index) => {
        latestDate.value[key] = values[index]
      })

      dialogNewPrice.value = false

      initPriceValue()
      getAllInverters()
    })
    .catch(err => console.error(err))
    .finally(() => (isPersistingPrice.value = false))
}

const getPriceTypeName = (keyName: string): string => {
  const data = itemsTypePrice.filter(item => item.key === keyName)
  if (data && data.length > 0) {
    return data[0].name
  }
  return "L'onduleur"
}
/*
  FIN GESTION DES PRIX
*/
</script>

<template>
  <div>
    <VDialog
      v-model="dialogNew"
      width="1024"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex justify-space-between header-card">
          <span class="text-h5"> {{ labelOperation }} un modèle d'onduleur </span>
          <DialogCloseBtn @click="dialogNew = false" />
        </VCardTitle>
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="inverterData.brand"
                autofocus
                label="Marque de l'onduleur"
                required
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="inverterData.model"
                label="Modèle de l'onduleur"
                required
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="inverterData.type"
                :items="itemsType"
                label="Installation cible (Indutriel ou Commercial)"
                required
                item-title="name"
                item-value="key"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="inverterData.electricalPhase"
                :items="itemsElectricalPhase"
                label="Type phase électrique"
                required
                item-title="name"
                item-value="key"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="inverterData.typeInverter"
                label="Type d'onduleur"
                :items="itemsTypeInverter"
                item-title="name"
                item-value="key"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="inverterData.inverterCable"
                label="Type de câble"
                :items="inverterCableList"
                item-title="name"
                item-value="id"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardTitle>Données techniques</VCardTitle>
        <VCardText>
          <VExpansionPanels
            variant="popout"
            multiple
          >
            <VExpansionPanel class="mt-0 mb-3">
              <VExpansionPanelTitle
                class="border border-warning"
                color="warning"
              >
                <span class="text-h5 text-white">DC</span>
              </VExpansionPanelTitle>
              <VExpansionPanelText class="border border-warning">
                <VCardText class="pt-2">
                  <VRow>
                    <VCol cols="12">
                      <VRow
                        no-gutters
                        align="center"
                        justify="center"
                      >
                        <VCol
                          class="d-flex justify-center"
                          cols="12"
                          md="5"
                        >
                          <label for="maxInputPower">Puissance d'entrée max (en W)</label>
                        </VCol>
                        <VCol
                          cols="12"
                          md="7"
                        >
                          <VTextField
                            id="maxInputPower"
                            v-model="inverterData.maxInputPower"
                            type="number"
                            placeholder="Puissance d'entrée max (en W)"
                            persistent-placeholder
                            required
                            min="0"
                            step="0.01"
                            suffix="W"
                            variant="filled"
                          />
                        </VCol>
                      </VRow>
                    </VCol>
                    <VCol cols="12">
                      <VRow
                        no-gutters
                        align="center"
                        justify="center"
                      >
                        <VCol
                          class="d-flex justify-center"
                          cols="12"
                          md="5"
                        >
                          <label for="maxDcInputVoltage">Tension maximale d'entrée (en V)</label>
                        </VCol>
                        <VCol
                          cols="12"
                          md="7"
                        >
                          <VTextField
                            id="maxDcInputVoltage"
                            v-model="inverterData.maxDcInputVoltage"
                            type="number"
                            placeholder="Tension maximale d'entrée (en V)"
                            variant="filled"
                            persistent-placeholder
                            required
                            min="0"
                            step="1"
                            suffix="V"
                          />
                        </VCol>
                      </VRow>
                    </VCol>
                    <VCol cols="12">
                      <VRow
                        no-gutters
                        align="center"
                        justify="center"
                      >
                        <VCol
                          class="d-flex justify-center"
                          cols="12"
                          md="5"
                        >
                          <label for="mpptVoltageRangeMin">Tension minimale de démarrage (en V)</label>
                        </VCol>
                        <VCol
                          cols="12"
                          md="7"
                        >
                          <VTextField
                            id="mpptVoltageRangeMin"
                            v-model="inverterData.mpptVoltageRangeMin"
                            type="number"
                            placeholder="Tension minimale de démarrage (en V)"
                            variant="filled"
                            persistent-placeholder
                            required
                            min="0"
                            step="1"
                            suffix="V"
                          />
                        </VCol>
                      </VRow>
                    </VCol>
                    <VCol cols="12">
                      <VRow
                        no-gutters
                        align="center"
                        justify="center"
                      >
                        <VCol
                          class="d-flex justify-center"
                          cols="12"
                          md="5"
                        >
                          <label for="mpptVoltageRangeMax">Tension maximale par MPPT (en V)</label>
                        </VCol>
                        <VCol
                          cols="12"
                          md="7"
                        >
                          <VTextField
                            id="mpptVoltageRangeMax"
                            v-model="inverterData.mpptVoltageRangeMax"
                            type="number"
                            placeholder="Tension maximale par MPPT (en V)"
                            variant="filled"
                            persistent-placeholder
                            required
                            min="0"
                            step="1"
                            suffix="V"
                          />
                        </VCol>
                      </VRow>
                    </VCol>
                    <VCol cols="12">
                      <VRow
                        no-gutters
                        align="center"
                        justify="center"
                      >
                        <VCol
                          class="d-flex justify-center"
                          cols="12"
                          md="5"
                        >
                          <label for="nbMppt">Nombre de MPPT</label>
                        </VCol>
                        <VCol
                          cols="12"
                          md="7"
                        >
                          <VTextField
                            id="nbMppt"
                            v-model="inverterData.nbMppt"
                            type="number"
                            placeholder="Nombre de MPPT"
                            variant="filled"
                            persistent-placeholder
                            required
                            min="0"
                            step="1"
                          />
                        </VCol>
                      </VRow>
                    </VCol>
                    <VCol cols="12">
                      <VRow
                        no-gutters
                        align="center"
                        justify="center"
                      >
                        <VCol
                          class="d-flex justify-center"
                          cols="12"
                          md="5"
                        >
                          <label for="nbStringPerMppt">Nombre de chaines par MPPT</label>
                        </VCol>
                        <VCol
                          cols="12"
                          md="7"
                        >
                          <VTextField
                            id="nbStringPerMppt"
                            v-model="inverterData.nbStringPerMppt"
                            type="number"
                            placeholder="Nombre de chaine par MPPT"
                            variant="filled"
                            persistent-placeholder
                            required
                            min="0"
                            step="1"
                          />
                        </VCol>
                      </VRow>
                    </VCol>
                    <VCol cols="12">
                      <VRow
                        no-gutters
                        align="center"
                        justify="center"
                      >
                        <VCol
                          class="d-flex justify-center"
                          cols="12"
                          md="5"
                        >
                          <label for="maxDcInputCurrentMppt">Courant d'entrée max. (en A)</label>
                        </VCol>
                        <VCol
                          cols="12"
                          md="7"
                        >
                          <VTextField
                            id="maxDcInputCurrentMppt"
                            v-model="inverterData.maxDcInputCurrentMppt"
                            type="number"
                            placeholder="Courant d'entrée max. (en A)"
                            variant="filled"
                            persistent-placeholder
                            required
                            min="0"
                            step="1"
                            suffix="A"
                          />
                        </VCol>
                      </VRow>
                    </VCol>
                    <VCol cols="12">
                      <VRow
                        no-gutters
                        align="center"
                        justify="center"
                      >
                        <VCol
                          class="d-flex justify-center"
                          cols="12"
                          md="5"
                        >
                          <label for="maxShortCircuitCurrentMppt">Courant de court-circuit max. (en A)</label>
                        </VCol>
                        <VCol
                          cols="12"
                          md="7"
                        >
                          <VTextField
                            id="maxShortCircuitCurrentMppt"
                            v-model="inverterData.maxShortCircuitCurrentMppt"
                            type="number"
                            placeholder="Courant de court-circuit max. (en A)"
                            variant="filled"
                            persistent-placeholder
                            required
                            min="0"
                            step="1"
                            suffix="A"
                          />
                        </VCol>
                      </VRow>
                    </VCol>
                    <VCol cols="12">
                      <VRow
                        no-gutters
                        align="center"
                        justify="center"
                      >
                        <VCol
                          class="d-flex justify-center"
                          cols="12"
                          md="5"
                        >
                          <label for="isDcProtectionIntegrated">Protection DC intégrée</label>
                        </VCol>
                        <VCol
                          class="d-flex justify-center"
                          cols="12"
                          md="7"
                        >
                          <VSwitch v-model="inverterData.isDcProtectionIntegrated" />
                        </VCol>
                      </VRow>
                    </VCol>
                  </VRow>
                </VCardText>
              </VExpansionPanelText>
            </VExpansionPanel>
            <VExpansionPanel>
              <VExpansionPanelTitle
                class="border border-info"
                color="info"
              >
                <span class="text-h5 text-white">AC</span>
              </VExpansionPanelTitle>
              <VExpansionPanelText class="border border-info">
                <VCardText class="pt-2">
                  <VRow>
                    <VCol cols="12">
                      <VRow
                        no-gutters
                        align="center"
                        justify="center"
                      >
                        <VCol
                          class="d-flex justify-center"
                          cols="12"
                          md="5"
                        >
                          <label for="power">Puissance nominale de sortie (en kVA)</label>
                        </VCol>
                        <VCol
                          cols="12"
                          md="7"
                        >
                          <VTextField
                            id="power"
                            v-model="inverterData.power"
                            type="number"
                            placeholder="Puissance nominale de sortie (en kVA)"
                            persistent-placeholder
                            required
                            suffix="kVA"
                            variant="filled"
                          />
                        </VCol>
                      </VRow>
                    </VCol>
                  </VRow>
                </VCardText>
              </VExpansionPanelText>
            </VExpansionPanel>
          </VExpansionPanels>
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
            <VRow
              justify="center"
              align="center"
            >
              <VCol>
                <VBtn
                  class="me-2"
                  prepend-icon="ic:baseline-new-label"
                  size="small"
                  text="Ajout de prix"
                  @click="dialogNewPrice = true"
                />
                <VBtn
                  v-if="isAddEndDateAvailable"
                  prepend-icon="fa:close"
                  variant="outlined"
                  color="warning"
                  size="small"
                  text="Ajout date fin commercialisation"
                  @click="dialogAddEndDate = true"
                />
              </VCol>
            </VRow>
            <VRow v-if="inverterPrices.length > 0">
              <VCol cols="12">
                <VTable
                  hover
                  class="rounded"
                >
                  <thead>
                    <tr>
                      <th class="text-center">Prix</th>
                      <th class="text-center">Concerne</th>
                      <th class="text-center">Date de début</th>
                      <th class="text-center">Date de fin</th>
                      <th class="text-center">historique</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="price in inverterPrices"
                      :key="price.id"
                      class="text-center"
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
                        {{ getPriceTypeName(price.type) }}
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
                              : `${baseURL}img/logo/no-avatar.jpg
                        `
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
          <span>Ajout de prix pour l'onduleur </span>
          <span class="text-primary font-weight-bold"> {{ inverterData.brand }} - {{ inverterData.model }} </span>
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
                :min="latestDate ? getDateFormat(latestDate, 'dateFormatHTMLElement') : '2020-01-01'"
              />
            </VCol>
            <VCol cols="12">
              <VSelect
                v-model="newPrice.type"
                :items="itemsTypePrice"
                item-title="name"
                item-value="key"
                label="Le prix concerne"
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
                  :title="`La date de début ne peut être inférieure au ${getDateFormat(latestDate[newPrice.type || 'onduleur'], 'dateFormatFRBis')}`"
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
    <VDialog
      v-model="dialogAddEndDate"
      max-width="800"
      min-width="500"
      persistent
    >
      <VCard>
        <DialogCloseBtn @click="dialogAddEndDate = false" />
        <VCardTitle>
          <h6 class="text-h6">Ajouter une date de fin de commercialisation</h6>
          <span class="text-primary text-body-1 font-italic">
            {{ inverterData.brand }} - {{ inverterData.model }}
          </span>
        </VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="endDateForm"
                label="Date de fin de commercialisation"
                type="date"
                :min="latestDate ? getDateFormat(latestDate, 'dateFormatHTMLElement') : '2020-01-01'"
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
                  :title="`La date de début ne peut être inférieure au ${getDateFormat(latestDate['onduleur'], 'dateFormatFRBis')}`"
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
            @click="onAddEndDate"
          />
        </VCardText>
      </VCard>
    </VDialog>
    <VMain>
      <VCard>
        <VCardTitle>
          <h1 class="text-lg-h4 text-body-1 font-weight-bold">Gestion des modèles d'onduleur</h1>
        </VCardTitle>
        <VCardText class="d-flex flex-wrap gap-4">
          <div class="flex-grow-1" />
          <div class="d-flex gap-6 app-user-search-filter align-center">
            <VTextField
              v-model="search"
              density="compact"
              clearable
              placeholder="Rechercher onduleur..."
            />
            <VBtn
              text="Ajouter un onduleur"
              color="info"
              prepend-icon="carbon:new-tab"
              @click.prevent="onAddInverter"
            />
          </div>
        </VCardText>
        <VDataTable
          class="rounded-0 text-body-1 text-center"
          :headers="headers"
          :loading="isLoading"
          :search="search"
          :items="inverterList"
          :sort-by="[
            { key: 'type', order: 'asc' },
            { key: 'electricalPhase', order: 'asc' },
            { key: 'typeInverter', order: 'desc' },
            { key: 'power', order: 'asc' },
          ]"
        >
          <template #item="{ item }">
            <tr
              @click="onSelect(item)"
              class="cursor-pointer"
              :class="{ 'inverter-without-price': item.currentPrice.length <= 0 }"
            >
              <td>{{ item.brand }}</td>
              <td>{{ item.model }}</td>
              <td>{{ item.power }}</td>
              <td>{{ getValueFromJson(itemsType, item.type) }}</td>
              <td>{{ getValueFromJson(itemsElectricalPhase, item.electricalPhase) }}</td>
              <td>{{ getValueFromJson(itemsTypeInverter, item.typeInverter) }}</td>
              <td>
                {{
                  !item.currentPrice ||
                  (Array.isArray(item.currentPrice) && item.currentPrice.length === 0) ||
                  (typeof item.currentPrice === 'object' && Object.keys(item.currentPrice).length === 0)
                    ? '-'
                    : Array.isArray(item.currentPrice)
                      ? `${getNumberFormat(item.currentPrice[0].price, 0, 2)} €`
                      : `${getNumberFormat(Object.values(item.currentPrice)[0].price, 0, 2)} €`
                }}
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

.card-dc {
  border: 1px solid var(--yellow-sunstack);
}

.card-dc__title {
  background-color: var(--yellow-sunstack);
  color: white;
}

.card-ac {
  border: 1px solid rgb(var(--v-theme-info));
}

.card-ac__title {
  background-color: rgb(var(--v-theme-info));
  color: white;
}

.inverter-without-price {
  opacity: 0.45 !important;
}

.header-card {
  position: sticky;
  top: 0;
  backdrop-filter: blur(5px);
  background: rgba(255, 255, 255, 0.2);
  z-index: 9999;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: inherit;
    filter: blur(5px);
    z-index: -1;
  }
}
</style>
