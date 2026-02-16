<script setup lang="ts">
import type { BuildingData } from '@domain/types/simulation'
import { getRoofOrientationName } from '@/utils/panelUtils'
import {
  optionsAjoutBatterie,
  optionsAjoutBorne,
  optionsAmiante,
  optionsImplantation,
  optionsPhase,
  typeRoof,
} from '@/services/simulationOptionsService'
import { listMois } from '@/utils/dateUtils'
import { capitalizeFirstLetter } from '@/utils/stringUtils'
import { getNumberFormat } from '@/utils/numberUtils'

type Props = {
  building: BuildingData
}
const props = defineProps<Props>()

const getDetailedPotentialByMonth = detailedEnergyPotential => {
  if (detailedEnergyPotential) {
    const total = Object.values(detailedEnergyPotential).reduce((sum, value) => sum + value, 0)
    return Object.entries(detailedEnergyPotential).map(([month, value]) => ({
      month: listMois[parseInt(month, 10) - 1],
      percentage: parseFloat(((value / total) * 100).toFixed(2)),
    }))
  }
}

const isShowDetailedPotential = ref([])

const getTotalPanelsOfBuidling = simulationItems => {
  let total = 0
  simulationItems.forEach(item => {
    total += item.nbPanel
  })
  return total
}
</script>

<template>
  <VCard>
    <VCardTitle class="text-h4 bg-primary-500 text-white py-5 d-flex justify-space-between align-center">
      <span v-html="props.building.name || '<i>Aucun nom renseigné</i>'"></span>
      <VChip size="large">
        <template v-slot:prepend>
          <VIcon
            class="me-2"
            size="x-large"
            icon="hugeicons:solar-panel-02"
          />
        </template>
        <span class="text-body-1 text-white">
          {{ `${getTotalPanelsOfBuidling(props.building.simulationItems)} panneaux` }}</span
        >
      </VChip>
    </VCardTitle>
    <VCardText v-if="props.building.isCustomerCertifiesOwnership || props.building.isAgreementBareOwner">
      <VAlert
        :icon="props.building.isCustomerCertifiesOwnership ? 'ic:baseline-key' : 'ph:signature-bold'"
        prominent
        border="start"
        :color="props.building.isCustomerCertifiesOwnership ? 'info' : 'warning'"
        variant="tonal"
        density="compact"
        class="text-wrap mt-3"
      >
        <span class="d-flex justify-start font-weight-bold">
          {{
            props.building.isCustomerCertifiesOwnership
              ? 'Le prospect atteste être légalement propriétaire de l’Immeuble.'
              : 'Le prospect atteste être locataire de l’Immeuble et bénéficier d’une autorisation écrite du propriétaire.'
          }}
        </span>
      </VAlert>
    </VCardText>
    <VCardText
      v-if="props.building.pdlNumber"
      class="d-flex flex-row align-center justify-center"
    >
      <VIcon
        class="me-2"
        icon="carbon:meter-alt"
        color="primary"
        :size="36"
      />
      <div class="text-h5">
        <span>PDL : </span>
        <span class="text-primary font-weight-bold mx-2">
          {{ props.building.pdlNumber }}
        </span>
      </div>
    </VCardText>
    <VCardText class="text-left">
      <h3
        v-if="props.building.simulationOptions.length <= 0"
        class="text-caption font-italic text-center my-3"
      >
        Rien n'a été renseigné
      </h3>
      <div
        v-else
        class="d-flex flex-row"
      >
        <VList class="w-100">
          <div class="d-flex align-center justify-space-between ma-2 border-b py-2 border-opacity-25">
            <div>
              <VIcon
                class="me-2"
                icon="bi:plug"
              />
              <span class="font-weight-thin font-italic me-1">Type de phase</span>
            </div>
            <span class="text-body-1 text-medium-emphasis">{{
              props.building.simulationOptions[0].phaseType
                ? optionsPhase.find(implantation => implantation.key === props.building.simulationOptions[0].phaseType)
                    .title
                : '-'
            }}</span>
          </div>

          <div class="d-flex align-center justify-space-between ma-2 border-b py-2 border-opacity-25">
            <div class="d-flex align-center">
              <VIcon
                class="me-2"
                icon="icon-park-twotone:car-battery"
              />
              <span class="font-weight-thin font-italic me-1">Ajout de batterie</span>
            </div>
            <span class="text-body-1 text-medium-emphasis">{{
              props.building.simulationOptions[0].addBattery
                ? optionsAjoutBatterie.find(
                    implantation => implantation.key === props.building.simulationOptions[0].addBattery,
                  ).title
                : '-'
            }}</span>
          </div>

          <div class="d-flex align-center justify-space-between ma-2 border-b py-2 border-opacity-25">
            <div class="d-flex align-center">
              <VIcon
                class="me-2"
                icon="cbi:charging-station"
              />
              <span class="font-weight-thin font-italic me-1">Ajout de borne</span>
            </div>
            <span class="text-body-1 text-medium-emphasis">{{
              props.building.simulationOptions[0].addChargingPoint
                ? optionsAjoutBorne.find(
                    implantation => implantation.key === props.building.simulationOptions[0].addChargingPoint,
                  ).title
                : '-'
            }}</span>
          </div>

          <div class="d-flex align-center justify-space-between ma-2 border-b py-2 border-opacity-25">
            <div class="d-flex align-center">
              <VIcon
                class="me-2"
                icon="dashicons:location-alt"
              />
              <span class="font-weight-thin font-italic me-1">Implantation</span>
            </div>
            <span class="text-body-1 text-medium-emphasis">{{
              props.building.simulationOptions[0].installationLocation
                ? optionsImplantation.find(
                    implantation => implantation.key === props.building.simulationOptions[0].installationLocation,
                  ).title
                : '-'
            }}</span>
          </div>

          <div class="d-flex align-center justify-space-between ma-2 border-b py-2 border-opacity-25">
            <div class="d-flex align-center">
              <VIcon
                class="me-2"
                icon="mdi:home-roof"
              />
              <span class="font-weight-thin font-italic me-1">Type de toiture</span>
            </div>
            <span class="text-body-1 text-medium-emphasis">{{
              props.building.simulationOptions[0].roofType
                ? typeRoof.find(implantation => implantation.key === props.building.simulationOptions[0].roofType).title
                : '-'
            }}</span>
          </div>
        </VList>

        <VList class="w-100">
          <div class="d-flex align-center justify-space-between ma-2 border-b py-2 border-opacity-25">
            <div class="d-flex align-center">
              <VIcon
                class="me-2"
                icon="ph:steps-fill"
              />
              <span class="font-weight-thin font-italic me-1">Nb niveaux</span>
            </div>
            <span class="text-body-1 text-medium-emphasis">{{ props.building.simulationOptions[0].nbLevel }}</span>
          </div>

          <div class="d-flex align-center justify-space-between ma-2 border-b py-2 border-opacity-25">
            <div class="d-flex align-center">
              <VIcon
                class="me-2"
                icon="fluent-emoji-high-contrast:rock"
              />
              <span class="font-weight-thin font-italic me-1">Amiante</span>
            </div>
            <span class="text-body-1 text-medium-emphasis">
              {{
                props.building.simulationOptions[0].asbestosRoof
                  ? optionsAmiante.find(
                      implantation => implantation.key === props.building.simulationOptions[0].asbestosRoof,
                    ).title
                  : '-'
              }}
            </span>
          </div>

          <div class="d-flex align-center justify-space-between ma-2 border-b py-2 border-opacity-25">
            <div class="d-flex align-center">
              <VIcon
                class="me-2"
                icon="material-symbols:roofing"
              />
              <span class="font-weight-thin font-italic me-1">Pans de toit</span>
            </div>
            <span class="text-body-1 text-medium-emphasis">
              {{ props.building.simulationOptions[0].nbRoofSection }}
            </span>
          </div>

          <div class="d-flex align-center justify-space-between ma-2 border-b py-2 border-opacity-25">
            <div class="d-flex align-center">
              <VIcon
                class="me-2"
                icon="pepicons-pencil:people"
              />
              <span class="font-weight-thin font-italic me-1">ERP</span>
            </div>
            <span class="text-body-1 text-medium-emphasis">{{
              props.building.simulationOptions[0].isErpBuilding ? 'Oui' : 'Non'
            }}</span>
          </div>
        </VList>
      </div>
    </VCardText>
    <VCardItem class="pt-5">
      <VRow
        align="center"
        justify="center"
      >
        <VCol
          v-for="items in props.building.simulationItems"
          cols="9"
        >
          <VCard class="text-left border card-items elevation-10">
            <VCardTitle class="d-flex align-items-center justify-center bg-primary py-1 px-4">
              <div class="d-flex align-items-center">
                <VIcon
                  icon="hugeicons:solar-panel-01"
                  size="46"
                  class="me-2"
                />
              </div>
              <div class="text-center flex-grow-1">
                <span class="text-white font-weight-bold text-h4 me-2">{{ items.nbPanel }}</span>
                <span>&nbsp;panneaux</span>
              </div>
            </VCardTitle>
            <VCardText class="pb-2">
              <VList density="compact">
                <VListItem class="pl-1">
                  <template #prepend>
                    <VIcon icon="ph:compass-bold" />
                  </template>
                  <span class="font-weight-thin font-italic me-1">Orientation : </span>
                  <span class="text-body-1 text-medium-emphasis">
                    {{
                      items.azimuth !== null
                        ? `${getRoofOrientationName(items.azimuth)} (${items.azimuth}°)`
                        : 'Non renseigné'
                    }}
                  </span>
                </VListItem>

                <VListItem class="pl-1">
                  <template #prepend>
                    <VIcon icon="tabler:angle" />
                  </template>
                  <span class="font-weight-thin font-italic me-1">Inclinaison : </span>
                  <span class="text-body-1 text-medium-emphasis">
                    {{ items.inclinaison ? `${items.inclinaison}°` : 'Non renseigné' }}
                  </span>
                </VListItem>

                <VListItem class="pl-1">
                  <template #prepend>
                    <VIcon icon="material-symbols:solar-power-outline" />
                  </template>
                  <span class="font-weight-thin font-italic me-1">Potentiel énergétique : </span>
                  <span class="text-body-1 text-medium-emphasis text-primary font-weight-bold">
                    {{ items.energyPotential || 'Non renseigné' }}
                  </span>
                  <VMenu
                    v-model="isShowDetailedPotential[items.id]"
                    :close-on-content-click="false"
                  >
                    <template v-slot:activator="{ props }">
                      <VBtn
                        v-bind="props"
                        variant="outlined"
                        size="x-small"
                        class="mx-2"
                        icon="material-symbols:vertical-split-outline"
                      />
                    </template>
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
                              v-for="item in getDetailedPotentialByMonth(items.detailedEnergyPotential)"
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
                </VListItem>
              </VList>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VCardItem>
  </VCard>
</template>

<style lang="scss">
.card-items {
  border-left: 0.6rem solid rgb(var(--v-theme-primary)) !important;
  border-bottom: 0.2rem solid rgb(var(--v-theme-primary)) !important;
  border-right: 0.1rem solid rgb(var(--v-theme-primary)) !important;
  border-top: 0.1rem solid rgb(var(--v-theme-primary)) !important;
  box-shadow:
    rgba(50, 50, 93, 0.25) 0 6px 12px -2px,
    rgba(0, 0, 0, 0.3) 0 3px 7px -3px;
}
</style>
