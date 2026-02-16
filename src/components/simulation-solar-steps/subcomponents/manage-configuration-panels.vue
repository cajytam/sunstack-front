<script setup lang="ts">
import { useSimulationStore } from '@/stores/simulation'
import { getFormatPDL, getNumberFormat } from '@/utils/numberUtils'
import { RoofOrientation } from '@/utils/panelUtils'
import { getPVGISDetailedEnergyPotential } from '@/services/energyPotentialService'
import type { SimulationItem } from '@domain/types/simulation'
import type { Ref } from 'vue'
import { listMois } from '@/utils/dateUtils'
import { capitalizeFirstLetter } from '@/utils/stringUtils'
import { postSimulationItemData } from '@/services/simulationItemService'

const azimuthItems = [10, 30, 45]

const currentSimulationItem: Ref<SimulationItem> = ref({
  simulation: null,
  building: null,
  nbPanel: null,
  energyPotential: null,
  detailedEnergyPotential: {},
  inclinaison: null,
  azimuth: null,
})

const simulationStore = useSimulationStore()
const { simulationOptionsStored, tempCustomerData, simulationUri, eraseManualPrice } = simulationStore
const { buildings } = storeToRefs(simulationStore)

const buildingSimulationOptions = buildingId => {
  const option = simulationOptionsStored.filter(options => options.building === buildingId)
  return option.length > 0 ? option[0] : []
}

const getRoofSectionSentence = computed(() => (nbRoofSectionDone, nbRoofSectionsTotal) => {
  if (!nbRoofSectionsTotal) return '<span class="text-error font-weight-bold">Non terminé</span>'
  if (nbRoofSectionDone == nbRoofSectionsTotal)
    return '<span class="text-primary font-weight-bold">Configuration terminée</span>'
  return `${nbRoofSectionDone} pan${nbRoofSectionDone > 1 ? 's' : ''} paramétré${nbRoofSectionDone > 1 ? 's' : ''} / ${nbRoofSectionsTotal}`
})

const orientationItems = ref([])

onMounted(() => {
  for (let key in RoofOrientation) {
    orientationItems.value.push({ id: key, name: RoofOrientation[key] })
  }
  orientationItems.value.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
})

const isFetchingPVGIS = ref(false)

const onPVGISRequest = async () => {
  if (!currentSimulationItem.value.azimuth || !currentSimulationItem.value.inclinaison) return

  isFetchingPVGIS.value = true

  await getPVGISDetailedEnergyPotential({
    inclinaison: currentSimulationItem.value.inclinaison,
    azimuth: currentSimulationItem.value.azimuth,
    lat: tempCustomerData.latitude,
    lon: tempCustomerData.longitude,
  })
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)
      if (res?.data) {
        currentSimulationItem.value.detailedEnergyPotential = getDetailedEnergyPotential(res.data.monthly)
        currentSimulationItem.value.energyPotential = Math.round(res.data.total.E_y)

        detailsPotentialByMonthAndPercent.value = null
        detailsPotentialByMonthAndPercent.value = getDetailedPotentialByMonth()
      }
    })
    .catch(err => console.error(err))
    .finally(() => (isFetchingPVGIS.value = false))
}

const getDetailedEnergyPotential = (arr: []) => {
  return arr.reduce(
    (acc, item) => {
      acc[item.month] = item.E_m
      return acc
    },
    {} as { [key: number]: number },
  )
}

const getCalculatedPotentialFromRatio = () => {
  if (currentSimulationItem.value.energyPotential) {
    return `(1 kWc génèrera ${Math.round((currentSimulationItem.value.energyPotential / 1000 + Number.EPSILON) * 1000) / 1000} kWh)`
  }
}

const isShowDetailedPotential = ref(false)
const detailsPotentialByMonthAndPercent = ref([])

const getDetailedPotentialByMonth = () => {
  if (currentSimulationItem.value.detailedEnergyPotential) {
    const total = Object.values(currentSimulationItem.value.detailedEnergyPotential).reduce(
      (sum, value) => sum + value,
      0,
    )
    const result = Object.entries(currentSimulationItem.value.detailedEnergyPotential).map(([month, value]) => ({
      month: listMois[parseInt(month, 10) - 1],
      percentage: parseFloat(((value / total) * 100).toFixed(2)),
    }))
    if (process.env.NODE_ENV === 'development') console.log(result)
    return result
  }
}

const selectedBuilding = ref(null)

const isPersistingSimulationItem = ref(false)
const onAddSimulationItem = () => {
  if (buildings.value.length === 1) {
    selectedBuilding.value = 0
  }

  if (
    currentSimulationItem.value.energyPotential &&
    currentSimulationItem.value.detailedEnergyPotential &&
    currentSimulationItem.value.azimuth &&
    currentSimulationItem.value.inclinaison &&
    currentSimulationItem.value.nbPanel &&
    selectedBuilding.value !== null
  ) {
    currentSimulationItem.value.building = `/api/buildings/${buildings.value[selectedBuilding.value].id}`
    isPersistingSimulationItem.value = true

    currentSimulationItem.value.simulation = simulationUri
    const data = JSON.parse(JSON.stringify(currentSimulationItem.value))

    postSimulationItemData(data)
      .then(res => {
        if (process.env.NODE_ENV === 'development') console.log(res)

        eraseManualPrice()

        buildings.value[selectedBuilding.value].simulationItems.push(res.data)
        currentSimulationItem.value.azimuth = null
        currentSimulationItem.value.inclinaison = null
        currentSimulationItem.value.energyPotential = null
        currentSimulationItem.value.nbPanel = null

        if (
          parseInt(buildings.value[selectedBuilding.value].simulationItems.length, 10) >=
          parseInt(buildingSimulationOptions(buildings.value[selectedBuilding.value].id).nbRoofSection, 10)
        ) {
          selectedBuilding.value = null
        }
      })
      .catch(err => console.error(err))
      .finally(() => (isPersistingSimulationItem.value = false))
  }
}
</script>

<template>
  <VContainer>
    <VRow justify="center">
      <VCol cols="12">
        <div class="d-flex justify-center align-center gap-x-3">
          <VIcon
            icon="fa-solid:solar-panel"
            size="48"
            color="primary"
          />
          <h1 class="text-center text-h4 font-weight-bold">Configurez votre installation</h1>
        </div>

        <VItemGroup
          v-if="buildings.length > 1"
          v-model="selectedBuilding"
          selected-class="bg-primary"
          mandatory
        >
          <VRow
            align="center"
            justify="center"
            class="mt-5 mb-2"
          >
            <VCol
              cols="4"
              v-for="building in buildings"
              :key="building.id"
            >
              <VItem
                v-slot="{ isSelected, selectedClass, toggle }"
                :disabled="
                  buildingSimulationOptions(building.id).length <= 0 ||
                  building.simulationItems.length >= buildingSimulationOptions(building.id).nbRoofSection
                "
              >
                <VCard
                  class="bg-var-theme-background px-3 py-1"
                  :class="selectedClass"
                  :elevation="isSelected ? 12 : 0"
                  border
                  :disabled="
                    buildingSimulationOptions(building.id).length <= 0 ||
                    building.simulationItems.length >= buildingSimulationOptions(building.id).nbRoofSection
                  "
                  @click="toggle"
                >
                  <VRow
                    justify="center"
                    align="center"
                    class="text-center pt-2 font-weight-bold text-h6"
                    :class="{ 'card-pdl__selected': isSelected }"
                  >
                    <VCol cols="3">
                      <VIcon
                        icon="carbon:meter"
                        size="large"
                      />
                    </VCol>
                    <VCol
                      cols="9"
                      class="text-left"
                    >
                      {{ getFormatPDL(building.pdlNumber) }}
                    </VCol>
                  </VRow>
                  <VRow
                    justify="center"
                    align="center"
                    class="text-center font-weight-bold text-h6 mt-2"
                    :class="{ 'card-pdl__selected': isSelected }"
                  >
                    <VCol cols="3">
                      <VIcon
                        size="32"
                        icon="mingcute:building-4-fill"
                      />
                    </VCol>
                    <VCol
                      cols="9"
                      class="text-h6 font-weight-bold text-left"
                      :class="{ 'card-pdl__selected': isSelected }"
                    >
                      {{ building.name }}
                    </VCol>
                  </VRow>
                  <VRow
                    justify="center"
                    align="center"
                    class="text-center pb-2 font-weight-bold text-h6 mt-2"
                    :class="{ 'card-pdl__selected': isSelected }"
                  >
                    <VCol cols="3">
                      <VIcon
                        size="32"
                        icon="ph:solar-roof"
                      />
                    </VCol>
                    <VCol
                      cols="9"
                      class="text-overline font-italic text-left"
                      :class="{ 'card-pdl__selected': isSelected }"
                    >
                      <span
                        v-html="
                          getRoofSectionSentence(
                            building.simulationItems.length,
                            buildingSimulationOptions(building.id).nbRoofSection,
                          )
                        "
                      ></span>
                    </VCol>
                  </VRow>
                </VCard>
              </VItem>
            </VCol>
          </VRow>
        </VItemGroup>
      </VCol>
    </VRow>
    <VForm>
      <VRow
        align="center"
        justify="center"
        class="mt-8 mb-1"
      >
        <VCol
          cols="12"
          lg="4"
          class="mb-3"
        >
          <h2 class="text-body-1 text-xl-h5 font-weight-bold">
            <VIcon
              icon="fa6-solid:solar-panel"
              class="me-3"
              color="primary"
              size="x-large"
            />
            Nombre de panneaux :
          </h2>
        </VCol>
        <VCol
          cols="12"
          lg="3"
        >
          <VNumberInput
            class="font-weight-bold field-nbPanel__input"
            center-affix
            variant="solo"
            type="number"
            density="comfortable"
            :min="1"
            single-line
            v-model="currentSimulationItem.nbPanel"
          />
        </VCol>
      </VRow>
      <VRow
        class="mt-8"
        justify="center"
        align="center"
      >
        <VCol
          cols="6"
          xl="3"
          lg="4"
        >
          <VCard>
            <VCardTitle>
              <h2 class="text-body-1 font-weight-bold text-center text-primary">
                <VIcon
                  icon="mdi-sun-azimuth"
                  class="me-1"
                  size="large"
                  color="primary"
                />
                Orientation
              </h2>
            </VCardTitle>
            <VCardText class="pt-3">
              <VSelect
                class="field-configuration__select justify-center"
                :items="orientationItems"
                variant="filled"
                item-value="id"
                item-title="name"
                v-model="currentSimulationItem.azimuth"
                @update:modelValue="onPVGISRequest"
                :loading="isFetchingPVGIS"
              />
            </VCardText>
          </VCard>
        </VCol>
        <VCol
          cols="6"
          xl="3"
          lg="4"
        >
          <VCard>
            <VCardTitle>
              <h2 class="text-body-1 font-weight-bold text-center text-primary">
                <VIcon
                  icon="tabler:angle"
                  class="me-1"
                  size="large"
                  color="primary"
                />
                Angle
              </h2>
            </VCardTitle>
            <VCardText class="pt-3">
              <VSelect
                class="field-configuration__select justify-center"
                :items="azimuthItems"
                variant="filled"
                v-model="currentSimulationItem.inclinaison"
                @update:modelValue="onPVGISRequest"
                :loading="isFetchingPVGIS"
              />
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
      <div class="d-flex justify-center mt-12">
        <VBtn
          @click.prevent="onAddSimulationItem"
          :text="isPersistingSimulationItem ? 'Enregistrement' : 'Ajouter'"
          color="info"
          variant="elevated"
          :prepend-icon="isPersistingSimulationItem ? 'loading-loop' : 'fluent:folder-add-16-filled'"
          :loading="isPersistingSimulationItem"
          size="large"
        />
      </div>
      <VSlideYTransition mode="out-in">
        <VRow
          v-if="currentSimulationItem.energyPotential"
          align="center"
          justify="center"
          class="mt-7 mb-5"
        >
          <VCol
            cols="9"
            lg="4"
          >
            <VAlert
              color="primary"
              variant="elevated"
              elevation="8"
            >
              <VRow>
                <VCol
                  class="d-flex align-center justify-center"
                  cols="3"
                >
                  <VIcon
                    icon="line-md:sun-rising-twotone-loop"
                    size="54"
                  />
                </VCol>
                <VCol cols="9">
                  <div class="d-flex flex-column align-center justify-center">
                    <span class="text-overline text-white"> Votre coefficient énergétique estimé</span>
                    <span class="text-center text-white font-weight-bold text-h4 mt-5">
                      {{ currentSimulationItem.energyPotential }}
                    </span>
                    <span class="text-body-2 font-italic mt-3 mb-2 text-center text-white">
                      {{ getCalculatedPotentialFromRatio() }}
                    </span>
                  </div>
                </VCol>
              </VRow>
              <VRow>
                <VCol
                  cols="12"
                  class="d-flex align-center justify-space-between"
                >
                  <span class="text-caption font-italic text-left">Données extraites de PVGIS</span>
                  <VBtn
                    class="text-caption text-right"
                    variant="outlined"
                    prepend-icon="material-symbols:calendar-month-outline"
                  >
                    Voir la répartition
                    <VMenu
                      v-model="isShowDetailedPotential"
                      activator="parent"
                      :close-on-content-click="false"
                    >
                      <VCard>
                        <VCardItem>
                          <VTable>
                            <thead>
                              <tr>
                                <th class="text-left">Mois</th>
                                <th class="text-left">Proportion</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr
                                v-for="item in detailsPotentialByMonthAndPercent"
                                :key="item.month"
                              >
                                <td>{{ capitalizeFirstLetter(item.month) }}</td>
                                <td>{{ getNumberFormat(item.percentage, 0, 2) + '%' }}</td>
                              </tr>
                            </tbody>
                          </VTable>
                        </VCardItem>
                      </VCard>
                    </VMenu>
                  </VBtn>
                </VCol>
              </VRow>
            </VAlert>
          </VCol>
        </VRow>
      </VSlideYTransition>
    </VForm>
  </VContainer>
</template>

<style scoped lang="scss">
:deep(.field-nbPanel__input .v-field input) {
  color: rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity)) !important;
  text-align: center !important;
  font-size: 1.8rem !important;
}

:deep(.field-configuration__select .v-field__input) {
  color: rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity)) !important;
  font-size: 1.4rem !important;
  justify-content: center !important;
  font-weight: 700;
}

.card-pdl__selected {
  color: rgb(var(--v-theme-on-primary)) !important;
}
</style>
