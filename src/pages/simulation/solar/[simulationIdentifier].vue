<route lang="json">
{
  "meta": {
    "layout": "blank"
  }
}
</route>

<script setup lang="ts">
import { useSimulationStore } from '@/stores/simulation'
import { getDateFormat } from '@/utils/dateUtils'
import { getById } from '@/services/api'

import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'

import SimulationConsumption from '@/components/simulation-solar-steps/simulation-consumption.vue'
import SimulationCustomer from '@/components/simulation-solar-steps/simulation-customer.vue'
import SimulationProfile from '@/components/simulation-solar-steps/simulation-profile.vue'
import SimulationInstallation from '@/components/simulation-solar-steps/simulation-installation.vue'
import SimulationProposal from '@/components/simulation-solar-steps/simulation-proposal.vue'
import SimulationBuilding from '@/components/simulation-solar-steps/simulation-building.vue'

const simulationStore = useSimulationStore()
const { onPersistData, persistCustomerData } = simulationStore

const {
  stepNumber,
  stepsCompleted,
  simulationData,
  simulationUri,
  simulationId,
  tempCustomerData,
  pdls,
  simulationPDLs,
  signature,
  customerOwnership,
  creationDate,
  buildings,
  simulationOptionsStored,
} = storeToRefs(simulationStore)

const route = useRoute()
const router = useRouter()

const simulationMenu = ref(false)

const simulationIdentifier = route.params.simulationIdentifier !== 'new' ? route.params.simulationIdentifier : null

const stepsIcons = [
  {
    step: 2,
    icon: 'tabler:file-power',
    text: 'Votre consommation',
    component: SimulationConsumption,
  },
  {
    step: 1,
    icon: 'teenyicons:contact-outline',
    text: 'Vos coordonnées',
    component: SimulationCustomer,
  },
  {
    step: 3,
    icon: 'fluent:building-home-16-regular',
    text: 'Votre bâtiment',
    component: SimulationBuilding,
  },
  {
    step: 4,
    icon: 'gis:profile',
    text: 'Profil énergétique',
    component: SimulationProfile,
  },
  {
    step: 5,
    icon: 'tabler:solar-panel-2',
    text: 'Votre installation',
    component: SimulationInstallation,
  },
  {
    step: 6,
    icon: 'mingcute:paper-line',
    text: 'Votre proposition',
    component: SimulationProposal,
  },
]

stepsIcons.sort((a, b) => a.step - b.step)

const temporaryIndexation = ref(null)
const temporaryIndexationSales = ref(null)

const onChangeOptions = () => {
  simulationData.value.priceEscalation = Number.parseFloat(temporaryIndexation.value)
  simulationData.value.salesPriceEscalation = Number.parseFloat(temporaryIndexationSales.value)
  onPersistData()
  simulationMenu.value = false
}

const onGoToDashboard = () => {
  const routeData = router.resolve({ path: '/dashboard' })

  window.open(routeData.href, '_blank')
}

const isAllDataLoaded = ref(false)

onMounted(() => {
  simulationStore.$reset()

  if (route.name === 'simulation-solar-simulationIdentifier' && simulationIdentifier) {
    getById('simulation', simulationIdentifier, true, 'get+ld').then(res => {
      if (process.env.NODE_ENV === 'development') console.log('simulation =>', res.data)
      const data = res.data

      for (let i = 1; i <= 5; i++) {
        stepsCompleted.value.push(i)
      }

      // owner
      if (data.ownedBy) simulationData.value.ownedBy = data.ownedBy['@id']

      // divers
      creationDate.value = getDateFormat(data.createdAt, 'dateFormatHTMLElement')
      simulationData.value.priceEscalation = data.priceEscalation
      simulationData.value.salesPriceEscalation = data.salesPriceEscalation

      simulationData.value.reducedYield = data.reducedYield ? data.reducedYield : null
      simulationData.value.reducedYieldFirstYear = data.reducedYieldFirstYear ? data.reducedYieldFirstYear : null

      // prices
      simulationData.value.installationPriceHT = data.installationPriceHT
      simulationData.value.finalPriceHT = data.finalPriceHT
      simulationData.value.manualPrice = data.manualPrice

      // signature
      simulationData.value.signedAtDate = data.signedAt

      // identifier, uri et ID
      simulationData.value.identifier = data.identifier
      simulationUri.value = data['@id']
      simulationId.value = data.id

      // survey
      simulationData.value.nbSurveyOtherBuildings = data.nbSurveyOtherBuildings
      simulationData.value.surveyMainBuilding = data.surveyMainBuilding

      // panel
      if (data.panel) {
        simulationData.value.panel = data.panel['@id']
        simulationData.value.isForcePanelType = data.isForcePanelType
      }

      // consumption
      simulationData.value.seasonalPrices =
        data.seasonalPrices !== null && data.seasonalPrices !== undefined ? data.seasonalPrices : null

      simulationData.value.consumptionQuantity =
        data.consumptionQuantity !== null && data.consumptionQuantity !== undefined
          ? data.consumptionQuantity.toString()
          : null

      simulationData.value.consumptionPrice =
        data.consumptionPrice !== null && data.consumptionPrice !== undefined ? data.consumptionPrice.toString() : null

      simulationData.value.consumptionQuantityDetailed =
        data.consumptionQuantityDetailed !== null && data.consumptionQuantityDetailed !== undefined
          ? data.consumptionQuantityDetailed
          : null

      simulationData.value.consumptionPriceDetailed =
        data.consumptionPriceDetailed !== null && data.consumptionPriceDetailed !== undefined
          ? data.consumptionPriceDetailed
          : null

      // customer
      if (data.tempCustomer) {
        simulationData.value.tempCustomer = data.tempCustomer ? data.tempCustomer['@id'] : null
        tempCustomerData.value.customerType = data.tempCustomer.customerType
        tempCustomerData.value.canDeductVAT = data.tempCustomer.canDeductVAT

        tempCustomerData.value.firstname = data.tempCustomer.firstname
        tempCustomerData.value.lastname = data.tempCustomer.lastname
        tempCustomerData.value.civility = data.tempCustomer.civility
        tempCustomerData.value.position = data.tempCustomer.position
        tempCustomerData.value.email = data.tempCustomer.email
        tempCustomerData.value.phoneNumber = data.tempCustomer.phoneNumber

        tempCustomerData.value.longitude = data.tempCustomer.longitude
        tempCustomerData.value.latitude = data.tempCustomer.latitude

        tempCustomerData.value.companyName = data.tempCustomer.companyName
        tempCustomerData.value.siret = data.tempCustomer.siret
        tempCustomerData.value.companyDenomination = data.tempCustomer.companyDenomination
        tempCustomerData.value.companyType = data.tempCustomer.companyType ? data.tempCustomer.companyType['@id'] : null

        tempCustomerData.value.streetNumber = data.tempCustomer.streetNumber
        tempCustomerData.value.streetName = data.tempCustomer.streetName
        tempCustomerData.value.streetPostcode = data.tempCustomer.streetPostcode
        tempCustomerData.value.streetCity = data.tempCustomer.streetCity
      }

      // buildings
      if (data.buildings.length > 0) {
        data.buildings.forEach((building, index) => {
          const simulationItems = building.simulationItems.map(item => ({
            id: item.id,
            simulation: parseInt(item.simulation.replaceAll(/^\D+/g, ''), 10),
            building: parseInt(item.building.replaceAll(/^\D+/g, ''), 10),
            nbPanel: item.nbPanel,
            energyPotential: item.energyPotential,
            detailedEnergyPotential: item.detailedEnergyPotential,
            inclinaison: item.inclinaison,
            azimuth: item.azimuth,
          }))

          buildings.value.push({
            id: building.id,
            simulation: simulationUri.value,
            idBuilding: index,
            name: building.name,
            pdlNumber: building.pdlNumber,
            isCustomerCertifiesOwnership: building?.isCustomerCertifiesOwnership,
            isAgreementBareOwner: building?.isAgreementBareOwner,
            simulationItems: simulationItems,
          })

          building?.simulationOptions.forEach(options => {
            simulationOptionsStored.value.push({
              id: options?.id,
              addBattery: options?.addBattery,
              addChargingPoint: options?.addChargingPoint,
              asbestosRoof: options?.asbestosRoof,
              building: options?.building ? parseInt(options.building.replaceAll(/^\D+/g, ''), 10) : null,
              installationLocation: options?.installationLocation,
              isErpBuilding: options?.isErpBuilding,
              nbLevel: options?.nbLevel,
              nbRoofSection: options?.nbRoofSection,
              phaseType: options?.phaseType,
              roofType: options?.roofType,
            })
          })
        })
      }

      // pdls + installations (via simulationItem)
      simulationData.value.installationLocation = data.installationLocation

      if (data.simulationItems.length > 0) {
        data.simulationItems.forEach(item => {
          if (simulationPDLs.value.length > 0 && !simulationPDLs.value.includes(item.pdl['@id'])) {
            // ownership
            customerOwnership.value.isCustomerCertifiesOwnership = item.pdl.isCustomerCertifiesOwnership
            customerOwnership.value.isAgreementBareOwner = item.pdl.isAgreementBareOwner

            const dataPdl = {
              pdlNumber: item.pdl.pdlNumber,
              streetNumber: item.pdl.streetNumber,
              streetName: item.pdl.streetName,
              streetCity: item.pdl.streetCity,
              streetPostCode: item.pdl.streetPostCode,
              buildingId: item.pdl.buildingId,
              uri: item.pdl['@id'],
              tempCustomer: data.tempCustomer['@id'],
              installations: [],
              isCustomerCertifiesOwnership: item.pdl.isCustomerCertifiesOwnership,
              isAgreementBareOwner: item.pdl.isAgreementBareOwner,
            }

            pdls.value.push(dataPdl)
            simulationPDLs.value.push(dataPdl.uri)
          }

          const dataItem = {
            nbPanel: item.nbPanel,
            energyPotential: item.energyPotential,
            azimuthOrientation: item.azimuth,
            panelTilt: item.inclinaison,
            department: null,
            uriItem: item['@id'],
          }

          const pdlIndex = simulationPDLs.value.length > 0 ? simulationPDLs.value.indexOf(item.pdl['@id']) : null

          pdlIndex && pdls.value[pdlIndex].installations.push(dataItem)
        })
      } else if (data.tempCustomer && data.tempCustomer.pDLs && data.tempCustomer.pDLs.length > 0) {
        data.tempCustomer.pDLs.forEach(item => {
          if (!simulationPDLs.value.includes(item['@id'])) {
            const dataPdl = {
              pdlNumber: item.pdlNumber,
              streetNumber: item.streetNumber,
              streetName: item.streetName,
              streetCity: item.streetCity,
              streetPostCode: item.streetPostCode,
              buildingId: item.buildingId,
              uri: item['@id'],
              tempCustomer: data.tempCustomer['@id'],
              installations: [],
            }

            pdls.value.push(dataPdl)
            simulationPDLs.value.push(dataPdl.uri)
          }
        })
      }

      // profile
      if (data.profile) simulationData.value.profile = data.profile['@id']

      // toiture et charpente
      simulationData.value.nbToitures = data.nbToitures
      simulationData.value.nbCharpentesNonVisibles = data.nbCharpentesNonVisibles
      simulationData.value.nbCharpentesBeton = data.nbCharpentesBeton

      // signature du devis
      if (data.signatureSimulations) {
        data.signatureSimulations.forEach(item => {
          if (item.purpose === 'devis') {
            signature.value.firstnameSignataire = item.signature.firstnameSignataire
            signature.value.lastnameSignataire = item.signature.lastnameSignataire
            signature.value.typeSignature = item.signature.typeSignature
            signature.value.isClauseSuspensive =
              item.signature.isClauseSuspensive !== null ? item.signature.isClauseSuspensive : false
            if (item.signature.birthday !== null)
              signature.value.birthday = getDateFormat(item.signature.birthday, 'dateFormatHTMLElement')

            signature.value.birthPlace = item.signature.birthPlace !== null ? item.signature.birthPlace : null
          }
        })
      }

      // est signé
      simulationData.value.estSigne = data.isSigned

      // ardoise clouee
      simulationData.value.isArdoiseClouee = data.isArdoiseClouee

      isAllDataLoaded.value = true
      persistCustomerData()
    })
  } else {
    isAllDataLoaded.value = true
  }
  temporaryIndexation.value = simulationData.value.priceEscalation
  temporaryIndexationSales.value = simulationData.value.salesPriceEscalation
})
</script>

<template>
  <VLayout>
    <VAppBar
      color="grey-800"
      height="42"
      class="px-10"
      elevation="24"
    >
      <template #append>
        <VBtn
          variant="flat"
          prepend-icon="iconamoon:options"
          color="green-sunstack-darker"
          size="small"
          class="me-5"
          :ripple="false"
          :disabled="simulationData.estSigne"
        >
          Options de la simulation
          <VMenu
            v-model="simulationMenu"
            activator="parent"
            :close-on-content-click="false"
          >
            <VList>
              <VListItem>
                <VTextField
                  v-model="temporaryIndexation"
                  label="Indexation des prix (en %)"
                  variant="solo-filled"
                  type="number"
                />
              </VListItem>
              <VListItem>
                <VTextField
                  v-model="temporaryIndexationSales"
                  label="Indexation prix de revente (en %)"
                  variant="solo-filled"
                  type="number"
                />
              </VListItem>
              <VListItem>
                <VSwitch
                  v-model="tempCustomerData.canDeductVAT"
                  label="Peut déduire la TVA"
                />
              </VListItem>
              <VListItem class="mt-2 text-center">
                <VBtn
                  variant="flat"
                  size="small"
                  color="primary"
                  text="Enregistrer"
                  @click.prevent="onChangeOptions"
                />
              </VListItem>
            </VList>
          </VMenu>
        </VBtn>
        <NavbarThemeSwitcher />
      </template>
    </VAppBar>
    <VMain class="layout-simulation-solar mt-7 ml-3">
      <div class="d-flex align-center justify-start ga-8">
        <LogoTheme
          class="ml-lg-12 ml-xl-0 cursor-pointer"
          width="160"
          @click="onGoToDashboard"
        />
        <VBtn
          v-if="simulationIdentifier"
          text="Retour au devis"
          variant="outlined"
          size="small"
          color="yellow-sunstack"
          prepend-icon="carbon:return"
          :to="{ name: 'simulation-show-simulationId', params: { simulationId: simulationIdentifier } }"
        />
      </div>
      <VDivider class="my-6" />
      <VRow>
        <VCol cols="12">
          <VCard
            min-height="450"
            elevation="12"
            class="mb-5"
          >
            <VCardText v-if="!simulationData.estSigne">
              <VSlideGroup
                v-model="stepNumber"
                class="pa-4 app-stepper app-stepper-center checkout-stepper"
                selected-class="stepper-steps-active"
                show-arrows
              >
                <VSlideGroupItem
                  v-for="(step, index) in stepsIcons"
                  :key="step.text"
                  v-slot="{ toggle }"
                >
                  <div
                    :class="
                      index === stepNumber
                        ? 'stepper-steps-active'
                        : index < stepNumber || stepsCompleted.includes(index)
                          ? 'stepper-steps-completed'
                          : 'stepper-steps-inactive'
                    "
                    class="cursor-pointer mx-1"
                    @click="
                      index !== stepNumber && (stepsCompleted.includes(index) || index < stepNumber) ? toggle() : null
                    "
                  >
                    <div class="stepper-icon-step d-flex align-center ga-2">
                      <div class="d-flex align-center ga-2 step-wrapper flex-column">
                        <VIcon
                          size="36"
                          :icon="step.icon"
                        />
                        <p class="stepper-title text-base mb-0">
                          {{ step.text }}
                        </p>
                      </div>
                      <VIcon
                        v-if="index !== stepsIcons.length - 1"
                        icon="ooui:next-ltr"
                        class="mx-6"
                        :color="!stepsCompleted.includes(index + 1) ? 'secondary' : null"
                      />
                    </div>
                  </div>
                </VSlideGroupItem>
              </VSlideGroup>
              <VDivider class="mx-10 mb-8" />
              <VSheet
                rounded
                class="mx-auto pb-8"
              >
                <VFadeTransition mode="out-in">
                  <div
                    v-if="!isAllDataLoaded"
                    class="d-flex justify-center mt-8"
                  >
                    <VProgressCircular
                      color="primary"
                      indeterminate
                      :size="100"
                      :width="12"
                    />
                  </div>
                  <KeepAlive v-else>
                    <Component :is="stepsIcons[stepNumber].component" />
                  </KeepAlive>
                </VFadeTransition>
              </VSheet>
            </VCardText>
            <VCardText v-else>
              <VRow
                justify="center"
                class="mt-8"
              >
                <VCol
                  cols="12"
                  lg="8"
                >
                  <VAlert
                    title="Ce devis est signé et ne peut pas être modifié."
                    icon="healthicons:stop-outline"
                    color="error"
                    border="start"
                    prominent
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VMain>
  </VLayout>
</template>
