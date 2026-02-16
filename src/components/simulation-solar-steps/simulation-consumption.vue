<script setup lang="ts">
import { useSimulationStore } from '@/stores/simulation'

const simulationStore = useSimulationStore()
const { simulationData } = storeToRefs(simulationStore)
const { nextStep, previousStep } = simulationStore

const valid = ref(false)
const form = ref(null)
const dialogDetailedPrice = ref(false)
const dialogDetailedConsumption = ref(false)

const quantityRules = [
  value => {
    if (value && value >= 0) return true

    return 'La quantité ne peut pas être vide et doit être positive'
  },
]

const priceRules = [
  value => {
    if (value && value >= 0) return true

    return 'Le prix ne peut pas être vide et doit être positif'
  },
]

const onClickNext = async () => {
  await form.value.validate()
  if (valid.value) nextStep()
}

/**
 * CONSOMMATION Détaillées
 */
const modeHauteBasse = ref(false)
const mois = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

const consommations = ref(
  mois.map(() => ({
    HP: 0,
    HC: 0,
    HPH: 0,
    HCH: 0,
    HPB: 0,
    HCB: 0,
  })),
)

const prix = ref({
  HP: 0,
  HC: 0,
  HPH: 0,
  HCH: 0,
  HPB: 0,
  HCB: 0,
})

onMounted(() => {
  if (simulationData.value.consumptionPriceDetailed !== null) {
    prix.value = { ...simulationData.value.consumptionPriceDetailed }
  }

  if (simulationData.value.consumptionQuantityDetailed !== null) {
    consommations.value = simulationData.value.consumptionQuantityDetailed.map(item => ({ ...item }))
  }

  if (simulationData.value.seasonalPrices !== null) {
    modeHauteBasse.value = simulationData.value.seasonalPrices
  }
})

watch(dialogDetailedConsumption, () => {
  if (!dialogDetailedConsumption.value) {
    simulationData.value.consumptionQuantityDetailed = consommations.value
  }
})
watch(dialogDetailedPrice, () => {
  if (!dialogDetailedPrice.value) {
    simulationData.value.consumptionPriceDetailed = prix.value
  }
})
watch(modeHauteBasse, () => {
  simulationData.value.seasonalPrices = modeHauteBasse.value
})
</script>

<template>
  <VLayout class="d-block pt-4">
    <div class="text-center mx-auto">
      <VIcon
        icon="fa-solid:plug"
        color="primary"
        size="54"
      />
      <h3 class="text-primary font-weight-bold mt-4 text-h5">
        Quelle est votre consommation annuelle d'électricité en kWh ?
      </h3>
      <h6 class="text-body-1 mt-2">Ceci permet d'estimer le nombre de panneaux photovoltaïques nécessaires</h6>
    </div>
    <VForm
      ref="form"
      v-model="valid"
      @submit.prevent="onClickNext"
    >
      <VContainer class="mt-12">
        <VRow
          align="start"
          justify="center"
        >
          <VCol
            cols="8"
            lg="4"
          >
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="simulationData.consumptionQuantity"
                  prepend-inner-icon="simple-line-icons:energy"
                  :rules="quantityRules"
                  label="Consommation"
                  required
                  class="shrink mx-15"
                  suffix="kWh / an"
                  variant="solo-filled"
                  type="number"
                  :validate-on="valid === null || valid === undefined ? 'submit' : 'input'"
                  name="consumption"
                  min="0"
                  step="1"
                />
              </VCol>
              <VCol
                cols="12"
                class="d-flex justify-start pt-0"
              >
                <VBtn
                  @click="dialogDetailedConsumption = !dialogDetailedConsumption"
                  variant="text"
                  size="small"
                  class="mx-15"
                  prepend-icon="iwwa:consumption-o"
                >
                  Ajout consommation détaillée
                </VBtn>
              </VCol>
            </VRow>
          </VCol>
          <VCol
            cols="8"
            lg="4"
          >
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="simulationData.consumptionPrice"
                  prepend-inner-icon="tabler:coin-euro"
                  :rules="priceRules"
                  label="Prix TTC du kWh en €"
                  required
                  class="shrink mx-15"
                  suffix="€ / kWh"
                  variant="solo-filled"
                  type="number"
                  :validate-on="valid === null || valid === undefined ? 'submit' : 'input'"
                  name="unit_price"
                  min="0"
                  step="0.01"
                />
              </VCol>
              <VCol
                cols="12"
                class="d-flex justify-end pt-0"
              >
                <VBtn
                  @click="dialogDetailedPrice = !dialogDetailedPrice"
                  variant="text"
                  size="small"
                  class="mx-15"
                  append-icon="material-symbols:price-change-outline"
                >
                  Ajout des prix
                </VBtn>
              </VCol>
            </VRow>
          </VCol>
        </VRow>
        <VRow
          class="mt-15 gap-x-8"
          align="center"
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
            append-icon="maki:arrow"
            text="Suivant"
            @click.prevent="onClickNext"
          />
        </VRow>
      </VContainer>
    </VForm>
    <VDialog
      v-model="dialogDetailedPrice"
      width="auto"
    >
      <DialogCloseBtn @click="dialogDetailedPrice = false" />
      <VCard
        max-width="750"
        class="mb-4"
        prepend-icon="et:pricetags"
        title="Prix au kWh"
      >
        <VCardText>
          <VSwitch
            v-model="modeHauteBasse"
            label="Mode Haute/Basse saison"
          />
        </VCardText>
        <VCardText>
          <VRow v-if="!modeHauteBasse">
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="prix.HP"
                label="Prix Heures pleines"
                type="number"
                step="0.0001"
                suffix="€/kWh"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="prix.HC"
                label="Prix Heures creuses"
                type="number"
                step="0.0001"
                suffix="€/kWh"
              />
            </VCol>
          </VRow>
          <VRow v-else>
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="prix.HPH"
                label="Prix Heures pleines (haute saison)"
                type="number"
                step="0.0001"
                suffix="€/kWh"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="prix.HCH"
                label="Prix Heures creuses (haute saison)"
                type="number"
                step="0.0001"
                suffix="€/kWh"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="prix.HPB"
                label="Prix Heures pleines (basse saison)"
                type="number"
                step="0.0001"
                suffix="€/kWh"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="prix.HCB"
                label="Prix Heures creuses (basse saison)"
                type="number"
                step="0.0001"
                suffix="€/kWh"
              />
            </VCol>
          </VRow>
        </VCardText>
        <div class="d-flex justify-end mx-5 mb-3">
          <VBtn
            class="ms-auto"
            text="Enregistrer"
            @click="dialogDetailedPrice = false"
          />
        </div>
      </VCard>
    </VDialog>
    <VDialog
      v-model="dialogDetailedConsumption"
      width="auto"
    >
      <DialogCloseBtn @click="dialogDetailedConsumption = false" />
      <VCard
        prepend-icon="iwwa:consumption-o"
        title="Saisissez de la consommation détaillée"
      >
        <VCardText class="d-flex justify-space-between">
          <VSwitch
            v-model="modeHauteBasse"
            label="Mode Haute/Basse saison"
          />
          <VBtn
            v-if="false"
            text="Importer"
            variant="text"
            prepend-icon="uil:import"
          />
        </VCardText>
        <VContainer class="pt-0">
          <VCardText class="pt-0">
            <VRow
              align="center"
              v-for="(mois, index) in mois"
              :key="mois"
            >
              <VCol>
                <VSheet class="pa-2 text-center">{{ mois }}</VSheet>
              </VCol>
              <VCol v-if="!modeHauteBasse">
                <VTextField
                  v-model="consommations[index].HP"
                  label="Heures pleines"
                  type="number"
                  suffix="kWh"
                  min="0"
                />
              </VCol>
              <VCol v-if="!modeHauteBasse">
                <VTextField
                  v-model="consommations[index].HC"
                  label="Heures creuses"
                  type="number"
                  suffix="kWh"
                  min="0"
                />
              </VCol>
              <VCol v-if="modeHauteBasse">
                <VTextField
                  v-model="consommations[index].HPH"
                  label="Heures pleines (haute)"
                  type="number"
                  suffix="kWh"
                  min="0"
                />
              </VCol>
              <VCol v-if="modeHauteBasse">
                <VTextField
                  v-model="consommations[index].HCH"
                  label="Heures creuses (haute)"
                  type="number"
                  suffix="kWh"
                  min="0"
                />
              </VCol>
              <VCol v-if="modeHauteBasse">
                <VTextField
                  v-model="consommations[index].HPB"
                  label="Heures pleines (basse)"
                  type="number"
                  suffix="kWh"
                  min="0"
                />
              </VCol>
              <VCol v-if="modeHauteBasse">
                <VTextField
                  v-model="consommations[index].HCB"
                  label="Heures creuses (basse)"
                  type="number"
                  suffix="kWh"
                  min="0"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VContainer>
        <div class="d-flex justify-end mx-5 mb-3">
          <VBtn
            class="ms-auto"
            text="Enregistrer"
            @click="dialogDetailedConsumption = false"
          />
        </div>
      </VCard>
    </VDialog>
  </VLayout>
</template>
