<script setup lang="ts">
import { useSimulationStore } from '@/stores/simulation'
import { patchBuildingData, postBuildingData, removeBuildingData } from '@/services/buildingService'
import { removeSimulationOptions } from '@/services/simulationOptionsService'

const simulationStore = useSimulationStore()
const { buildings, simulationOptionsStored } = storeToRefs(simulationStore)
const { nextStep, previousStep, simulationUri } = simulationStore

const onClickNext = async () => {
  await postBuilding()
  nextStep()
}

const postBuilding = async () => {
  const promises = buildings.value.map(async building => {
    if (!building.id) {
      const res = await postBuildingData(building)
      if (process.env.NODE_ENV === 'development') console.log(res)
      building.id = res.data.id
    } else {
      const res = await patchBuildingData(building, building.id)
      if (process.env.NODE_ENV === 'development') console.log(res)
    }
  })

  await Promise.all(promises)
}

const addBuilding = () => {
  buildings.value.push({
    simulation: simulationUri,
    idBuilding: buildings.value.length + 1,
    name: null,
    pdlNumber: null,
    isCustomerCertifiesOwnership: null,
    isAgreementBareOwner: null,
    simulationItems: [],
  })
}

onMounted(() => {
  if (buildings.value.length === 0) {
    buildings.value.push({
      simulation: simulationUri,
      idBuilding: 1,
      name: null,
      pdlNumber: null,
      isCustomerCertifiesOwnership: null,
      isAgreementBareOwner: null,
      simulationItems: [],
    })
  }
})

const onBuildingDataChanged = newBuildingData => {
  buildings.value.forEach(building => {
    if (building.idBuilding === newBuildingData.idBuilding) {
      building.name = newBuildingData.name
      building.pdlNumber = newBuildingData.pdlNumber?.replaceAll(' ', '')
      building.isCustomerCertifiesOwnership = newBuildingData.isCustomerCertifiesOwnership
      building.isAgreementBareOwner = newBuildingData.isAgreementBareOwner
    }
  })
}

const isAlertItemsForBuilding = ref(false)

const onDeleteBuilding = async idBuilding => {
  const buildingToRemove = buildings.value.find(building => building.idBuilding === idBuilding)

  if (buildingToRemove) {
    if (buildingToRemove.simulationItems.length > 0) {
      isAlertItemsForBuilding.value = true
      return
    }

    if (buildingToRemove?.id) {
      const simulationOptionsToRemove = simulationOptionsStored.value.find(
        options => options.building === buildingToRemove.id,
      )
      try {
        if (simulationOptionsToRemove && simulationOptionsToRemove?.id) {
          const res = await removeSimulationOptions(simulationOptionsToRemove.id)
          if (process.env.NODE_ENV === 'development') console.log(res)
        }

        const res = await removeBuildingData(buildingToRemove.id)
        if (process.env.NODE_ENV === 'development') console.log(res)
      } catch (err) {
        console.error(err)
      }
    }
    buildings.value = buildings.value.filter(building => building.idBuilding !== idBuilding)
  }
}
</script>

<template>
  <div>
    <VRow
      align="center"
      justify="center"
    >
      <VCol cols="12">
        <div class="d-flex justify-center align-center mb-5">
          <VIcon
            color="primary"
            icon="ph:solar-roof-duotone"
            size="x-large"
            class="me-2 text-h3"
          />
          <span class="text-h5 font-weight-bold">Gérer les bâtiments</span>
        </div>
        <TransitionGroup name="building-fade">
          <template
            v-for="building in buildings"
            :key="building.idBuilding"
          >
            <BuildingManagement
              :building="building"
              :id-building="building.idBuilding"
              @building-data-changed="onBuildingDataChanged"
              @delete-building="idBuilding => onDeleteBuilding(idBuilding)"
            />
          </template>
        </TransitionGroup>
      </VCol>
      <VCol cols="6">
        <VBtn
          text="Ajouter un bâtiment"
          prepend-icon="carbon:add-filled"
          color="primary"
          variant="text"
          @click="addBuilding"
        />
      </VCol>
    </VRow>
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
        @click.prevent="onClickNext"
      />
    </VRow>
    <VSnackbar
      :timeout="5000"
      color="error"
      v-model="isAlertItemsForBuilding"
    >
      <h3 class="text-h6 text-white font-weight-bold mb-2">Suppression impossible</h3>
      Merci de supprimer les configurations de panneaux faites sur ce batîment au préalable
    </VSnackbar>
  </div>
</template>
<style scoped lang="scss">
.building-fade-enter-active,
.building-fade-leave-active {
  transition: all 0.5s ease;
}

.building-fade-enter-from,
.building-fade-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>
