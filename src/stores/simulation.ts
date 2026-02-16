import { generateIdentifier, patchSimulationData, postSimulationData } from '@/services/simulationService'
import { useUserStore } from '@/stores/user'
import { patchTempCustomerData, postTempCustomerData } from '@/services/customerService'
import { getActivePanelByInstallationLocation } from '@/services/panelService'
import { deletePDL, postPDLData } from '@/services/pdlService'
import { postSimulationHistory } from '@/services/historyService'
import { fetchPatchById, getById } from '@/services/api'
import type { BuildingData, InstallationType, PDLType } from '@domain/types/simulation'
import { getCurrentDateForDatabase } from '@/utils/dateUtils'
import { postStatusSimulation } from '@/services/statusSimulationService'

export const useSimulationStore = defineStore('simulationStep', () => {
  const stepNumber = ref(0)
  const stepsCompleted = ref([])
  const creationDate = ref(null)

  const simulationData = reactive({
    ownedBy: null,
    identifier: null,
    number: null,
    consumptionQuantity: null,
    consumptionPrice: null,
    reducedYield: null,
    reducedYieldFirstYear: null,
    priceEscalation: 6,
    salesPriceEscalation: 1.5,
    installationLocation: null,
    profile: null,
    installationPriceHT: null,
    finalPriceHT: null,
    manualPrice: null,
    tempCustomer: null,
    customer: null,
    panel: null,
    status: null,
    step: null,
    isArdoiseClouee: null,
    nbToitures: null,
    nbCharpentesNonVisibles: null,
    nbCharpentesBeton: null,
    estSigne: false,
    isForcePanelType: false,
    installationStreetNumber: null,
    installationStreetName: null,
    installationStreetPostcode: null,
    installationStreetCity: null,
    isSameAddresses: true,
    surveyMainBuilding: null,
    nbSurveyOtherBuildings: null,
    signedAtDate: null,
    consumptionQuantityDetailed: null,
    consumptionPriceDetailed: null,
    seasonalPrices: null,
  })

  const tempCustomerData = reactive({
    firstname: null,
    lastname: null,
    email: null,
    phoneNumber: null,
    companyType: null,
    companyName: null,
    companyDenomination: null,
    siret: null,
    streetNumber: null,
    streetName: null,
    streetPostBox: null,
    streetPostcode: null,
    streetCity: null,
    longitude: null,
    latitude: null,
    customerType: null,
    canDeductVAT: null,
    position: null,
    civility: null,
  })

  const simulationUri = ref(null)

  const simulationId = ref(null)

  const pdls: PDLType[] = ref([])
  const buildings: BuildingData[] = ref([])
  const simulationOptionsStored = ref([])

  const simulationPDLs = ref([])

  const customerEmail = computed(() => {
    if (tempCustomerData.email) return tempCustomerData.email

    return ''
  })

  const roofType = ref(null)
  const electricalPhase = ref(null)
  const addBatteries = ref(false)
  const installationLocation = ref(null)

  const signature = reactive({
    content: null,
    firstnameSignataire: null,
    lastnameSignataire: null,
    typeSignature: null,
    isClauseSuspensive: false,
    birthday: null,
    birthPlace: null,
  })

  const customerOwnership = reactive({
    isCustomerCertifiesOwnership: null,
    isAgreementBareOwner: null,
  })

  watch(simulationPDLs.value, () => {
    const dataPdl = {
      pdl: { ...simulationPDLs.value },
    }

    try {
      patchSimulationData(simulationId.value, dataPdl)
    } catch (error) {
      console.error(err)
    }
  })

  function getTotalPanels(): number {
    let total = 0
    pdls.value.forEach(pdl => {
      if (pdl.installations) {
        pdl.installations.forEach(installation => {
          total += parseInt(installation.nbPanel, 10)
        })
      }
    })

    return total
  }

  function getTotalPanelsWithBuildings(): number {
    let total = 0
    buildings.value.forEach(building => {
      if (building.simulationItems.length > 0) {
        building.simulationItems.forEach(installation => {
          total += parseInt(installation.nbPanel, 10)
        })
      }
    })

    return total
  }

  const getPanelInfo = computedAsync(
    async () => {
      if (getTotalPanels() > 0 || getTotalPanelsWithBuildings() > 0) {
        if (simulationOptionsStored.value.length > 0) {
          roofType.value = simulationOptionsStored.value[0].roofType
          electricalPhase.value = simulationOptionsStored.value[0].electricalPhase
          addBatteries.value = simulationOptionsStored.value[0].addBattery !== 'N'
          installationLocation.value = simulationOptionsStored.value[0].installationLocation
        }

        const type =
          simulationData.panel && simulationData.isForcePanelType && roofType.value !== 'F'
            ? simulationData.panel
            : (getTotalPanels() + getTotalPanelsWithBuildings() < 140 && roofType.value !== 'B') ||
                roofType.value === 'F' ||
                (roofType.value === 'B' && getTotalPanels() + getTotalPanelsWithBuildings() < 82)
              ? 'C'
              : 'I'

        try {
          const res = type.startsWith('/api/')
            ? await getById('panel', simulationData.panel.split('/').pop())
            : await getActivePanelByInstallationLocation(type, creationDate.value)

          const dataPanel = res.data

          return {
            power: Number.parseInt(dataPanel.power),
            id: Number.parseInt(dataPanel.id),
            uri: `/api/panels/${dataPanel.id}`,
            yieldLossFirstYear: dataPanel.yieldLossFirstYear,
            yieldLossOtherYears: dataPanel.yieldLossOtherYears,
          }
        } catch (err) {
          console.error(err)

          return {
            power: 0,
            id: null,
            uri: null,
            yieldLossFirstYear: null,
            yieldLossOtherYears: null,
          }
        }
      }
    },
    {
      power: 0,
      id: null,
      uri: null,
      yieldLossFirstYear: null,
      yieldLossOtherYears: null,
    },
  )

  const nextStep = (): void => {
    onPersistData()
    stepNumber.value++
    if (!stepsCompleted.value.includes(stepNumber.value)) stepsCompleted.value.push(stepNumber.value)
  }

  function previousStep(): void {
    if (stepNumber.value >= 0) {
      stepNumber.value--
    }
  }

  const onPersistPDL = () => {
    pdls.value[pdls.value.length - 1].tempCustomer = simulationData.tempCustomer
    postPDLData(pdls.value[pdls.value.length - 1])
      .then(res => {
        pdls.value[pdls.value.length - 1].uri = res.data['@id']
        simulationPDLs.value.push(res.data['@id'])
        if (process.env.NODE_ENV === 'development') console.log(res)
      })
      .catch(err => {
        console.error(err)
      })
  }

  const apiDeletePDL = pdlId => {
    if (pdlId) {
      deletePDL(pdlId)
        .then(res => {
          if (process.env.NODE_ENV === 'development') console.log(res)
        })
        .catch(err => {
          console.error(err)
        })
    }
  }

  watch(simulationData, () => {
    if (simulationData.isSameAddresses === false) {
      tempCustomerData.longitude = null
      tempCustomerData.latitude = null
    }
  })

  const getLonLatByAddress = async () => {
    if (!tempCustomerData.longitude && !tempCustomerData.latitude) {
      if (simulationData.tempCustomer) {
        try {
          const buildAddressString = (number, name, postcode, city) => {
            return [number, name, postcode, city].filter(Boolean).join('+')
          }

          const searchingData = simulationData.isSameAddresses
            ? buildAddressString(
                tempCustomerData.streetNumber,
                tempCustomerData.streetName,
                tempCustomerData.streetPostcode,
                tempCustomerData.streetCity,
              )
            : buildAddressString(
                simulationData.installationStreetNumber,
                simulationData.installationStreetName,
                simulationData.installationStreetPostcode,
                simulationData.installationStreetCity,
              )
          if (searchingData) {
            const res = await getById('addressSuggestion', searchingData)
            if (process.env.NODE_ENV === 'development') console.log(res)
            if (res?.data && res?.data?.data) {
              if (res.data.data.length > 0) {
                try {
                  tempCustomerData.longitude = res.data.data[0].geometry.coordinates[0]
                  tempCustomerData.latitude = res.data.data[0].geometry.coordinates[1]
                } catch (e) {
                  console.error(e)
                }
              }
            }
          }
        } catch (err) {
          console.error(err)
        }
      }
    }
  }

  const onPersistData = () => {
    const userStore = useUserStore()

    if (simulationData.ownedBy === null) simulationData.ownedBy = userStore.user.uri

    if (simulationData.identifier === null) {
      generateIdentifier().then(res => {
        simulationData.identifier = res.data.identifier
        postSimulationData(simulationData).then(res => {
          simulationUri.value = res.data['@id']
          simulationId.value = res.data.id

          persistCustomerData()

          postSimulationHistory(simulationId.value, 'Création du devis', userStore.user.uri)
            .then(res => {
              if (process.env.NODE_ENV === 'development') console.log(res)
            })
            .catch(err => {
              console.error(err)
            })
        })
      })
    } else {
      persistCustomerData()

      if (getPanelInfo.value && getPanelInfo.value.id) {
        simulationData.panel = `/api/panels/${getPanelInfo.value.id}`
        // mise à jour perte d'efficacité - on test simulationData.reducedYieldFirstYear !== null pour que les devis < 17-11-2023 ne soient pas impactés (car n'existait pas avant)
        if (
          getPanelInfo.value.yieldLossFirstYear &&
          (simulationData.reducedYield === null || simulationData.reducedYieldFirstYear !== null)
        ) {
          simulationData.reducedYield = getPanelInfo.value.yieldLossOtherYears
          simulationData.reducedYieldFirstYear = getPanelInfo.value.yieldLossFirstYear
        }
      }

      patchSimulationData(simulationId.value, simulationData)
    }
  }

  const persistCustomerData = () => {
    if (tempCustomerData.customerType !== null) {
      if (simulationData.tempCustomer === null && simulationData.customer === null) {
        postTempCustomerData(tempCustomerData)
          .then(res => {
            simulationData.tempCustomer = res.data['@id']
            patchSimulationData(simulationId.value, simulationData)
            getLonLatByAddress()
              .then(res => {
                if (process.env.NODE_ENV === 'development') console.log(res)
              })
              .catch(err => console.error(err))
          })
          .catch(err => {
            console.error(err)
          })
      } else {
        patchTempCustomerData(simulationData.tempCustomer, tempCustomerData)
          .then(res => {
            if (process.env.NODE_ENV === 'development') console.log(res)

            getLonLatByAddress()
              .then(res => {
                if (process.env.NODE_ENV === 'development') console.log(res)
              })
              .catch(err => console.error(err))
          })
          .catch(err => {
            console.error(err)
          })
      }
    }
  }

  const getPowerOfOnePanel = computed(() => {
    if (getPanelInfo.value && getPanelInfo.value.id) return getPanelInfo.value.power

    return 0
  })

  const setSignedAt = (addStatus: boolean = true, idSimulation = null) => {
    if (!idSimulation) {
      idSimulation = simulationId.value
    }

    if (!simulationData.signedAtDate) {
      patchSimulationData(idSimulation, {
        signedAt: getCurrentDateForDatabase(),
      })
      const userStore = useUserStore()

      const dataStatus = {
        optionSelected: 'Signé via le CRM',
        status: '/api/statuses/6',
      }

      if (addStatus) {
        postStatusSimulation(dataStatus, idSimulation, userStore.user.uri)
          .then(res => {
            if (process.env.NODE_ENV === 'development') console.table('post:status-signé', res)
          })
          .finally(err => console.error(err))
      }

      simulationData.signedAtDate = getCurrentDateForDatabase()
    }
  }

  const getTotalPower = computed(() => {
    return ((getTotalPanels() > 0 ? getTotalPanels() : getTotalPanelsWithBuildings()) * getPowerOfOnePanel.value) / 1000
  })

  const addInstallationToPDL = (pdlId: number, data: InstallationType) => {
    pdls.value[pdlId].installations.push(data)
  }

  const erasePrices = () => {
    const pricesToDelete = {}
    if (simulationData.installationPriceHT) pricesToDelete['installationPriceHT'] = null

    if (simulationData.finalPriceHT) pricesToDelete['finalPriceHT'] = null

    if (simulationData.installationPriceHT || simulationData.finalPriceHT) {
      fetchPatchById('simulation', simulationId.value, pricesToDelete)
        .then(res => {
          if (process.env.NODE_ENV === 'development') console.log(res)

          simulationData.installationPriceHT = null
          simulationData.finalPriceHT = null
        })
        .catch(err => console.error(err))
    }
  }

  const eraseManualPrice = () => {
    if (simulationData.manualPrice) {
      simulationData.manualPrice = null

      fetchPatchById('simulation', simulationId.value, {
        manualPrice: null,
      })
        .then(res => {
          if (process.env.NODE_ENV === 'development') console.log(res)
        })
        .catch(err => console.error(err))

      const userStore = useUserStore()

      postSimulationHistory(
        simulationId.value,
        'Annulation du prix manuel',
        userStore.user.uri,
        'Le contenu du devis a été modifié, le prix manuel a automatiquement été effacé',
      )
        .then(res => {
          if (process.env.NODE_ENV === 'development') console.log(res)
        })
        .catch(err => console.error(err))
    }
  }

  function $reset() {
    stepNumber.value = 0
    stepsCompleted.value = [0]
    creationDate.value = null
    pdls.value = []
    simulationUri.value = null
    simulationId.value = null
    simulationPDLs.value = []
    buildings.value = []
    simulationOptionsStored.value = []
    roofType.value = null
    addBatteries.value = false
    installationLocation.value = null

    simulationData.ownedBy = null
    simulationData.identifier = null
    simulationData.number = null
    simulationData.consumptionQuantity = null
    simulationData.consumptionPrice = null
    simulationData.reducedYield = null
    simulationData.reducedYieldFirstYear = null
    simulationData.priceEscalation = 6
    simulationData.salesPriceEscalation = 1.5
    simulationData.installationLocation = null
    simulationData.profile = null
    simulationData.installationPriceHT = null
    simulationData.finalPriceHT = null
    simulationData.manualPrice = null
    simulationData.tempCustomer = null
    simulationData.customer = null
    simulationData.panel = null
    simulationData.status = null
    simulationData.step = null
    simulationData.isArdoiseClouee = null
    simulationData.nbToitures = null
    simulationData.nbCharpentesNonVisibles = null
    simulationData.nbCharpentesBeton = null
    simulationData.estSigne = false
    simulationData.isForcePanelType = false
    simulationData.installationStreetNumber = null
    simulationData.installationStreetName = null
    simulationData.installationStreetPostcode = null
    simulationData.installationStreetCity = null
    simulationData.isSameAddresses = true
    simulationData.surveyMainBuilding = null
    simulationData.nbSurveyOtherBuildings = null
    simulationData.signedAtDate = null
    simulationData.consumptionQuantityDetailed = null
    simulationData.consumptionPriceDetailed = null
    simulationData.seasonalPrices = null

    tempCustomerData.firstname = null
    tempCustomerData.lastname = null
    tempCustomerData.email = null
    tempCustomerData.phoneNumber = null
    tempCustomerData.companyType = null
    tempCustomerData.companyName = null
    tempCustomerData.companyDenomination = null
    tempCustomerData.siret = null
    tempCustomerData.streetNumber = null
    tempCustomerData.streetName = null
    tempCustomerData.streetPostBox = null
    tempCustomerData.streetPostcode = null
    tempCustomerData.streetCity = null
    tempCustomerData.longitude = null
    tempCustomerData.latitude = null
    tempCustomerData.customerType = null
    tempCustomerData.canDeductVAT = null
    tempCustomerData.position = null
    tempCustomerData.civility = null

    signature.content = null
    signature.firstnameSignataire = null
    signature.lastnameSignataire = null
    signature.typeSignature = null
    signature.isClauseSuspensive = false
    signature.birthday = null
    signature.birthPlace = null

    customerOwnership.isCustomerCertifiesOwnership = null
    customerOwnership.isAgreementBareOwner = null

    console.log('Le store simulationStep a bien été réinitialisé')
  }

  return {
    stepsCompleted,
    simulationUri,
    simulationId,
    simulationData,
    tempCustomerData,
    customerOwnership,
    stepNumber,
    nextStep,
    previousStep,
    pdls,
    addInstallationToPDL,
    getTotalPanels,
    getTotalPanelsWithBuildings,
    getPanelInfo,
    simulationPDLs,
    buildings,
    onPersistData,
    customerEmail,
    onPersistPDL,
    apiDeletePDL,
    getTotalPower,
    signature,
    eraseManualPrice,
    erasePrices,
    $reset,
    creationDate,
    simulationOptionsStored,
    roofType,
    electricalPhase,
    addBatteries,
    installationLocation,
    persistCustomerData,
    setSignedAt,
  }
})
