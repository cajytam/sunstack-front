<script setup lang="ts">
import { useSimulationStore } from '@/stores/simulation'

const route = useRoute()
const simulationIdentifier = route.params.simulationIdentifier !== 'new' ? route.params.simulationIdentifier : null

const simulationStore = useSimulationStore()
const { nextStep, previousStep } = simulationStore
const { buildings, simulationOptionsStored } = storeToRefs(simulationStore)

const currentBuildingIndex = ref(0)

const processNextBuilding = () => {
  currentBuildingIndex.value++
}

const getSimulationItems = buildingId => {
  const building = buildings.value.filter(building => buildingId === building.id)
  if (building.length <= 0) return []
  return building[0].simulationItems
}

const isCompletedBuilding = computed(() => {
  let nbRoofSections = 0
  let totalSectionFilled = 0

  simulationOptionsStored.value.forEach(option => {
    if (option.installationLocation !== 'T') {
      nbRoofSections = 1
    } else {
      nbRoofSections += parseInt(option.nbRoofSection, 10)
    }

    const items = getSimulationItems(option.building)
    totalSectionFilled += items.length
  })

  return nbRoofSections <= totalSectionFilled
})

onMounted(() => {
  if (simulationIdentifier && simulationOptionsStored.value.length > 0) {
    currentBuildingIndex.value = simulationOptionsStored.value.length
  }
})
</script>

<template>
  <VContainer>
    <div v-if="currentBuildingIndex < buildings.length">
      <SimulationOptionsBuilding :building="buildings[currentBuildingIndex]" />
      <ManageSimulationOptions
        :building-id="buildings[currentBuildingIndex].id"
        @is-completed="
          e => {
            if (e) processNextBuilding()
          }
        "
      />
    </div>
    <div v-if="simulationOptionsStored.length > 0">
      <SimulationOptionsConfiguration />
    </div>
    <VRow
      class="mt-15 gap-x-8"
      align-content="center"
      justify="center"
    >
      <VBtn
        color="snackbar-background"
        variant="tonal"
        prepend-icon="ion:arrow-back"
        text="Précédent"
        @click.prevent="previousStep"
      />
      <VBtn
        append-icon="ion:arrow-forward"
        text="Suivant"
        :disabled="!isCompletedBuilding"
        @click.prevent="nextStep"
      />
    </VRow>
  </VContainer>
</template>
