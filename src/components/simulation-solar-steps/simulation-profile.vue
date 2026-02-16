<script setup lang="ts">
import { getAll } from '@/services/api'
import { useSimulationStore } from '@/stores/simulation'

const simulationStore = useSimulationStore()
const { simulationData } = storeToRefs(simulationStore)
const { nextStep, previousStep } = simulationStore

const isLoading = ref(false)

const iconsForProfiles = {
  0.4: ['fa6-solid:house-laptop', 'fa6-solid:people-roof'],
  0.34: ['fa6-solid:house', 'eva:people-fill'],
  0: ['tabler:pig-money'],
  1: ['fa6-solid:house-chimney-user'],
}

const listProfiles = ref([])

onMounted(() => {
  isLoading.value = true
  getAll('profile', true, 'get+ld')
    .then(res => {
      const data = res.data['hydra:member']

      data.forEach(val => {
        listProfiles.value.push({
          id: val['@id'],
          text: val.description,
          rate: val.consumptionRate,
          isEligibleBonus: val.isEligibleForBonus,
        })
      })
    })
    .catch(err => {
      console.error(err)
    })
    .finally(() => {
      isLoading.value = false
    })
})

const onClickNext = () => {
  if (simulationData.value.profile) nextStep()
}
</script>

<template>
  <VContainer class="mt-8">
    <VRow
      align="center"
      justify="center"
    >
      <VCol
        cols="12"
        sm="12"
        lg="10"
      >
        <h2 class="text-h5 font-weight-bold text-center">
          <VIcon
            icon="tabler:solar-panel"
            class="me-1"
            color="primary"
            size="x-large"
          />
          Sélectionnez votre profil énergétique
        </h2>
        <VDialogTransition mode="out-in">
          <VContainer
            v-if="isLoading"
            class="mx-auto mt-10"
          >
            <VRow
              align="center"
              justify="center"
            >
              <VCol
                cols="12"
                class="text-center"
              >
                <VProgressCircular
                  color="primary"
                  indeterminate
                  :size="128"
                  :width="7"
                />
              </VCol>
            </VRow>
          </VContainer>
          <VContainer
            v-else
            class="mx-auto mt-10"
          >
            <VRow justify="center">
              <VCol
                v-for="profile in listProfiles"
                cols="7"
                md="6"
                xl="3"
              >
                <VCard
                  :id="profile.id"
                  class="card__profile-animation text-center pt-5 pb-8 fill-height"
                  :class="{ 'card-selected': profile.id === simulationData.profile }"
                  elevation="12"
                  @click="simulationData.profile = profile.id"
                >
                  <template v-for="(icon, index) in iconsForProfiles[profile.rate]">
                    <VIcon
                      :icon="icon"
                      size="x-large"
                      class="mb-3"
                    />
                    <VIcon
                      v-if="index + 1 < iconsForProfiles[profile.rate].length"
                      icon="fa6-solid:circle-plus"
                      size="x-small"
                      class="mx-1"
                      color="on-background"
                    />
                  </template>
                  <span class="d-block text-xl-h6 text-md-body-1 text-sm-body-2 px-sm-6 font-weight-bold mt-2">
                    {{ profile.text }}
                  </span>
                  <VChip
                    v-if="profile.isEligibleBonus"
                    prepend-icon="ic:round-star"
                    class="mt-8"
                  >
                    éligible à la prime
                  </VChip>
                </VCard>
              </VCol>
            </VRow>
          </VContainer>
        </VDialogTransition>
      </VCol>
    </VRow>
    <VRow
      class="mt-15 gap-x-8"
      align-content="center"
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
        append-icon="ion:arrow-forward"
        text="Suivant"
        :disabled="!simulationData.profile"
        @click.prevent="onClickNext"
      />
    </VRow>
  </VContainer>
</template>

<style scoped lang="scss">
.card__profile-animation {
  transition: all 0.2s ease;
  box-shadow: rgba(0, 0, 0, 0.15) 1.95px 1.95px 2.6px;
  border: 1px solid rgb(var(--v-theme-grey-100));

  &:hover {
    transform: translateY(-6px);
    box-shadow: rgba(0, 0, 0, 0.35) 2px 3px 15px;
    cursor: pointer;
  }
}

.card-selected {
  background-color: var(--green-sunstack-darker);
  color: white !important;

  & span.v-chip {
    color: var(--yellow-sunstack) !important;
  }
}
</style>
