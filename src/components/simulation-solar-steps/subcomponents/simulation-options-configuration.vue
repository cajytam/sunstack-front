<script setup lang="ts">
import { useSimulationStore } from '@/stores/simulation'
import { updateSimulationOptions } from '@/services/simulationOptionsService'
import { deleteSimulationItemData } from '@/services/simulationItemService'

const simulationStore = useSimulationStore()
const { erasePrices, eraseManualPrice } = simulationStore
const { simulationOptionsStored, buildings } = storeToRefs(simulationStore)

const isEditMode = ref([])
const updateData = data => {
  const storedData = simulationOptionsStored.value.find(el => el.id === data.id)
  Object.keys(data).forEach(key => {
    storedData[key] = data[key]
  })

  updateSimulationOptions(data.id, JSON.parse(JSON.stringify(storedData)))
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)
      erasePrices()
    })
    .catch(err => console.error(err))

  isEditMode.value[data.id] = false
}

const getBuildingInfo = buildingId => {
  const buildingInfo = buildings.value.filter(building => buildingId === building.id)
  if (buildingInfo.length <= 0) return ''
  return `${buildingInfo[0].name} - ${buildingInfo[0].pdlNumber}`
}

const getSimulationItems = buildingId => {
  const building = buildings.value.filter(building => buildingId === building.id)
  if (building.length <= 0) return []
  return building[0].simulationItems
}

const onDeleteSimulationItems = (simulationItemId, buildingId) => {
  deleteSimulationItemData(simulationItemId)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      eraseManualPrice()
      erasePrices()

      // delete the simulation items from the store
      const simulationItems = getSimulationItems(buildingId)
      simulationItems.forEach((item, index) => {
        if (item.id === simulationItemId) {
          simulationItems.splice(index, 1)
        }
      })
    })
    .catch(err => console.error(err))
}

const getNumberPanels = (buildingId: number): number => {
  let nbPanels = 0
  const items = getSimulationItems(buildingId)
  items.forEach(item => {
    nbPanels += item.nbPanel
  })
  return nbPanels
}

const isCompletedBuilding = computed(() => {
  let nbRoofSections = 0
  let totalSectionFilled = 0

  simulationOptionsStored.value.forEach(option => {
    if (option.installationLocation === 'S') {
      nbRoofSections += 1
    } else {
      nbRoofSections += parseInt(option.nbRoofSection, 10)
    }

    const items = getSimulationItems(option.building)
    totalSectionFilled += items.length
  })

  return nbRoofSections <= totalSectionFilled
})
</script>

<template>
  <VContainer class="mb-8">
    <VRow
      align="center"
      justify="center"
    >
      <VExpansionPanels multiple>
        <TransitionGroup name="transition-slide-x">
          <VExpansionPanel
            v-for="simulationOption in simulationOptionsStored"
            :key="simulationOption.building"
            class="border border-primary my-3 pb-5"
          >
            <VExpansionPanelTitle class="bg-primary">
              <VRow
                align="center"
                justify="space-between"
                class="mx-3"
              >
                <span class="text-h6 text-white">
                  {{ getBuildingInfo(simulationOption.building) }}
                </span>
                <span
                  v-if="getSimulationItems(simulationOption.building)?.length > 0"
                  class="text-h6 text-white"
                >
                  <VIcon
                    class="me-2"
                    icon="fa-solid:solar-panel"
                  />
                  {{ `${getNumberPanels(simulationOption.building)} panneaux` }}
                </span>
              </VRow>
            </VExpansionPanelTitle>
            <VExpansionPanelText class="my-5">
              <VScrollYTransition mode="out-in">
                <template v-if="isEditMode[simulationOption.id]">
                  <ManageSimulationOptions
                    :id-simulation-options="simulationOption.id"
                    @send-updated-data="e => updateData(e)"
                  />
                </template>
                <template v-else>
                  <div class="mx-12">
                    <SimulationOptionsSummary :simulation-options="simulationOption" />
                    <VRow
                      align="center"
                      justify="center"
                    >
                      <VBtn
                        v-model="isEditMode[simulationOption.id]"
                        @click="isEditMode[simulationOption.id] = true"
                        text="Modifier"
                        color="secondary"
                        prepend-icon="nimbus:edit"
                        class="mt-12"
                      />
                      <VContainer v-if="getSimulationItems(simulationOption.building)?.length > 0">
                        <VDivider class="mt-8 mb-5 mx-15" />
                        <VRow
                          align="stretch"
                          justify="start"
                        >
                          <VCol
                            v-for="simulationItems in getSimulationItems(simulationOption.building)"
                            cols="12"
                            lg="4"
                          >
                            <SimulationPanelCard
                              :simulation-options-item="simulationItems"
                              @delete:simulationItem="e => onDeleteSimulationItems(e, simulationOption.building)"
                            />
                          </VCol>
                        </VRow>
                      </VContainer>
                    </VRow>
                  </div>
                </template>
              </VScrollYTransition>
            </VExpansionPanelText>
          </VExpansionPanel>
        </TransitionGroup>
      </VExpansionPanels>
    </VRow>
    <VDialogTransition mode="out-in">
      <ManageConfigurationPanels
        v-if="!isCompletedBuilding"
        class="mt-8"
      />
    </VDialogTransition>
  </VContainer>
</template>
