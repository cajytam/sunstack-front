<script setup lang="ts">
import { getNumberFormat } from '@/utils/numberUtils'
import { fetchPost, getAll } from '@/services/api'
import { chefLieux } from '@/services/calculation'

const listPanels = ref([])

const data = ref({
  nbPanel: null,
  idPanel: null,
  chefLieu: null,
  azimuthRatio: null,
  electricalPhase: null,
  addBatterie: null,
})

const result = ref(false)

const isLoadingPanels = ref(false)
const isCalculating = ref(false)
const isCalculationFinish = ref(false)

onMounted(() => {
  isLoadingPanels.value = true

  getAll('panel')
    .then(res => {
      listPanels.value = res.data.sort((a, b) => {
        return new Date(b.debutOnSaleAt) - new Date(a.debutOnSaleAt)
      })
    })
    .catch(err => console.error(err))
    .finally(() => (isLoadingPanels.value = false))
})

const getListDepartments = () => {
  // const data = []
  // for (let i = 1; i <= 95; i++) data.push(i < 10 ? `0${i}` : i)
  // return data
  return chefLieux
}

const onCalculate = () => {
  isCalculating.value = true

  fetchPost('calculationInverter', data.value).then(res => {
    if (process.env.NODE_ENV === 'development') console.log(res)

    result.value = res
    isCalculating.value = false
    isCalculationFinish.value = true

    setTimeout(() => {
      document.getElementById('result-inverter').scrollIntoView({
        behavior: 'smooth',
      })
    }, 450)
  })
}

const listAzimuthRatio = [
  { ratio: 1, name: 'Sud' },
  { ratio: 1.1, name: 'Autre' },
]
</script>

<template>
  <VMain>
    <VCard border>
      <VCardTitle class="ma-5 text-h4"> Dimensionnement onduleur</VCardTitle>
      <VCardText class="my-3">
        <VRow
          align="center"
          justify="center"
        >
          <VCol cols="10">
            <VRow
              align="center"
              justify="center"
            >
              <VCol
                cols="12"
                xl="7"
              >
                <VCard border>
                  <VCardText>
                    <VRow>
                      <VCol
                        class="d-flex align-center justify-center gap-x-5"
                        cols="4"
                      >
                        <VIcon
                          size="52"
                          icon="mingcute:solar-panel-line"
                          color="primary"
                        />
                        <span class="text-h5 font-weight-bold">Type de panneaux :</span>
                      </VCol>
                      <VCol
                        class="d-flex align-center justify-center gap-x-5"
                        cols="8"
                      >
                        <VAutocomplete
                          v-model="data.idPanel"
                          :loading="isLoadingPanels"
                          auto-select-first
                          class="inverter-field__center inverter-field"
                          :items="listPanels"
                          item-value="id"
                          item-title="fullname"
                          :placeholder="
                            isLoadingPanels ? 'Chargement des panneaux...' : 'Recherche intuitive du type de panneaux'
                          "
                        />
                      </VCol>
                    </VRow>
                  </VCardText>
                </VCard>
              </VCol>
              <VCol
                cols="12"
                xl="5"
              >
                <VCard border>
                  <VCardText>
                    <VRow>
                      <VCol
                        class="d-flex align-center justify-center gap-x-5"
                        cols="7"
                      >
                        <VIcon
                          size="52"
                          icon="eos-icons:counting"
                          color="primary"
                        />
                        <span class="text-h5 font-weight-bold">Nb de panneaux :</span>
                      </VCol>
                      <VCol
                        class="d-flex align-center justify-center gap-x-5"
                        cols="5"
                      >
                        <VTextField
                          id="nbPanel"
                          v-model="data.nbPanel"
                          class="inverter-field"
                          placeholder="Nb de panneaux"
                          persistent-placeholder
                          type="number"
                          step="1"
                          min="1"
                        />
                      </VCol>
                    </VRow>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </VCol>
        </VRow>
        <VRow
          align="center"
          justify="center"
        >
          <VCol cols="10">
            <VRow
              align="center"
              justify="center"
            >
              <VCol
                cols="12"
                xl="4"
              >
                <VCard border>
                  <VCardText>
                    <VRow>
                      <VCol
                        class="d-flex align-center justify-center gap-x-5"
                        cols="7"
                      >
                        <VIcon
                          size="52"
                          icon="gis:search-country"
                          color="primary"
                        />
                        <span class="text-h5 font-weight-bold">Département :</span>
                      </VCol>
                      <VCol
                        class="d-flex align-center justify-center gap-x-5"
                        cols="5"
                      >
                        <VAutocomplete
                          v-model="data.chefLieu"
                          :items="getListDepartments()"
                          auto-select-first
                          item-value="chefLieu"
                          item-title="id"
                          class="inverter-field__center inverter-field"
                          placeholder="Département"
                          persistent-placeholder
                        />
                      </VCol>
                    </VRow>
                  </VCardText>
                </VCard>
              </VCol>
              <VCol
                cols="12"
                xl="5"
              >
                <VCard border>
                  <VCardText>
                    <VRow>
                      <VCol
                        class="d-flex align-center justify-center gap-x-5"
                        cols="7"
                      >
                        <VIcon
                          size="52"
                          icon="mdi:sun-azimuth"
                          color="primary"
                        />
                        <span class="text-h5 font-weight-bold">Orientation panneau :</span>
                      </VCol>
                      <VCol
                        class="d-flex align-center justify-center gap-x-5"
                        cols="5"
                      >
                        <VSelect
                          v-model="data.azimuthRatio"
                          :items="listAzimuthRatio"
                          item-title="name"
                          item-value="ratio"
                          class="inverter-field__center inverter-field"
                        />
                      </VCol>
                    </VRow>
                  </VCardText>
                </VCard>
              </VCol>
              <PhaseType
                :electrical-phase="data.electricalPhase"
                @update:electrical-phase="e => (data.electricalPhase = e)"
              />
              <VCol
                cols="12"
                xl="4"
              >
                <VCard border>
                  <VCardText>
                    <VRow>
                      <VCol
                        class="d-flex align-center justify-center gap-x-5"
                        cols="7"
                      >
                        <VIcon
                          size="52"
                          icon="material-symbols:battery-plus"
                          color="primary"
                        />
                        <span class="text-h5 font-weight-bold">Ajout de batterie :</span>
                      </VCol>
                      <VCol
                        class="d-flex align-center justify-center gap-x-5"
                        cols="5"
                      >
                        <VSwitch v-model="data.addBatterie" />
                      </VCol>
                    </VRow>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </VCol>
        </VRow>
      </VCardText>
      <VCardText class="d-flex justify-center">
        <VBtn
          :loading="isCalculating"
          size="x-large"
          prepend-icon="fluent:calculator-arrow-clockwise-20-filled"
          text="Lancer le calcul"
          @click="onCalculate"
        />
      </VCardText>
    </VCard>
    <VRow
      v-if="isCalculationFinish || isCalculating"
      align="center"
      justify="center"
    >
      <VCol cols="10">
        <VSheet
          class="mt-8 px-3 py-2"
          elevation="24"
          border
          rounded
          id="result-inverter"
        >
          <VScrollYTransition mode="out-in">
            <VContainer
              v-if="isCalculating"
              class="d-flex justify-center mt-3 mb-8"
            >
              <VProgressCircular
                color="primary"
                indeterminate
                :size="128"
                :width="10"
              />
            </VContainer>
            <VContainer v-else>
              <VCardTitle><h4 class="text-h3 text-decoration-underline">Récapitulatif</h4></VCardTitle>
              <VCardItem class="mb-5">
                <VRow
                  v-if="result.monophase_depassement"
                  align="center"
                  justify="center"
                >
                  <VCol cols="5">
                    <VAlert
                      title="Limite pour monophasé dépassée"
                      :text="`Monophasé sélectionné alors que la puissance actuelle est de ${result.puissance_totale} Wc (max ${result.monophase_depassement.limite_monophase} W)`"
                      prominent
                      color="error"
                      icon="material-symbols:folder-limited-outline"
                      variant="tonal"
                      border
                    />
                  </VCol>
                </VRow>
                <VRow>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VList>
                      <VListItem>
                        <span class="text-h5 font-italic">Nombre total d'onduleurs :&nbsp;&nbsp;</span>
                        <span class="text-h4 text-primary font-weight-bold">{{ result.inverters.nb }}</span>
                      </VListItem>
                      <VListItem>
                        <span class="text-h5 font-italic">Puissance nominale totale :&nbsp;&nbsp;</span>
                        <span class="text-h4 text-primary font-weight-bold">
                          {{ getNumberFormat(result.inverters.total_power / 1000, 0) }} kW
                        </span>
                      </VListItem>
                    </VList>
                    <VList>
                      <VListItem>
                        <span class="text-h6 font-italic">Puissance totale panneaux :&nbsp;&nbsp;</span>
                        <span class="text-h5 text-primary font-weight-bold"
                          >{{ getNumberFormat(result.puissance_totale, 0, 2) }} Wc</span
                        >
                      </VListItem>
                    </VList>
                  </VCol>
                  <VDivider vertical />
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VList lines="one">
                      <VListItem>
                        <span class="text-body-1 text-decoration-underline">Département :</span>
                        <span class="font-weight-bold"
                          >&nbsp;&nbsp;{{
                            `${result.chefLieu.departement.nom} (${result.chefLieu.departement.code})`
                          }}</span
                        >
                      </VListItem>
                      <VListItem>
                        <span class="text-body-1 text-decoration-underline">Chef-lieu :</span>
                        <span class="font-weight-bold">&nbsp;&nbsp;{{ result.chefLieu.nom }}</span>
                      </VListItem>
                      <VListItem>
                        <span class="text-body-1 text-decoration-underline">Température minimale retenue :</span>
                        <span class="font-weight-bold"
                          >&nbsp;&nbsp;{{
                            `${result.chefLieu.temperature.temperature}°C (en ${result.chefLieu.temperature.year})`
                          }}</span
                        >
                      </VListItem>
                      <VListItem>
                        <span class="text-body-1 text-decoration-underline">Voc Max :</span>
                        <span class="font-weight-bold">&nbsp;&nbsp;{{ `${result.vocMax} V` }}</span>
                        <VIcon
                          class="text-body-1 mx-1"
                          icon="tabler:separator"
                        />
                        <span class="text-body-1 text-decoration-underline">Isc Max :</span>
                        <span class="font-weight-bold">&nbsp;&nbsp;{{ `${result.iscMax} A` }}</span>
                      </VListItem>
                    </VList>
                  </VCol>
                </VRow>
              </VCardItem>
              <VCardTitle>
                <h4 class="text-h4 text-decoration-underline">Détail des onduleurs sélectionnés</h4>
              </VCardTitle>
              <VCardItem>
                <VRow
                  align="center"
                  justify="center"
                >
                  <VCol
                    v-for="inverter in result.inverters.detail"
                    cols="4"
                  >
                    <CardInverter :inverter-data="inverter" />
                  </VCol>
                </VRow>
              </VCardItem>
            </VContainer>
          </VScrollYTransition>
        </VSheet>
      </VCol>
    </VRow>
  </VMain>
</template>

<style scoped lang="scss">
:deep(.inverter-field .v-field input),
:deep(.inverter-field .v-autocomplete__selection .v-autocomplete__selection-text),
:deep(.inverter-field .v-select__selection) {
  color: rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity)) !important;
  text-align: center !important;
  font-size: 1.4rem !important;
}

:deep(.inverter-field__center .v-field__input) {
  display: flex;
  justify-content: center;
}
</style>
