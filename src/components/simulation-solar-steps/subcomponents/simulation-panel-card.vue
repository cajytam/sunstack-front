<script setup lang="ts">
import { getRoofOrientationName } from '@/utils/panelUtils'
import { getNumberFormat } from '@/utils/numberUtils'
import type { SimulationItem } from '@domain/types/simulation'

type Props = {
  simulationOptionsItem: SimulationItem
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'delete:simulationItem', value: number): void
}>()

const onDeleteSimulationItem = simulationItemId => {
  emit('delete:simulationItem', simulationItemId)
}
</script>

<template>
  <VCard
    border
    class="fill-height simulation-item-card"
  >
    <VBtn
      @click="onDeleteSimulationItem(simulationOptionsItem.id)"
      class="btn-simulation-item-delete"
      color="error"
    >
      <VIcon icon="material-symbols:delete" />
    </VBtn>
    <div class="bg-primary text-center text-white py-2 px-3 text-h5">
      {{ `${simulationOptionsItem.nbPanel} panneau${simulationOptionsItem.nbPanel > 1 ? 'x' : ''}` }}
    </div>
    <VCardText>
      <VList
        class="background-transparent"
        density="compact"
      >
        <VListItem>
          <span class="font-weight-thin font-italic me-1">Orientation : </span>
          <span class="text-body-1 text-medium-emphasis">
            {{
              getRoofOrientationName(simulationOptionsItem.azimuth)
                ? `${getRoofOrientationName(simulationOptionsItem.azimuth)} (${simulationOptionsItem.azimuth}°)`
                : 'Non renseignée'
            }}
          </span>
          <template v-slot:prepend>
            <VIcon icon="ph:compass-bold" />
          </template>
        </VListItem>

        <VListItem>
          <span class="font-weight-thin font-italic me-1">Inclinaison : </span>
          <span class="text-body-1 text-medium-emphasis">
            {{ simulationOptionsItem.inclinaison ? `${simulationOptionsItem.inclinaison}°` : 'Non renseignée' }}
          </span>
          <template v-slot:prepend>
            <VIcon icon="tabler:angle" />
          </template>
        </VListItem>

        <VListItem>
          <span class="font-weight-thin font-italic me-1">Potentiel énergétique : </span>
          <span class="text-body-1 text-medium-emphasis text-primary font-weight-bold">
            {{
              simulationOptionsItem.energyPotential
                ? getNumberFormat(simulationOptionsItem.energyPotential, 0, 0)
                : 'Non renseigné'
            }}
          </span>
          <template v-slot:prepend>
            <VIcon icon="material-symbols:solar-power-outline" />
          </template>
        </VListItem>
      </VList>
    </VCardText>
  </VCard>
</template>

<style scoped lang="scss">
.btn-simulation-item-delete {
  position: absolute;
  z-index: 1;
  inset-block-start: 0.2rem;
  inset-inline-end: 1rem;
  opacity: 0;
  transition: all 0.1s ease;
}

.simulation-item-card:hover {
  & .btn-simulation-item-delete {
    opacity: 1;
  }
}
</style>
