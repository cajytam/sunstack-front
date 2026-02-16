<script setup lang="ts">
import { getRoofOrientationName } from '@/utils/panelUtils'
import { getNumberFormat } from '@/utils/numberUtils'

const props = defineProps({
  installation: { type: Object, required: true },
})
</script>

<template>
  <VCard
    class="bg-var-theme-background mt-3 mb-7 mx-5 pa-3"
    elevation="8"
  >
    <VCardTitle class="pb-2">
      <span class="text-h5 font-weight-bold text-primary">
        {{ props.installation.nbPanel }}
      </span>
      <span class="text-body-1"> panneaux </span>
      <template v-if="props.installation.energyPotential">
        <span> avec un potentiel énergétique de </span>
        <span class="text-primary font-weight-bold">
          {{ getNumberFormat(props.installation.energyPotential, 0, 0) }}
        </span>
      </template>
      <span v-else>
        <span> (potentiel énergétique non renseigné) </span>
      </span>
    </VCardTitle>
    <VCardText>
      <VList
        class="ml-5 background-transparent"
        density="compact"
      >
        <VListItem>
          <span class="font-weight-thin font-italic me-1">Département : </span>
          <span class="text-body-1 text-medium-emphasis">
            {{ props.installation && props.installation.zone ? props.installation.zone.department : 'Non renseigné' }}
          </span>
          <template #prepend>
            <VIcon icon="solar:streets-map-point-broken" />
          </template>
        </VListItem>

        <VListItem>
          <span class="font-weight-thin font-italic me-1">Orientation : </span>
          <span class="text-body-1 text-medium-emphasis">
            {{
              props.installation && props.installation.zone
                ? `${getRoofOrientationName(props.installation.zone.roofOrientation)} (${props.installation.zone.roofOrientation}°)`
                : 'Non renseigné'
            }}
          </span>
          <template #prepend>
            <VIcon icon="ph:compass-bold" />
          </template>
        </VListItem>

        <VListItem>
          <span class="font-weight-thin font-italic me-1">Inclinaison : </span>
          <span class="text-body-1 text-medium-emphasis">
            {{
              props.installation && props.installation.zone ? `${props.installation.zone.panelTilt}°` : 'Non renseigné'
            }}
          </span>
          <template #prepend>
            <VIcon icon="tabler:angle" />
          </template>
        </VListItem>
      </VList>
    </VCardText>
  </VCard>
</template>

<style scoped lang="scss"></style>
