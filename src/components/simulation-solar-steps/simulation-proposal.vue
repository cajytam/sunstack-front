<script setup lang="ts">
import axios from 'axios'
import qs from 'qs'
import VueApexCharts from 'vue3-apexcharts'

import { useSimulationStore } from '@/stores/simulation'
import { patchSimulationData } from '@/services/simulationService'
import { chefLieux } from '@/services/calculation'
import { getNumberFormat } from '@/utils/numberUtils'
import { getInverterSizing } from '@/services/inverterService'

import {
  deleteSignature,
  deleteSignatureSimulation,
  getSignature,
  postSignature,
  postSimulationSignature,
} from '@/services/signatureService'
import {
  deleteChargingPointSimulation,
  getAllChargingPoint,
  postChargingPointToSimulation,
} from '@/services/chargingPointService'

const baseURL = import.meta.env.VITE_API_URI

const simulationStore = useSimulationStore()
const {
  simulationId,
  buildings,
  getTotalPanelsWithBuildings,
  tempCustomerData,
  onPersistData,
  simulationOptionsStored,
  customerEmail,
  simulationUri,
  erasePrices,
  setSignedAt,
} = simulationStore

const { simulationData, signature, getPanelInfo, roofType, electricalPhase, addBatteries, installationLocation } =
  storeToRefs(simulationStore)

const stabilitySurvey = ref({
  mainBuilding: null,
  otherBuildings: 0,
  concrete: 0,
  invisible: 0,
})

const openSendMailDialog = ref(false)
const displayDetails = ref('tableauAmortissement')

const nbTotalPanel = computed(() => {
  return getTotalPanelsWithBuildings()
})

const profile = computed(() => {
  if (simulationData.value.profile) {
    return simulationData.value.profile.split(/\//).pop()
  }
  return null
})

const installations = computed(() => {
  let data = {}
  data['installations'] = []

  buildings.forEach(building => {
    if (building.simulationItems.length > 0) {
      building.simulationItems.forEach(installation => {
        data['installations'].push({
          nbPanel: installation['nbPanel'],
          index: installation['energyPotential'],
        })
      })
    }
  })

  return data
})

const errorPriceCalculationText = ref(null)
const errorPriceCalculationTitle = ref(null)

const installationPriceHT = computedAsync(async () => {
  errorPriceCalculationText.value = null
  errorPriceCalculationTitle.value = null

  try {
    const installationDepartment = simulationData.value.isSameAddresses
      ? tempCustomerData.streetPostcode
      : simulationData.value.installationStreetPostcode

    const id = installationDepartment.slice(0, 2)
    const chefLieu = chefLieux.find(item => item.id === id).chefLieu

    const res = await axios.get(baseURL + 'api/price/simulation', {
      params: {
        panel_nb: getTotalPanelsWithBuildings(),
        panel_id: getPanelInfo.value.id,
        installationType: getTotalPanelsWithBuildings() < 140 ? 'C' : 'I',
        chef_lieu: chefLieu,
        margin_sunstack: 'E',
        roof_type: roofType.value,
        electrical_phase: electricalPhase.value,
        add_batterie: addBatteries.value ? 1 : 0,
        installation_location: installationLocation.value,
        main_survey: stabilitySurvey.value.mainBuilding ? 1 : 0,
        survey_other_building: stabilitySurvey.value.otherBuildings,
        charpente_non_visible: stabilitySurvey.value.invisible,
        charpente_beton: stabilitySurvey.value.concrete,
        simulation_id: simulationId,
        customer_type: tempCustomerData.customerType,
      },
      headers: {
        Accept: 'application/json',
      },
      withCredentials: true,
    })

    if (res.data?.error) {
      errorPriceCalculationText.value = res.data.error
      errorPriceCalculationTitle.value = res.data.title
    }

    if (res.data) {
      simulationData.value.installationPriceHT = res.data.total_price
      simulationData.value.finalPriceHT = res.data.total_price
      onPersistData()
      return res.data.total_price
    }
    return 0
  } catch (err) {
    console.error(err)
    erasePrices()
    simulationData.value.installationPriceHT = 0
    return null
  }
}, null)

const getFinalPrice = asyncComputed(async () => {
  if (installationPriceHT.value > 0) {
    let data = 0
    data += installationPriceHT.value
    return data
  }
  return null
})

watch(getFinalPrice, () => {
  try {
    simulationData.value.finalPriceHT = getFinalPrice.value
    patchSimulationData(simulationId, simulationData.value)
  } catch (err) {
    console.error(err)
  }
})

const vatRate = computed(() => {
  if (
    nbTotalPanel.value > 0 &&
    (getPanelInfo.value.power * nbTotalPanel.value) / 1000 <= 3 &&
    parseInt(profile.value) !== 3
  ) {
    return 10
  }
  return 20
})

const paramsRequest = computed(() => {
  return {
    profile: profile.value,
    energy_price: simulationData.value.consumptionPrice,
    energy_consumption: simulationData.value.consumptionQuantity,
    vat: tempCustomerData.canDeductVAT ? 0 : vatRate.value,
    reduced_yield: simulationData.value.reducedYield,
    reduced_yield_first_year: simulationData.value.reducedYieldFirstYear,
    price_escalation: simulationData.value.priceEscalation,
    sales_price_escalation: simulationData.value.salesPriceEscalation,
    panel: getPanelInfo.value?.id ? getPanelInfo.value.id : null,
    installation_location: simulationData.value.installationLocation || installationLocation.value,
    installation_price: simulationData.value.manualPrice ? simulationData.value.manualPrice : getFinalPrice.value,
    simulation_id: simulationId,
  }
})

const simulationTableData = computedAsync(async () => {
  if (nbTotalPanel.value === 0 && typeof getPanelInfo.value === 'undefined') {
    return {}
  }

  try {
    const res = await axios.get(baseURL + 'api/calculation', {
      params: paramsRequest.value,
      paramsSerializer: params => {
        return qs.stringify({ ...params, ...installations.value })
      },
      headers: {
        Accept: 'application/json',
      },
    })
    return res.data
  } catch (err) {
    console.error(err)
    return {}
  }
}, {})

const chartOptions = {
  chart: {
    id: 'evolutionPrices',
  },
  xaxis: {
    categories: new Array(25).fill(new Date().getFullYear()).map((val, i) => parseInt(val) + i),
  },
}

const series = computed(() => {
  const currentInvoices = []
  const newInvoices = []
  const profit = []

  if (Object.keys(simulationTableData.value).length > 0) {
    simulationTableData.value.forEach(dataYear => {
      currentInvoices.push(dataYear.invoice)
      newInvoices.push(dataYear.new_invoice)
      profit.push(dataYear.profit)
    })
  }

  return [
    {
      name: 'Factures indexées',
      data: currentInvoices,
      type: 'line',
    },
    {
      name: 'Factures avec panneaux',
      data: newInvoices,
      type: 'line',
    },
    {
      name: 'Profits annuels',
      data: profit,
      type: 'bar',
    },
  ]
})

const getURLPDF = computed(() => `${baseURL}api/pdf/generate/${simulationData.value.identifier}`)

const getURLPDFWithMandat = computed(() => `${baseURL}api/pdf/generate/${simulationData.value.identifier}/withMandat`)

const currentUserFullname = computed(() => window.localStorage.getItem('fullname') || '')

const nbBatteryRequired = computedAsync(async () => {
  let nbBatteries = 0
  const installationDepartment = simulationData.value.isSameAddresses
    ? tempCustomerData.streetPostcode
    : simulationData.value.installationStreetPostcode
  const chefLieu = chefLieux[installationDepartment.slice(0, 2)].chefLieu

  const promises = simulationOptionsStored.map(async option => {
    if (option.addBattery === 'O') {
      const building = buildings.find(building => option.building === building.id)
      if (building) {
        const itemPromises = building.simulationItems.map(async item => {
          const data = await getInverterSizing(item.nbPanel, getPanelInfo.value.id, chefLieu, 1, option.phaseType, true)
          return data.data?.inverters ? data.data.inverters.nb : 0
        })

        const itemResults = await Promise.all(itemPromises)
        return itemResults.reduce((sum, nb) => sum + nb, 0)
      }
    }
    return 0
  })

  const results = await Promise.all(promises)
  nbBatteries = results.reduce((sum, nb) => sum + nb, 0)
  return nbBatteries * 3
})
const batteriesCapacity = ['5kW', '8kW']

const nbChargingPointRequired = computedAsync(async () => {
  let nbBatteries = 0
  const installationDepartment = simulationData.value.isSameAddresses
    ? tempCustomerData.streetPostcode
    : simulationData.value.installationStreetPostcode
  const chefLieu = chefLieux[installationDepartment.slice(0, 2)].chefLieu

  const promises = simulationOptionsStored.map(async option => {
    if (option.addBattery === 'O') {
      const building = buildings.find(building => option.building === building.id)
      if (building) {
        const itemPromises = building.simulationItems.map(async item => {
          const data = await getInverterSizing(item.nbPanel, getPanelInfo.value.id, chefLieu, 1, option.phaseType, true)
          return data.data?.inverters ? data.data.inverters.nb : 0
        })

        const itemResults = await Promise.all(itemPromises)
        return itemResults.reduce((sum, nb) => sum + nb, 0)
      }
    }
    return 0
  })

  const results = await Promise.all(promises)
  nbBatteries = results.reduce((sum, nb) => sum + nb, 0)
  return nbBatteries
})

const isChargingPointRequired = computed(() => {
  return simulationOptionsStored.some(option => option.addChargingPoint === 'O')
})

watch(stabilitySurvey.value, () => {
  simulationData.value.surveyMainBuilding = stabilitySurvey.value.mainBuilding
  simulationData.value.nbSurveyOtherBuildings = stabilitySurvey.value.otherBuildings
  simulationData.value.nbCharpentesBeton = stabilitySurvey.value.concrete
  simulationData.value.nbCharpentesNonVisibles = stabilitySurvey.value.invisible
})

/**
 * DEBUT envoi mail
 */
const emailButton = reactive({
  text: null,
  icon: null,
  isSending: false,
  color: null,
})

const changeEmailButton = (text: String, icon: String, isSending: Boolean, color: String) => {
  emailButton.text = text
  emailButton.icon = icon
  emailButton.isSending = isSending
  emailButton.color = color
}

const mailSubject = ref('Votre proposition de panneaux photovoltaïques personnalisée')
const mailContent = ref(`Madame, monsieur,

Nous avons le plaisir de vous faire suivre notre meilleure offre pour votre installation photovoltaïque.

Nous avons étudié votre projet avec soin et nous sommes convaincus que SunStack répond à vos besoins.

Nos équipes commerciales et techniques restent à votre entière disposition pour tout complément d’information.

Vous en souhaitant bonne réception.
Cordialement,

${currentUserFullname.value}
`)

const onOpenSendEmailDialog = () => {
  openSendMailDialog.value = true

  changeEmailButton('Envoyer', 'material-symbols:send', false, 'primary')
}

const mailCustomer = ref(customerEmail)

const generatePDFURL = computed(() => {
  return baseURL + 'api/pdf/generate/' + simulationData.value.identifier + '/onlyGenerate'
})

const onSendMail = () => {
  changeEmailButton('Envoi du mail', 'mdi-email-resend-outline', true, 'secondary')

  axios
    .get(generatePDFURL.value, {
      withCredentials: true,
    })
    .then(res => {
      const data = {
        subject: mailSubject.value,
        body: mailContent.value,
        to_address: mailCustomer.value,
        fileURL: res.data.file,
        typePanneau: getPanelInfo.value.power,
      }

      axios
        .post(baseURL + 'api/email/simulation/' + simulationData.value.identifier, data, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })
        .then(() => {
          changeEmailButton('Email envoyé', 'tabler:mail-up', false, 'success')
          setTimeout(() => {
            openSendMailDialog.value = false
          }, 3000)
        })
        .catch(err => {
          console.error(err)
          changeEmailButton('Erreur', 'fluent:mail-error-16-filled', false, 'error')
        })
    })
}
/**
 * FIN envoi mail
 */

/**
 * DEBUT GESTION SIGNATURE DEVIS
 */
const openSignaturePanel = ref(false)
const isSavingSignature = ref(false)

const onSubmitSignature = event => {
  if (event) {
    isSavingSignature.value = true
    signature.value.content = event

    if (signature.value.typeSignature && '' === signature.value.typeSignature.trim()) {
      signature.value.typeSignature = null
    }

    getSignature(simulationUri, 'devis')
      .then(res => {
        if (res.data['hydra:totalItems'] > 0) {
          const signatureSimulationId = res.data['hydra:member'][0].id
          const signatureId = res.data['hydra:member'][0].signature.id
          deleteSignatureSimulation(signatureSimulationId).then(() => {
            deleteSignature(signatureId)
              .then(() => {
                savingSignature(JSON.parse(JSON.stringify(signature.value)))
              })
              .catch(err => console.error(err))
          })
        } else {
          savingSignature(JSON.parse(JSON.stringify(signature.value)))
        }
      })
      .catch(err => console.error(err))
  }
}

const savingSignature = signature => {
  postSignature(simulationUri, signature)
    .then(res => {
      const signatureUri = res.data['@id']
      postSimulationSignature(simulationUri, signatureUri, 'devis')
        .then(() => {
          simulationData.value.finalPriceHT = getFinalPrice
          simulationData.value.step = 1
          onPersistData()
          signatureAlert.text = 'La signature a bien été prise en compte'
          signatureAlert.color = 'success'
          signatureAlert.icon = 'icon-park-outline:success'
          setSignedAt()
        })
        .catch(err => console.error(err))
    })
    .catch(err => {
      signatureAlert.text = 'Erreur lors de la prise en compte de la signature'
      signatureAlert.color = 'error'
      signatureAlert.icon = 'material-symbols:error-outline'
      console.error(err)
    })
    .finally(() => {
      isSavingSignature.value = false
      signatureAlert.visible = true
      setTimeout(() => {
        signatureAlert.visible = false
      }, 5000)
    })
}

const signatureAlert = reactive({
  text: null,
  color: null,
  icon: null,
  visible: false,
})
/**
 * FIN GESTION SIGNATURE DEVIS
 */

const isLoadingChargingPoint = ref(false)
const isSavingChargingPointSimulation = ref(false)
const chargingPointItems = ref([])
const chargingPointSelected = ref({
  modelId: null,
  quantity: null,
})

const chargingPointSimulation = ref([])

const onAddChargingPointConfiguration = () => {
  if (
    !chargingPointSelected.value.modelId ||
    !chargingPointSelected.value.quantity ||
    chargingPointSelected.value.quantity <= 0
  )
    return

  isSavingChargingPointSimulation.value = true
  postChargingPointToSimulation(
    simulationUri,
    chargingPointSelected.value.modelId,
    chargingPointSelected.value.quantity,
  )
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log('post:chargingPointSimulation', res)
      if (res.data.id) {
        chargingPointSimulation.value.push({
          modelId: chargingPointSelected.value.modelId,
          quantity: chargingPointSelected.value.quantity,
          id: res.data.id,
        })
        chargingPointSelected.value.quantity = null
        chargingPointSelected.value.modelId = null
      }
    })
    .catch(err => console.error(err))
    .finally(() => (isSavingChargingPointSimulation.value = false))
}

const onDeleteChargingPointSimulation = idChargingPointSimulation => {
  deleteChargingPointSimulation(idChargingPointSimulation)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log('delete:chargingPointSimulation', res)
      chargingPointSimulation.value = chargingPointSimulation.value.filter(
        item => item.id !== idChargingPointSimulation,
      )
    })
    .catch(err => console.error(err))
}

onMounted(() => {
  stabilitySurvey.value.mainBuilding = simulationData.value.surveyMainBuilding
  stabilitySurvey.value.otherBuildings =
    simulationData.value.nbSurveyOtherBuildings === null ? 0 : simulationData.value.nbSurveyOtherBuildings
  stabilitySurvey.value.concrete =
    simulationData.value.nbCharpentesBeton === null ? 0 : simulationData.value.nbCharpentesBeton
  stabilitySurvey.value.invisible =
    simulationData.value.nbCharpentesNonVisibles === null ? 0 : simulationData.value.nbCharpentesNonVisibles

  changeEmailButton('Envoyer', 'material-symbols:send', false, 'primary')
  if (signature.value.lastnameSignataire === null && tempCustomerData.lastname) {
    signature.value.lastnameSignataire = tempCustomerData.lastname
  }
  if (signature.value.firstnameSignataire === null && tempCustomerData.firstname) {
    signature.value.firstnameSignataire = tempCustomerData.firstname
  }

  isLoadingChargingPoint.value = true

  getAllChargingPoint()
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log('charingpoint', res)
      res.data.forEach(chargingPoint => {
        chargingPointItems.value.push({
          id: chargingPoint.id,
          model: chargingPoint.model,
        })
      })
    })
    .catch(err => console.error(err))
    .finally(() => (isLoadingChargingPoint.value = false))

  if (simulationData.value.surveyMainBuilding === null && nbTotalPanel.value > 100) {
    simulationData.value.surveyMainBuilding = true
    stabilitySurvey.value.mainBuilding = true
  }
})
const getSentenceChargingPoint = item => {
  const modelName = chargingPointItems.value.filter(chargingPoint => chargingPoint.id === item.modelId)[0].model
  return `${item.quantity} borne${item.quantity > 1 ? 's' : ''} de ${modelName}`
}

onActivated(() => {
  stabilitySurvey.value.mainBuilding = !stabilitySurvey.value.mainBuilding
  stabilitySurvey.value.mainBuilding = !stabilitySurvey.value.mainBuilding
})
</script>

<template>
  <VContainer
    v-if="errorPriceCalculationText"
    fluid
    class="mt-5"
  >
    <VRow
      align="center"
      justify="center"
    >
      <VCol cols="9">
        <VAlert
          variant="tonal"
          color="error"
          prominent
          icon="mdi:file-document-error"
        >
          <VAlertTitle>
            <span class="font-weight-bold text-h6 text-error">{{ errorPriceCalculationTitle }}</span>
          </VAlertTitle>
          <h6 class="text-body-1 text-error">{{ errorPriceCalculationText }}</h6>
        </VAlert>
      </VCol>
    </VRow>
  </VContainer>
  <VContainer
    v-else
    fluid
    class="mt-5"
  >
    <VRow
      align="center"
      justify="center"
    >
      <VCol cols="12">
        <VRow
          align="center"
          justify="center"
          class="mb-12"
        >
          <VIcon
            icon="line-md:thumbs-up-twotone"
            color="primary"
            size="54"
            class="me-2"
          />
          <span class="text-h4 font-weight-bold"> Votre proposition est presque prête </span>
        </VRow>
      </VCol>
    </VRow>
    <VRow
      v-if="(nbBatteryRequired > 0 || isChargingPointRequired) && false"
      align="stretch"
      justify="center"
      class="mb-12"
    >
      <VCol
        cols="4"
        v-if="nbBatteryRequired > 0"
      >
        <VCard
          border
          class="border-primary fill-height"
        >
          <div class="text-center text-primary font-weight-bold text-h5 py-1 border-b border-primary">
            <VIcon
              size="48"
              class="me-2"
              icon="ph:car-battery-fill"
            />
            Batterie
          </div>
          <VCardText>
            <VRow
              align="center"
              justify="center"
            >
              <VCol cols="4"> Capacité</VCol>
              <VCol cols="8">
                <VSelect :items="batteriesCapacity" />
              </VCol>
            </VRow>
            <VRow
              align="center"
              justify="center"
            >
              <VCol cols="4">
                <span>Quantité</span>
                <br />
                <span class="font-italic">(max. {{ nbBatteryRequired }})</span>
              </VCol>
              <VCol cols="8">
                <VNumberInput
                  :min="0"
                  :max="nbBatteryRequired"
                  class="field-nbRoof__input"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="4"
        v-if="isChargingPointRequired"
      >
        <VCard
          border
          class="fill-height border-primary"
        >
          <div class="text-center text-primary font-weight-bold text-h5 py-1 border-b border-primary">
            <VIcon
              size="48"
              class="me-2"
              icon="fa6-solid:charging-station"
            />
            Borne de rechargement
          </div>
          <VCardText>
            <VRow
              align="center"
              justify="center"
            >
              <VCol cols="4"> Puissance</VCol>
              <VCol cols="8">
                <VSelect
                  v-model="chargingPointSelected.modelId"
                  :loading="isLoadingChargingPoint"
                  :items="chargingPointItems"
                  item-value="id"
                  item-title="model"
                />
              </VCol>
            </VRow>
            <VRow
              align="center"
              justify="center"
            >
              <VCol
                cols="4"
                class="mb-4"
              >
                Quantité
              </VCol>
              <VCol cols="8">
                <VNumberInput
                  v-model="chargingPointSelected.quantity"
                  :min="0"
                  class="field-nbRoof__input"
                />
              </VCol>
            </VRow>
            <VRow
              align="center"
              justify="center"
            >
              <VBtn
                @click="onAddChargingPointConfiguration"
                :loading="isSavingChargingPointSimulation"
                :disabled="isSavingChargingPointSimulation"
                size="small"
                color="info"
                prepend-icon="ic:baseline-plus"
                text="ajouter"
              />
            </VRow>
            <VFadeTransition mode="out-in">
              <div
                v-if="chargingPointSimulation.length > 0"
                class="text-center mt-12"
              >
                <h5 class="text-h6 mb-3 text-decoration-underline">Votre sélection</h5>
                <div
                  v-for="item in chargingPointSimulation"
                  class="d-flex align-center border border-primary pa-3 mx-12 rounded-pill text-primary font-weight-bold my-2 elevation-3"
                >
                  <span class="flex-grow-1 text-center">
                    {{ getSentenceChargingPoint(item) }}
                  </span>
                  <VIcon
                    @click="onDeleteChargingPointSimulation(item.id)"
                    icon="iconamoon:close-bold"
                    color="primary"
                  />
                </div>
              </div>
              <div
                v-else
                class="mt-12 text-center"
              >
                <span class="text-caption">Aucune borne sélectionnée</span>
              </div>
            </VFadeTransition>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
    <VRow
      align="center"
      justify="center"
    >
      <VCol
        cols="7"
        lg="5"
      >
        <VCard
          elevation="12"
          border
        >
          <div class="bg-primary pa-2 text-center">
            <h3 class="text-h5 text-white">Étude de stabilité</h3>
          </div>
          <VCardText>
            <div
              class="mb-7 py-5 rounded d-flex justify-center bg-var-theme-background border"
              :class="stabilitySurvey.mainBuilding ? 'border-primary' : 'border-opacity-0'"
            >
              <VCheckbox
                v-model="stabilitySurvey.mainBuilding"
                class="my-checkbox"
                label="Étude principale"
              />
            </div>
            <VRow align="center">
              <VCol cols="3">
                <VIcon
                  icon="wpf:survey"
                  color="primary"
                  size="96"
                />
              </VCol>
              <VCol cols="9">
                <VRow
                  class="mt-0"
                  justify="center"
                >
                  <VCol
                    cols="6"
                    class="text-center"
                  >
                    <h6 class="text-body-1 font-weight-bold mt-4">
                      {{
                        `Autre${stabilitySurvey.otherBuildings > 1 ? 's' : ''} bâtiment${stabilitySurvey.otherBuildings > 1 ? 's' : ''}`
                      }}
                    </h6>
                  </VCol>
                  <VCol cols="6">
                    <VNumberInput
                      v-model="stabilitySurvey.otherBuildings"
                      class="field-nbRoof__input"
                      :min="0"
                    />
                  </VCol>
                </VRow>
                <VRow
                  class="mt-0"
                  justify="center"
                >
                  <VCol
                    cols="6"
                    class="text-center"
                  >
                    <h6 class="text-body-1 font-weight-bold mt-4">Béton</h6>
                  </VCol>
                  <VCol cols="6">
                    <VNumberInput
                      v-model="stabilitySurvey.concrete"
                      class="field-nbRoof__input"
                      :min="0"
                    />
                  </VCol>
                </VRow>
                <VRow
                  class="mt-0"
                  justify="center"
                >
                  <VCol
                    cols="6"
                    class="text-center"
                  >
                    <h6 class="text-body-1 font-weight-bold mt-4">
                      {{ `Non visible${stabilitySurvey.invisible > 1 ? 's' : ''}` }}
                    </h6>
                  </VCol>
                  <VCol cols="6">
                    <VNumberInput
                      v-model="stabilitySurvey.invisible"
                      class="field-nbRoof__input"
                      :min="0"
                    />
                  </VCol>
                </VRow>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
    <VRow
      justify="center"
      align="center"
      class="mb-12 mt-15"
    >
      <VCol cols="12">
        <VContainer>
          <h2 class="text-h4 font-weight-bold text-center">
            <VIcon
              icon="iconamoon:invoice"
              class="me-1"
              color="primary"
              size="x-large"
            />
            Votre tarif
          </h2>
          <VRow
            align="center"
            justify="center"
          >
            <VCol
              cols="10"
              lg="6"
            >
              <VCard
                border="primary"
                variant="outlined"
                class="mt-5"
                elevation="12"
              >
                <VCardItem class="pb-5">
                  <div class="d-flex align-center justify-space-between">
                    <div>
                      <span class="text-h5 font-weight-bold text-primary">
                        {{ nbTotalPanel }}
                      </span>
                      <span class="text-h6"> panneaux de </span>
                      <span class="text-primary text-h5"> {{ getPanelInfo.power }} Wc </span>
                    </div>
                    <VChip
                      text="inclus"
                      color="info"
                    />
                  </div>
                </VCardItem>
                <VSlideXTransition>
                  <VCardItem
                    v-if="stabilitySurvey.mainBuilding"
                    class="pt-0 pb-5"
                  >
                    <div class="d-flex align-center justify-space-between">
                      <div>
                        <span class="text-h6"> Étude de stabilité </span>
                      </div>
                      <VChip
                        text="inclus"
                        color="info"
                      />
                    </div>
                  </VCardItem>
                </VSlideXTransition>
                <VDivider class="mx-7" />
                <VCardItem>
                  <div class="d-flex align-center justify-space-between">
                    <span> Montant HT </span>
                    <h3 class="text-h6 font-weight-bold">
                      {{ getNumberFormat(simulationData.manualPrice ? simulationData.manualPrice : getFinalPrice) }} €
                    </h3>
                  </div>
                  <div class="d-flex align-center justify-space-between my-2">
                    <span> TVA </span>
                    <h3 class="text-body-1 font-weight-bold">
                      {{ `${vatRate}%` }}
                    </h3>
                  </div>
                  <div class="d-flex align-center justify-space-between">
                    <span class="text-h5"> Montant TTC </span>
                    <h3 class="text-h4 font-weight-bold text-primary">
                      {{
                        getNumberFormat(
                          (simulationData.manualPrice ? simulationData.manualPrice : getFinalPrice) *
                            (1 + vatRate / 100),
                        )
                      }}
                      €
                    </h3>
                  </div>
                </VCardItem>
              </VCard>
            </VCol>
          </VRow>
          <VRow
            v-if="vatRate === 10"
            justify="center"
            class="mt-8"
          >
            <VCol
              cols="12"
              lg="7"
            >
              <VAlert
                class="text-center"
                text="Pour bénéficier du taux de TVA de 10%, il faut que l’installation se fasse sur un logement achevé depuis plus de 2 ans"
                variant="tonal"
                color="success"
                icon="mdi-think-outline"
                prominent
              />
            </VCol>
          </VRow>
        </VContainer>
      </VCol>
    </VRow>
    <VRow
      align="center"
      justify="center"
    >
      <VCol cols="6">
        <VBtnToggle
          v-model="displayDetails"
          mandatory
          color="info"
          class="d-flex flex-row"
          variant="elevated"
          border
        >
          <VBtn
            text="Tableau d'amortissement"
            class="flex-0-1-100"
            value="tableauAmortissement"
          />
          <VBtn
            text="Graphique"
            class="flex-0-1-100"
            value="graphique"
          />
        </VBtnToggle>
      </VCol>
    </VRow>
    <VScrollYTransition
      mode="out-in"
      hide-on-leave
    >
      <VRow
        class="mt-8"
        v-if="displayDetails === 'tableauAmortissement'"
      >
        <VCol cols="12">
          <VCard>
            <VTable
              class="bg-var-theme-background"
              hover
            >
              <thead>
                <tr class="table-headers__main">
                  <th class="border-e"></th>
                  <th
                    class="text-center border-e"
                    colspan="3"
                  >
                    Production (en kWh)
                  </th>
                  <th
                    class="text-center border-e"
                    colspan="2"
                  >
                    Situation actuelle
                  </th>
                  <th
                    class="text-center border-e"
                    colspan="2"
                  >
                    Situation avec panneaux
                  </th>
                  <th class="text-center border-e"></th>
                  <th
                    class="text-center"
                    colspan="3"
                  >
                    Avantages
                  </th>
                </tr>
                <tr class="table-headers__second">
                  <th class="border-e">Année</th>
                  <th class="text-center border-e">Production</th>
                  <th class="text-center border-e">Autoconso.</th>
                  <th class="text-center border-e">Injection</th>
                  <th class="text-center border-e">Prix kWh indexé</th>
                  <th class="text-center border-e">Fact. sans panneaux</th>
                  <th class="text-center border-e">Revente EDF OA</th>
                  <th class="text-center border-e">Fact. avec panneaux</th>
                  <th class="text-center border-e">Invest.</th>
                  <th class="text-center border-e">Primes</th>
                  <th class="text-center border-e">Bénéfices</th>
                  <th class="text-center">Cumul avantage</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  class="text-center"
                  :class="[
                    item.pivot < 0 ? 'text-before-pivot' : 'text-after-pivot',
                    { 'tr-background__pivot': 0 === item.pivot },
                  ]"
                  v-for="(item, index) in simulationTableData"
                  :key="item.name"
                >
                  <td class="border-e">
                    {{ 1 + index }}
                  </td>
                  <td class="border-e">
                    {{ getNumberFormat(item.production) }}
                  </td>
                  <td class="border-e">
                    {{ getNumberFormat(item.consumption) }}
                  </td>
                  <td class="border-e">
                    {{ item.injection !== 0 ? getNumberFormat(item.injection) : '-' }}
                  </td>
                  <td class="border-e">
                    {{ getNumberFormat(item.indexed_kwh_cost, 4, 4) }}
                  </td>
                  <td class="border-e">{{ getNumberFormat(item.invoice) }} €</td>
                  <td class="border-e">
                    {{ item.sale !== 0 ? getNumberFormat(item.sale) + ' €' : '- ' }}
                  </td>
                  <td class="border-e">
                    {{ item.new_invoice !== 0 ? getNumberFormat(item.new_invoice) + ' €' : '-' }}
                  </td>
                  <td class="border-e">
                    {{ item.investment !== 0 ? getNumberFormat(item.investment) + ' €' : '-' }}
                  </td>
                  <td class="border-e">
                    {{ item.prime !== 0 ? getNumberFormat(item.prime) + ' €' : '-' }}
                  </td>
                  <td class="border-e">{{ getNumberFormat(item.profit) }} €</td>
                  <td>{{ getNumberFormat(item.diff) }} €</td>
                </tr>
              </tbody>
            </VTable>
          </VCard>
        </VCol>
      </VRow>
    </VScrollYTransition>
    <VScrollYTransition mode="out-in">
      <VRow
        v-if="displayDetails === 'graphique'"
        align="center"
        justify="center"
      >
        <VCol cols="12">
          <VueApexCharts
            :options="chartOptions"
            :series="series"
          />
        </VCol>
      </VRow>
    </VScrollYTransition>
    <VRow
      class="mt-12"
      justify="center"
      align="center"
    >
      <VCol
        cols="12"
        lg="9"
        class="pa-0 my-1"
      >
        <VCardActions>
          <VRow
            align="center"
            justify="center"
          >
            <VCol cols="5">
              <VBtn
                text="Signer le devis"
                color="green-sunstack-darker"
                variant="elevated"
                block
                size="large"
                prepend-icon="fa6-solid:file-signature"
                @click.prevent="openSignaturePanel = !openSignaturePanel"
              />
            </VCol>
          </VRow>
        </VCardActions>
        <VExpandTransition>
          <VRow
            justify="center"
            class="my-7"
            v-if="openSignaturePanel"
          >
            <VCol
              cols="12"
              class="text-center"
            >
              <VCard
                class="bg-var-theme-background"
                elevation="14"
              >
                <VCardItem>
                  <SignatureManuscrite
                    @signatureBase64="onSubmitSignature"
                    :is-saving="isSavingSignature"
                    v-model:firstname="signature.firstnameSignataire"
                    @firstname="e => (signature.firstnameSignataire = e)"
                    v-model:lastname="signature.lastnameSignataire"
                    @lastname="e => (signature.lastnameSignataire = e)"
                    v-model:type-signature="signature.typeSignature"
                    @type-signature="e => (signature.typeSignature = e)"
                    v-model:is-clause-suspensive="signature.isClauseSuspensive"
                    @is-clause-suspensive="e => (signature.isClauseSuspensive = e)"
                    :is-customer-particular="tempCustomerData.customerType === 1"
                    v-model:birthday-customer="signature.birthday"
                    @birthday-customer="e => (signature.birthday = e)"
                    v-model:birth-location-customer="signature.birthPlace"
                    @birth-location-customer="e => (signature.birthPlace = e)"
                    :is-customer-certifies-ownership="buildings[0].isCustomerCertifiesOwnership"
                    :is-agreement-bare-owner="buildings[0].isAgreementBareOwner"
                  />
                  <VSlideXTransition>
                    <VCardText v-if="signatureAlert.visible">
                      <VRow justify="center">
                        <VCol cols="6">
                          <VAlert
                            :text="signatureAlert.text"
                            :color="signatureAlert.color"
                            variant="tonal"
                            border="start"
                            :icon="signatureAlert.icon"
                            prominent
                          />
                        </VCol>
                      </VRow>
                    </VCardText>
                  </VSlideXTransition>
                </VCardItem>
              </VCard>
            </VCol>
          </VRow>
        </VExpandTransition>
      </VCol>
      <VCol
        cols="12"
        lg="9"
        class="pa-0 my-1"
      >
        <VCardActions>
          <VRow justify="center">
            <VCol cols="5">
              <VBtn
                prepend-icon="tabler:eye"
                text="Afficher le devis"
                block
                variant="elevated"
                color="info"
                size="large"
                :href="getURLPDF"
                target="_blank"
                rel="noopener noreferrer"
              />
            </VCol>
            <VCol cols="5">
              <VBtn
                prepend-icon="material-symbols:send-outline"
                text="Recevoir par mail"
                block
                variant="elevated"
                color="grey-500"
                size="large"
                @click.prevent="onOpenSendEmailDialog"
              />
            </VCol>
          </VRow>
        </VCardActions>
      </VCol>
      <VCol
        cols="12"
        lg="9"
        class="pa-0 my-1"
      >
        <VCardActions>
          <VRow justify="center">
            <VCol cols="5">
              <VBtn
                prepend-icon="ic:twotone-print"
                text="Afficher pour impression"
                block
                variant="elevated"
                color="purple"
                size="large"
                :href="getURLPDFWithMandat"
                target="_blank"
                rel="noopener noreferrer"
              />
            </VCol>
          </VRow>
        </VCardActions>
      </VCol>
    </VRow>
    <VDialog
      v-model="openSendMailDialog"
      width="1024"
    >
      <VCard>
        <VCardTitle>
          <span class="text-h5"> Envoyer la proposition par mail </span>
        </VCardTitle>
        <VCardText>
          <VContainer>
            <VRow>
              <VCol cols="12">
                <VTextField
                  label="Adresse mail du destinataire"
                  required
                  v-model="mailCustomer"
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol cols="12">
                <VTextField
                  label="Sujet"
                  required
                  v-model="mailSubject"
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol cols="12">
                <VTextarea
                  label="Contenu du mail"
                  rows="10"
                  required
                  v-model="mailContent"
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol
                cols="12"
                class="mb-6"
              >
                <div class="d-flex gap-x-2">
                  <VChip
                    text="votre Simulation"
                    prepend-icon="ic:sharp-attachment"
                    variant="outlined"
                    color="primary"
                  />
                  <VChip
                    v-if="signature.content"
                    text="Nos CGV"
                    prepend-icon="ic:sharp-attachment"
                    variant="outlined"
                    color="primary"
                  />
                </div>
              </VCol>
            </VRow>
          </VContainer>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="secondary"
            variant="text"
            @click="openSendMailDialog = false"
            text="Fermer"
          />
          <VBtn
            :color="emailButton.color"
            variant="elevated"
            :prepend-icon="emailButton.icon"
            @click="onSendMail"
            :text="emailButton.text"
            :loading="emailButton.isSending"
          />
        </VCardActions>
      </VCard>
    </VDialog>
  </VContainer>
</template>

<style scoped lang="scss">
:deep(.my-checkbox .v-label) {
  font-size: 1.4rem !important;
  font-weight: 700;
  color: rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity)) !important;
}

:deep(.field-nbRoof__input .v-field input) {
  color: rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity)) !important;
  text-align: center !important;
  font-size: 1.4rem !important;
}

.v-tooltip :deep(.v-overlay__content) {
  background-color: rgb(var(--v-theme-primary)) !important;
  font-size: 1.2rem !important;
}

table thead tr.table-headers__main th {
  font-weight: 700 !important;
  font-size: 1rem !important;
  color: rgb(var(--v-theme-primary)) !important;
}

table thead tr.table-headers__second th {
  font-weight: 700 !important;
  font-size: 0.7rem !important;
}

.card-options__active {
  border-color: rgb(var(--v-theme-primary)) !important;
}

.tr-background__pivot {
  background-color: rgb(var(--v-theme-primary)) !important;
  color: white !important;
}

tbody tr:nth-of-type(odd) {
  background-color: rgba(var(--v-theme-on-surface), 0.05);
}

.text-before-pivot {
  font-size: 0.875rem !important;
  line-height: 1.3125rem;
  letter-spacing: 0.0094rem !important;
  font-family: Arial, sans-serif !important;
  text-transform: none !important;
  color: rgba(var(--v-theme-on-background), 0.6);
}

.text-after-pivot {
  font-size: 0.925rem !important;
  line-height: 1.5rem;
  letter-spacing: 0.0094rem !important;
  font-family: Arial, sans-serif !important;
  text-transform: none !important;
  color: rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity));
}

:deep(.field-toiture__input .v-field input) {
  padding-top: 0 !important;
  text-align: center !important;
  color: rgba(var(--v-theme-on-background)) !important;
  font-size: 1.6rem !important;
  font-weight: 700;
}
</style>
