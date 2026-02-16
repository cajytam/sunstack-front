<script setup lang="ts">
import { getNumberFormat } from '@/utils/numberUtils'

interface IInverterData {
  brand: string
  model: string
  power: number
  nb: number
}

interface IProps {
  inverterData: IInverterData
}

const props = defineProps<IProps>()
</script>

<template>
  <VCard
    border
    class="card-inverter"
  >
    <VCardTitle class="d-flex justify-space-between align-center card-inverter__title py-2 px-5">
      <div>
        <span class="text-h6 font-weight-bold card-inverter__font-color"> {{ props.inverterData.brand }} </span
        >&nbsp;<span class="card-inverter__font-color">
          {{ props.inverterData.model }}
        </span>
      </div>
      <div class="d-flex align-center gap-x-2">
        <span class="card-inverter__font-color text-body-1 text-decoration-underline">Quantité :</span
        ><span class="card-inverter__font-color">{{ props.inverterData.nb }}</span>
      </div>
    </VCardTitle>
    <VCardText>
      <VList>
        <VListItem>
          <div class="d-flex align-center justify-space-between">
            <span class="text-body-1 font-italic">Puissance par onduleur :</span>
            <span class="text-h6 font-weight-bold">{{ getNumberFormat(props.inverterData.power, 0) }} kW</span>
          </div>
          <div class="d-flex align-center justify-space-between">
            <span class="text-body-1 font-italic">Type d'onduleur :</span>
            <span class="text-h6 font-weight-bold">{{ props.inverterData.type === 'H' ? 'Hybride' : 'Réseau' }}</span>
          </div>
          <div class="d-flex align-center justify-space-between">
            <span class="text-body-1 font-italic">Nombre MPPT :</span>
            <span class="text-h6 font-weight-bold">{{ props.inverterData.mppt.nb ?? '-' }}</span>
          </div>
          <div class="d-flex align-center justify-space-between">
            <span class="text-body-1 font-italic">String par MPPT :</span>
            <span class="text-h6 font-weight-bold">{{ props.inverterData.mppt.nb_string ?? '-' }}</span>
          </div>
        </VListItem>
      </VList>
    </VCardText>
  </VCard>
</template>

<style scoped lang="scss">
.card-inverter {
  border: 1px solid rgb(var(--v-theme-primary));
}

.card-inverter__title {
  background-color: rgb(var(--v-theme-primary));
}

.card-inverter__font-color {
  color: rgb(var(--v-theme-on-primary)) !important;
}
</style>
