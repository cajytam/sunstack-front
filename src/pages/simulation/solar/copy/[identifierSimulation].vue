<route lang="json">
{
  "meta": {
    "layout": "blank"
  }
}
</route>

<script setup lang="ts">
import { getById } from '@/services/api'
import { useUserStore } from '@/stores/user'
import {
  generateIdentifier,
  patchSimulationData,
  postSimulationData,
  postSimulationItems,
} from '@/services/simulationService'
import { postSimulationHistory } from '@/services/historyService'
import { postTempCustomerData } from '@/services/customerService'
import { postPDLData } from '@/services/pdlService'
import { getPanelByTypeInstallation } from '@/services/panelService'
import { PDLType } from '@domain/types/simulation'

const route = useRoute()
const router = useRouter()

const userStore = useUserStore()
const { authUser } = userStore

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
  tempCustomer: null,
  customer: null,
  panel: null,
  isArdoiseClouee: null,
  nbToitures: null,
  nbCharpentesNonVisibles: null,
  nbCharpentesBeton: null,
})

const prospectData = reactive({
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

const customerOwnership = reactive({
  isCustomerCertifiesOwnership: null,
  isAgreementBareOwner: null,
})

const pdls: PDLType[] = ref([])

const simulationPDLs = ref([])

const simulationIdentifier = route.params.identifierSimulation ? route.params.identifierSimulation : null

const countDataPromise = ref(0)
const totalDataPromise = ref(null)
const ratioDataPromise = ref(0)

const textCopy = ref('Copie en cours')

onMounted(() => {
  if (route.name === 'simulation-solar-copy-identifierSimulation' && simulationIdentifier) {
    getById('simulation', simulationIdentifier, true, 'get+ld').then(async res => {
      if (process.env.NODE_ENV === 'development') console.log('devis', res.data)

      const data = res.data

      totalDataPromise.value = 1
      if (data.simulationItems) totalDataPromise.value += data.simulationItems.length

      if (data.tempCustomer) totalDataPromise.value += 1

      // owner
      simulationData.ownedBy = authUser.uri

      // divers
      simulationData.priceEscalation = data.priceEscalation
      simulationData.salesPriceEscalation = data.salesPriceEscalation

      simulationData.reducedYield = data.reducedYield ? data.reducedYield : null
      simulationData.reducedYieldFirstYear = data.reducedYieldFirstYear ? data.reducedYieldFirstYear : null

      // panel
      if (data.panel && data.nbPanelsTotal > 0) {
        const panelInfo = await getPanelByTypeInstallation(data.nbPanelsTotal < 140 ? 'C' : 'I')

        simulationData.panel = panelInfo.data && panelInfo.data[0].id ? `/api/panels/${panelInfo.data[0].id}` : null
      }

      // prices
      simulationData.finalPriceHT = data.finalPriceHT
      simulationData.installationPriceHT = data.installationPriceHT

      // consumption
      simulationData.consumptionQuantity =
        data.consumptionQuantity !== null && data.consumptionQuantity !== undefined
          ? data.consumptionQuantity.toString()
          : null
      simulationData.consumptionPrice =
        data.consumptionPrice !== null && data.consumptionPrice !== undefined ? data.consumptionPrice.toString() : null

      simulationData.installationLocation = data.installationLocation

      // toiture et charpente
      simulationData.nbToitures = data.nbToitures
      simulationData.nbCharpentesNonVisibles = data.nbCharpentesNonVisibles
      simulationData.nbCharpentesBeton = data.nbCharpentesBeton

      // ardoise clouee
      simulationData.isArdoiseClouee = data.isArdoiseClouee

      generateIdentifier().then(res => {
        simulationData.identifier = res.data.identifier

        postSimulationData(simulationData)
          .then(res => {
            simulationUri.value = res.data['@id']
            simulationId.value = res.data.id

            if (data.profile) simulationData.profile = data.profile['@id']

            countDataPromise.value++

            postSimulationHistory(
              simulationId.value,
              'Création du devis',
              authUser.uri,
              `A partir d'une copie du devis ${data.name}`,
            )
              .then(res => {
                if (process.env.NODE_ENV === 'development') console.log('history', res)

                if (data.tempCustomer) {
                  prospectData.customerType = data.tempCustomer.customerType
                  prospectData.canDeductVAT = data.tempCustomer.canDeductVAT

                  prospectData.firstname = data.tempCustomer.firstname
                  prospectData.lastname = data.tempCustomer.lastname
                  prospectData.civility = data.tempCustomer.civility
                  prospectData.position = data.tempCustomer.position
                  prospectData.email = data.tempCustomer.email
                  prospectData.phoneNumber = data.tempCustomer.phoneNumber

                  prospectData.companyName = data.tempCustomer.companyName
                  prospectData.siret = data.tempCustomer.siret
                  prospectData.companyDenomination = data.tempCustomer.companyDenomination
                  prospectData.companyType = data.tempCustomer.companyType ? data.tempCustomer.companyType['@id'] : null

                  prospectData.streetNumber = data.tempCustomer.streetNumber
                  prospectData.streetName = data.tempCustomer.streetName
                  prospectData.streetPostcode = data.tempCustomer.streetPostcode
                  prospectData.streetCity = data.tempCustomer.streetCity

                  postTempCustomerData(prospectData).then(res => {
                    simulationData.tempCustomer = res.data['@id']

                    countDataPromise.value++

                    patchSimulationData(simulationId.value, simulationData)

                    const processItemsAndPDL = async () => {
                      if (data.simulationItems.length > 0) {
                        for (const item of data.simulationItems) {
                          const persistPDL = async item => {
                            // ownership
                            customerOwnership.isCustomerCertifiesOwnership = item.pdl.isCustomerCertifiesOwnership
                            customerOwnership.isAgreementBareOwner = item.pdl.isAgreementBareOwner

                            const dataPdl = {
                              pdlNumber: item.pdl.pdlNumber,
                              streetNumber: item.pdl.streetNumber,
                              streetName: item.pdl.streetName,
                              streetCity: item.pdl.streetCity,
                              streetPostCode: item.pdl.streetPostCode,
                              buildingId: item.pdl.buildingId,
                              tempCustomer: simulationData.tempCustomer,
                              installations: [],
                              isCustomerCertifiesOwnership: item.pdl.isCustomerCertifiesOwnership,
                              isAgreementBareOwner: item.pdl.isAgreementBareOwner,
                            }

                            pdls.value.push(dataPdl)
                            simulationPDLs.value.push(item.pdl['@id'])

                            await postPDLData(pdls.value[pdls.value.length - 1])
                              .then(res => {
                                pdls.value[pdls.value.length - 1].uri = res.data['@id']
                              })
                              .catch(err => {
                                console.error(err)
                              })
                          }

                          if (!simulationPDLs.value.includes(item.pdl['@id'])) await persistPDL(item)

                          await postSimulationItems(
                            item.nbPanel,
                            item.energyPotential,
                            simulationUri.value,
                            pdls.value[pdls.value.length - 1].uri,
                            item.zone['@id'],
                          )
                            .then(res => {
                              countDataPromise.value++
                            })
                            .catch(err => {
                              console.error(err)
                            })
                        }
                      }
                    }
                    processItemsAndPDL()
                  })
                }
              })
              .catch(err => console.error(err))
          })
          .catch(err => console.error(err))
      })
    })
  }
})

watch(countDataPromise, () => {
  ratioDataPromise.value = (countDataPromise.value / totalDataPromise.value) * 100

  if (countDataPromise.value >= totalDataPromise.value) {
    textCopy.value = 'Copie terminée, redirection en cours'

    router.push({
      name: 'simulation-solar-simulationIdentifier',
      params: { simulationIdentifier: simulationId.value },
    })
  }
})
</script>

<template>
  <div>
    <VContainer class="d-flex mt-5 justify-center align-center">
      <span class="text-h4 text-primary">{{ textCopy }}&nbsp;&nbsp;</span>
      <VIcon
        icon="svg-spinners:bars-scale-fade"
        size="x-large"
        color="primary"
      />
    </VContainer>
    <VContainer class="d-flex w-50 mt-5 justify-center align-center">
      <VProgressLinear
        v-model="ratioDataPromise"
        height="25"
        color="primary"
      >
        <strong>{{ Math.ceil(ratioDataPromise) }}%</strong>
      </VProgressLinear>
    </VContainer>
  </div>
</template>
