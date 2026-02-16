<script setup lang="ts">
import { getNumberFormat } from '@/utils/numberUtils'
import { BuildingData } from '@domain/types/simulation'

interface Props {
  simulationItems: object
  totalPanel: number | null
  panel: object | null
  totalPower: number | null
  installationLocation: 'T' | 'S' | null
  buildings: BuildingData[]
}

const props = defineProps<Props>()
</script>

<template>
  <div
    v-if="props.installationLocation"
    class="d-flex justify-space-between align-center"
  >
    <h6 class="text-body-1 text-secondary font-weight-bold text-uppercase">Emplacement</h6>
    <h6 class="font-weight-bold text-h6 text-primary">
      {{ props.installationLocation === 'T' ? 'Toit' : 'Sol' }}
    </h6>
  </div>
  <div class="d-flex justify-space-between align-center my-1">
    <h6 class="text-h6 font-weight-bold text-uppercase">Nombre total de panneaux</h6>
    <h6 class="font-weight-bold text-h4 text-primary">
      {{ totalPanel ? getNumberFormat(totalPanel, 0, 0) : '-' }}
    </h6>
  </div>
  <div class="d-flex justify-space-between align-center">
    <h6 class="text-body-1 text-secondary font-weight-bold text-uppercase">Modèle</h6>
    <h6 class="font-weight-bold text-h6 text-primary">
      {{ props.panel ? props.panel.model : '-' }}
    </h6>
  </div>
  <div class="d-flex justify-space-between align-center">
    <h6 class="text-body-1 text-secondary font-weight-bold text-uppercase">Puissance unitaire</h6>
    <div class="d-flex flex-column align-end">
      <h6 class="font-weight-bold text-h6 text-primary">
        {{ props.panel ? `${props.panel.power} Wc` : '-' }}
      </h6>
      <span class="text-caption">
        <span class="font-italic">Soit une puissance totale de </span>
        <span class="font-weight-bold"> {{ getNumberFormat(props.totalPower) }} kWc </span>
      </span>
    </div>
  </div>

  <VDivider class="mt-2 mb-8 mx-3" />

  <DetailSimulationInstallationItem
    :simulation-items="props.simulationItems"
    :buildings="props.buildings"
  />
</template>

<style scoped lang="scss"></style>
