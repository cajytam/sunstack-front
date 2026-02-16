<script setup lang="ts">
import { getAll } from '@/services/api'

const data = ref({
  nbPanel: null,
  idPanel: null,
  chefLieu: null,
  azimuthRatio: null,
  electricalPhase: null,
  addBatterie: null,
})

// gestion panels
const listPanels = ref([])
const isLoadingPanels = ref(false)

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

  getAll('panel')
    .then(res => {
      listPanels.value = res.data.sort((a, b) => {
        return new Date(b.debutOnSaleAt) - new Date(a.debutOnSaleAt)
      })
    })
    .catch(err => console.error(err))
    .finally(() => (isLoadingPanels.value = false))
})
</script>

<template>
  <VMain>
    <VCard border>
      <VCardTitle class="ma-5 text-h4"> Calculateur de prix</VCardTitle>
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
                        <span class="text-h5 font-weight-bold">Panneaux :</span>
                      </VCol>
                      <VCol
                        class="d-flex align-center justify-center gap-x-5"
                        cols="8"
                      >
                        <VAutocomplete
                          v-model="data.idPanel"
                          :loading="isLoadingPanels"
                          auto-select-first
                          class="calculator-field__center calculator-field"
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
                        <span class="text-h5 font-weight-bold">Nombre de panneaux :</span>
                      </VCol>
                      <VCol
                        class="d-flex align-center justify-center gap-x-5"
                        cols="5"
                      >
                        <VNumberInput
                          id="nbPanel"
                          v-model="data.nbPanel"
                          class="calculator-field"
                          placeholder="Nb de panneaux"
                          persistent-placeholder
                          :step="1"
                          :min="6"
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
                    <VRow justify="space-between">
                      <VCol
                        class="d-flex align-center justify-center gap-x-5"
                        cols="5"
                      >
                        <VIcon
                          size="52"
                          icon="subway:location-3"
                          color="primary"
                        />
                        <span class="text-h5 font-weight-bold">Structure :</span>
                      </VCol>
                      <VCol
                        class="d-flex align-center"
                        cols="7"
                      >
                        <VRadioGroup
                          v-model="data.electricalPhase"
                          class="d-flex justify-center"
                          inline
                        >
                          <VRadio
                            class="font-weight-bold"
                            label="Toiture"
                            value="Toit"
                          />
                          <VRadio
                            class="font-weight-bold"
                            label="Sol"
                            value="Sol"
                          />
                          <VRadio
                            class="font-weight-bold"
                            label="Ombrière"
                            value="Ombiere"
                          />
                        </VRadioGroup>
                      </VCol>
                    </VRow>
                  </VCardText>
                </VCard>
              </VCol>
              <VCol
                cols="12"
                xl="4"
              >
                <VCard border>
                  <VCardText>
                    <VRow>
                      <VCol
                        class="d-flex align-center justify-center gap-x-5"
                        cols="5"
                      >
                        <VIcon
                          size="52"
                          icon="ph:car-battery-fill"
                          color="primary"
                        />
                        <span class="text-h5 font-weight-bold">Batterie :</span>
                      </VCol>
                      <VCol
                        class="d-flex align-center justify-center gap-x-5"
                        cols="7"
                      >
                        <VRadioGroup
                          v-model="data.addBatterie"
                          inline
                        >
                          <VRadio
                            label="Oui"
                            :value="true"
                          />
                          <VRadio
                            label="Non"
                            :value="false"
                          />
                          <VRadio
                            label="Ultérieurement"
                            value="not-now"
                          />
                        </VRadioGroup>
                      </VCol>
                    </VRow>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
            <VScrollYTransition mode="out-in">
              <VRow
                v-if="data.addBatterie === true"
                align="center"
                justify="center"
              >
                <FormBattery />
              </VRow>
            </VScrollYTransition>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </VMain>
</template>

<style scoped lang="scss">
:deep(.calculator-field .v-field input),
:deep(.calculator-field .v-autocomplete__selection .v-autocomplete__selection-text),
:deep(.calculator-field .v-select__selection) {
  color: rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity)) !important;
  text-align: center !important;
  font-size: 1.4rem !important;
}

:deep(.calculator-field__center .v-field__input) {
  display: flex;
  justify-content: center;
}
</style>
