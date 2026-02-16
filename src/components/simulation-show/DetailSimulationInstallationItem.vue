<script setup lang="ts">
import { getNumberFormat } from '@/utils/numberUtils'
import { BuildingData } from '@domain/types/simulation'

interface Props {
  simulationItems: object
  buildings: BuildingData[]
}

function getRoofOrientationNameOldSystem(direction: number | string): string {
  const RoofOrientation = {
    '0': 'Nord',
    '45': 'Nord-Est',
    '90': 'Est',
    '135': 'Sud-Est',
    '180': 'Sud',
    '225': 'Sud-Ouest',
    '270': 'Ouest',
    '315': 'Nord-Ouest',
  }

  return RoofOrientation[direction]
}

const props = defineProps<Props>()

const simulationItems = ref([])

onMounted(() => {
  if (props.simulationItems) {
    simulationItems.value = props.simulationItems.sort((a, b) => {
      if (a.pdl && b.pdl) {
        return a.pdl.pdlNumber > b.pdl.pdlNumber ? 1 : b.pdl.pdlNumber > a.pdl.pdlNumber ? -1 : 0
      }
    })
  }
})
</script>

<template>
  <template v-if="buildings.length <= 0">
    <VRow
      v-for="(item, id) in props.simulationItems"
      :key="id"
      justify="center"
      align="center"
    >
      <VCol
        cols="9"
        class="text-left"
      >
        <template v-if="!(id === 0 ? false : props.simulationItems[id - 1].pdl.pdlNumber === item.pdl.pdlNumber)">
          <VDivider
            v-if="id !== 0"
            class="pb-3"
            :thickness="12"
            color="primary"
          />
          <ProspetPDL
            :pdl="item.pdl"
            title="Relatif au PDL "
          />
        </template>
        <VCard
          class="bg-var-theme-background elevation-8"
          :border="true"
        >
          <VCardTitle>
            <span class="text-primary font-weight-bold text-h5">{{ item.nbPanel }}</span>
            <span>&nbsp;panneaux</span>
          </VCardTitle>
          <VCardText>
            <VList
              class="background-transparent"
              density="compact"
            >
              <VListItem>
                <template #prepend>
                  <VIcon icon="ph:compass-bold" />
                </template>
                <span class="font-weight-thin font-italic me-1">Orientation : </span>
                <span class="text-body-1 text-medium-emphasis">
                  {{
                    item.zone
                      ? `${getRoofOrientationNameOldSystem(item.zone.roofOrientation)} (${item.zone.roofOrientation}°)`
                      : 'Non renseignée'
                  }}
                </span>
              </VListItem>

              <VListItem>
                <template #prepend>
                  <VIcon icon="tabler:angle" />
                </template>
                <span class="font-weight-thin font-italic me-1">Inclinaison : </span>
                <span class="text-body-1 text-medium-emphasis">
                  {{ item.zone ? `${item.zone.panelTilt}°` : 'Non renseignée' }}
                </span>
              </VListItem>

              <VListItem>
                <template #prepend>
                  <VIcon icon="solar:streets-map-point-broken" />
                </template>
                <span class="font-weight-thin font-italic me-1">Département : </span>
                <span class="text-body-1 text-medium-emphasis">
                  {{ item.zone ? item.zone.department : 'Non renseigné' }}
                </span>
              </VListItem>

              <VListItem>
                <template #prepend>
                  <VIcon icon="material-symbols:solar-power-outline" />
                </template>
                <span class="font-weight-thin font-italic me-1">Potentiel énergétique : </span>
                <span class="text-body-1 text-medium-emphasis text-primary font-weight-bold">
                  {{ item.energyPotential ? getNumberFormat(item.energyPotential, 0, 0) : 'Non renseigné' }}
                </span>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </template>
  <template v-else>
    <VRow
      justify="center"
      align="center"
    >
      <VCol
        v-for="(building, id) in props.buildings"
        :key="id"
        cols="12"
        lg="9"
      >
        <ProspetBuilding :building="building" />
      </VCol>
    </VRow>
  </template>
</template>
