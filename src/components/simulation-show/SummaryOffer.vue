<script setup lang="ts">
import { getNumberFormat } from '@/utils/numberUtils'
import { fetchPost } from '@/services/api'

interface Props {
  nbPanel: number
  panelPower: number | null
  installationPriceHt: number | null
  finalPriceHt: number | null
  manualPrice: number | null
  installationTotalPower: number | null
  canDeductVat: boolean
  nbRoof: number | undefined
  nbOtherBuilding: number | undefined
  nbNotVisibleFramework: number | undefined
  nbConcreteFramework: number | undefined
  installationLocation: 'T' | 'S' | null
  isArdoiseClouee: boolean
  isSurveyMainBuilding: boolean
  profile: any
}

const props = defineProps<Props>()
const panelLimitResidentiel = import.meta.env.VITE_PANEL_LIMIT_RESIDENTIEL
const invertersList = ref([])

// calcul des onduleurs requis
onMounted(() => {
  if (props.panelPower && props.nbPanel > 0) {
    const dataInverter = {
      nbPanel: null,
      idPanel: null,
      chefLieu: null,
      azimuthRatio: null,
      electricalPhase: null,
      addBatterie: null,
    }

    /*fetchPost('calculationInverter', dataInverter)
      .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

    })
      .catch(err => console.error(err))*/
  }
})
</script>

<template>
  <VCardText>
    <VCard class="bg-var-theme-background mb-7 card-price card-price__color">
      <VCardText
        v-if="props.nbPanel"
        class="px-0 py-2"
      >
        <VTable
          class="background-transparent rounded py-2 px-4"
          density="compact"
        >
          <tbody>
            <tr class="no-border">
              <td class="no-border text-left">
                <span class="text-h6 font-weight-bold"> {{ getNumberFormat(props.nbPanel, 0, 0) }} </span
                ><span> panneaux</span>
                <span class="text-h6 font-weight-bold"> ({{ props.panelPower }} Wc) </span>
              </td>
              <td class="text-end no-border">
                <h6
                  v-if="props.manualPrice"
                  class="text-body-1 text-secondary font-weight-bold"
                >
                  {{ getNumberFormat(props.manualPrice) }} €
                </h6>
                <h6
                  v-else-if="props.installationPriceHt"
                  class="text-body-1 font-weight-bold"
                >
                  {{ getNumberFormat(props.installationPriceHt) }} €
                </h6>
              </td>
            </tr>
            <tr
              v-for="inverter in invertersList"
              :key="inverter.id"
            >
              <td class="text-left no-border">
                <span class="text-h6">
                  {{ inverter.count }}
                </span>
                onduleur{{ inverter.count > 1 ? 's' : '' }}
                <span class="text-h6">
                  {{ inverter.name }}
                </span>
              </td>
              <td class="text-end no-border">
                <h6 class="text-sm font-italic">inclus</h6>
              </td>
            </tr>
            <tr
              v-if="
                props.nbRoof ||
                (props.installationLocation === 'T' && props.nbPanel && props.nbPanel >= panelLimitResidentiel)
              "
            >
              <td
                colspan="2"
                class="text-end no-border"
              >
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <span>Étude de stabilité pour </span>
                    <span class="text-h6">
                      {{ props.nbRoof ? props.nbRoof : 1 }}
                    </span>
                    <span> charpente{{ props.nbRoof && props.nbRoof > 1 ? 's' : '' }}</span>
                  </div>
                  <h6 class="text-sm font-italic">
                    {{
                      props.nbRoof && props.nbRoof > 1 ? `${getNumberFormat(1100 * (props.nbRoof - 1))} €` : 'inclus'
                    }}
                  </h6>
                </div>
              </td>
            </tr>
            <tr v-if="props.isSurveyMainBuilding">
              <td
                colspan="2"
                class="text-end no-border"
              >
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <span class="text-h6"> Étude de stabilité </span>
                  </div>
                  <h6 class="text-sm font-italic">inclus</h6>
                </div>
              </td>
            </tr>
            <tr v-if="props.nbOtherBuilding">
              <td
                colspan="2"
                class="text-end no-border"
              >
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <span class="text-h6">
                      {{ props.nbOtherBuilding }}
                    </span>
                    <span>
                      étude{{ props.nbOtherBuilding > 1 ? 's' : '' }} pour d'autre{{
                        props.nbOtherBuilding > 1 ? 's' : ''
                      }}
                      bâtiment{{ props.nbOtherBuilding > 1 ? 's' : '' }}
                    </span>
                  </div>
                  <h6 class="text-sm font-italic">inclus</h6>
                </div>
              </td>
            </tr>
            <tr v-if="props.nbConcreteFramework && props.nbConcreteFramework > 0">
              <td
                colspan="2"
                class="text-end no-border"
              >
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <span class="text-h6">
                      {{ props.nbConcreteFramework }}
                    </span>
                    <span>
                      charpente{{ props.nbConcreteFramework > 1 ? 's' : '' }} en béton{{
                        props.nbConcreteFramework > 1 ? 's' : ''
                      }}</span
                    >
                  </div>
                  <h6 class="text-sm font-italic">
                    {{
                      props.finalPriceHt === props.installationPriceHt
                        ? 'inclus'
                        : `${getNumberFormat(2300 * props.nbConcreteFramework)} €`
                    }}
                  </h6>
                </div>
              </td>
            </tr>
            <tr v-if="props.nbNotVisibleFramework && props.nbNotVisibleFramework > 0">
              <td
                colspan="2"
                class="text-end no-border"
              >
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <span class="text-h6">
                      {{ props.nbNotVisibleFramework }}
                    </span>
                    <span>
                      charpente{{ props.nbNotVisibleFramework > 1 ? 's' : '' }} non visible{{
                        props.nbNotVisibleFramework > 1 ? 's' : ''
                      }}</span
                    >
                  </div>
                  <h6 class="text-sm font-italic">
                    {{
                      props.finalPriceHt === props.installationPriceHt
                        ? 'inclus'
                        : `${getNumberFormat(1400 * props.nbNotVisibleFramework)} €`
                    }}
                  </h6>
                </div>
              </td>
            </tr>
            <tr v-if="props.isArdoiseClouee">
              <td
                colspan="2"
                class="text-end no-border"
              >
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <span>Surcoût ardoises clouées ou collées</span>
                  </div>
                  <h6 class="text-sm font-italic">
                    {{ `${getNumberFormat(1250)} €` }}
                  </h6>
                </div>
              </td>
            </tr>
            <tr>
              <td
                class="no-border h-0 pt-2"
                colspan="2"
              >
                <VDivider />
              </td>
            </tr>
            <tr>
              <td
                colspan="2"
                class="text-end"
              >
                <div class="d-flex justify-space-between align-center">
                  <span class="text-caption font-italic">
                    {{ props.manualPrice ? 'Prix manuel HT' : 'Prix HT' }}
                  </span>
                  <h6
                    :class="[
                      props.manualPrice ? 'my-1' : 'my-3',
                      props.canDeductVat ? 'text-h4 font-weight-bold text-primary' : 'text-h6',
                    ]"
                  >
                    {{
                      getNumberFormat(
                        props.manualPrice
                          ? props.manualPrice
                          : props.finalPriceHt
                            ? props.finalPriceHt
                            : props.installationPriceHt,
                      )
                    }}
                    €
                  </h6>
                </div>
                <div
                  v-if="props.installationTotalPower"
                  class="d-flex justify-space-between align-center"
                >
                  <span class="text-subtitle-1 font-italic">
                    TVA {{ props.installationTotalPower <= 3 && props.profile.consumptionRate !== 0 ? '10%' : '20%' }}
                  </span>
                  <h6 class="text-h6 font-weight-bold font-italic">
                    {{
                      getNumberFormat(
                        (props.manualPrice
                          ? props.manualPrice
                          : props.finalPriceHt
                            ? props.finalPriceHt
                            : props.installationPriceHt) *
                          (props.installationTotalPower <= 3 && props.profile.consumptionRate !== 0 ? 0.1 : 0.2),
                      )
                    }}
                    €
                  </h6>
                </div>
                <VDivider />
                <div
                  v-if="props.installationTotalPower"
                  class="d-flex justify-space-between align-center mt-5 mb-2"
                >
                  <span
                    :class="
                      !props.canDeductVat ? 'text-h4 font-weight-bold text-primary' : 'text-subtitle-1 font-italic'
                    "
                  >
                    TTC
                  </span>
                  <h6
                    class="font-weight-bold"
                    :class="!props.canDeductVat ? 'text-h4 font-weight-bold text-primary' : 'text-h5'"
                  >
                    {{
                      getNumberFormat(
                        (props.manualPrice ? props.manualPrice : props.installationPriceHt) *
                          (props.installationTotalPower <= 3 && props.profile.consumptionRate !== 0 ? 1.1 : 1.2),
                      )
                    }}
                    €
                  </h6>
                </div>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>
      <VCardText v-else> Le devis ne semble pas terminé</VCardText>
    </VCard>
    <div class="d-flex justify-center align-center flex-wrap">
      <VAvatar
        class="mr-3"
        color="yellow-sunstack"
        size="small"
      >
        <VIcon
          icon="material-symbols:energy-savings-leaf-outline-rounded"
          size="small"
        />
      </VAvatar>
      <span class="text-body-1 pr-2"> Puissance installée : </span>
      <div class="d-flex align-center bg-var-theme-background rounded pr-2 elevation-4">
        <h4 class="text-h4 font-weight-bold ml-3">
          {{ getNumberFormat(props.installationTotalPower) }}
        </h4>
        <span class="align-self-center ml-2">kWc</span>
      </div>
    </div>
  </VCardText>
</template>

<style scoped lang="scss">
.card-price {
  position: relative;
  border-left: 0.6rem solid transparent;
  border-bottom: 0.2rem solid transparent;
  border-right: 0.1rem solid transparent;
  border-top: 0.1rem solid transparent;
  box-shadow:
    rgba(var(--v-theme-secondary), 0.7) 0 6px 12px -2px,
    rgba(var(--v-theme-on-secondary), 0.3) 0 3px 7px -3px;
  z-index: 9999;
}

.card-price__color {
  border-color: rgb(var(--v-theme-primary)) !important;
}
</style>
