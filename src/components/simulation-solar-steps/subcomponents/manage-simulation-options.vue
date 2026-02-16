<script setup lang="ts">
import { useSimulationStore } from '@/stores/simulation'
import { baseOptionList, postSimulationOptions, SimulationOptionItem } from '@/services/simulationOptionsService'

const simulationStore = useSimulationStore()

const { simulationOptionsStored } = storeToRefs(simulationStore)

type Props = {
  buildingId?: number
  idSimulationOptions?: number
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'isCompleted', value: boolean): void
  (e: 'sendUpdatedData', value: object): void
}>()

const simulationOptionsDataInit = {
  id: null,
  phaseType: null,
  addBattery: null,
  addChargingPoint: null,
  installationLocation: null,
  roofType: null,
  nbLevel: null,
  asbestosRoof: null,
  nbRoofSection: null,
  isErpBuilding: null,
  building: null,
}

const simulationOptionsData = reactive({ ...simulationOptionsDataInit })

onMounted(() => {
  if (props.idSimulationOptions) {
    const currentOptions = simulationOptionsStored.value.find(el => el.id === props.idSimulationOptions)
    Object.keys(currentOptions).forEach(key => {
      simulationOptionsData[key] = currentOptions[key]
    })
  }
})

const currentCardIndex = ref(0)

const time = ref(500)
const timeout = ref(null)

const optionsList: SimulationOptionItem[] = ref([...baseOptionList])

watch(
  simulationOptionsData,
  () => {
    if (simulationOptionsData.building !== null || simulationOptionsData.id !== null) {
      clearTimeout(timeout.value)
      return
    }

    if (simulationOptionsData[optionsList.value[0]['variableName']] !== null) {
      // permet de prevent la saisie qui se "coupe" lors de la saisie dans un textfield de type number
      if (optionsList.value[currentCardIndex.value].dataType === 'number') {
        clearTimeout(timeout.value)
        time.value = 1500
      } else {
        time.value = 500
      }

      timeout.value = setTimeout(() => {
        optionsList.value[currentCardIndex.value].isVisible = false
        currentCardIndex.value++

        /*
        let displayOption = true
        do {
          currentCardIndex.value++

          displayOption = !(simulationOptionsData.installationLocation
            && simulationOptionsData.installationLocation !== 'T'
            && optionsList.value.length > currentCardIndex.value
            && optionsList.value[currentCardIndex.value].hasOwnProperty('onlyRoof')
            && optionsList.value[currentCardIndex.value].onlyRoof);
          console.log(simulationOptionsData.installationLocation,optionsList.value[currentCardIndex.value])
        } while (optionsList.value.length > currentCardIndex.value && !displayOption)
        */

        if (optionsList.value.length > currentCardIndex.value) {
          setTimeout(() => {
            optionsList.value[currentCardIndex.value].isVisible = true
          }, 300)
        } else {
          simulationOptionsData.building = props.buildingId

          postSimulationOptions(simulationOptionsData)
            .then(res => {
              if (process.env.NODE_ENV === 'development') console.log(res)

              setTimeout(() => {
                simulationOptionsData.id = res.data.id
                simulationOptionsStored.value.push({ ...simulationOptionsData })

                //re-initialize the simulationOptionsData reactive object
                Object.keys(simulationOptionsDataInit).forEach(key => {
                  simulationOptionsData[key] = simulationOptionsDataInit[key]
                })

                emit('isCompleted', true)
                currentCardIndex.value = 0
                optionsList.value[currentCardIndex.value].isVisible = true
              }, 500)
            })
            .catch(err => console.error(err))
        }
      }, time.value)
    }
  },
  { deep: true },
)

const onSendUpdatedData = () => {
  emit('sendUpdatedData', simulationOptionsData)
}
</script>

<template>
  <VContainer>
    <VRow
      align="stretch"
      justify="center"
      :class="{ 'mx-15': simulationOptionsData.id }"
    >
      <TransitionGroup :name="simulationOptionsData.id ? null : 'fade-transition'">
        <template
          v-for="simulationOptionItem in optionsList"
          :key="simulationOptionItem.building"
        >
          <VCol
            v-if="simulationOptionItem.isVisible || simulationOptionsData.id"
            :cols="simulationOptionsData.id ? 3 : 4"
          >
            <VCard
              :id="simulationOptionItem.variableName"
              border
              class="fill-height align-content-center d-flex flex-column"
              :class="simulationOptionsData.id ? 'border-primary' : 'card-simulation-option'"
              :elevation="simulationOptionsData.id ? 8 : 12"
            >
              <div class="bg-primary py-1">
                <h5
                  class="text-white text-center font-weight-bold align-self-start"
                  :class="simulationOptionsData.id ? 'text-caption' : 'text-h6'"
                >
                  {{ simulationOptionItem.name }}
                </h5>
              </div>
              <VRow
                class="px-6 py-3"
                align="center"
                justify="center"
              >
                <VCol
                  :cols="simulationOptionsData.id ? 3 : 5"
                  class="d-flex align-center justify-center"
                >
                  <VIcon
                    :icon="simulationOptionItem.icon"
                    color="primary"
                    :size="simulationOptionsData.id ? 54 : 90"
                  />
                </VCol>
                <VCol :cols="simulationOptionsData.id ? 9 : 7">
                  <VRadioGroup
                    v-if="simulationOptionItem.dataType === 'radio'"
                    v-model="simulationOptionsData[simulationOptionItem.variableName]"
                  >
                    <VRadio
                      v-for="option in simulationOptionItem.options"
                      :label="option.title"
                      :value="option.key"
                    />
                  </VRadioGroup>
                  <VRow
                    v-else-if="simulationOptionItem.dataType === 'number'"
                    align="center"
                    justify="center"
                  >
                    <VCol
                      :cols="
                        simulationOptionItem.helpMsg || simulationOptionItem.prefix
                          ? simulationOptionsData.id
                            ? 8
                            : 6
                          : 12
                      "
                    >
                      <VTextField
                        v-model="simulationOptionsData[simulationOptionItem.variableName]"
                        type="number"
                        min="1"
                        step="1"
                        class="option-field option-field__center"
                        variant="outlined"
                        autofocus
                      />
                    </VCol>
                    <VCol
                      v-if="simulationOptionItem.helpMsg || simulationOptionItem.prefix"
                      :cols="
                        simulationOptionItem.helpMsg || simulationOptionItem.prefix
                          ? simulationOptionsData.id
                            ? 4
                            : 6
                          : 0
                      "
                    >
                      <div class="d-flex flex-column justify-center align-center">
                        <VTooltip
                          v-if="simulationOptionItem.helpMsg"
                          activator="parent"
                          location="top"
                        >
                          <template v-slot:activator>
                            <VIcon
                              :size="simulationOptionsData.id ? 'large' : 'x-large'"
                              color="warning"
                              icon="clarity:help-info-solid"
                              class="mb-1 border rounded-circle border-warning pa-1"
                            />
                          </template>
                          <span v-html="simulationOptionItem.helpMsg"></span>
                        </VTooltip>
                        <h6
                          v-if="simulationOptionItem.prefix"
                          :class="simulationOptionsData.id ? 'text-body-1' : 'text-h6'"
                        >
                          {{ simulationOptionItem.prefix }}
                        </h6>
                      </div>
                    </VCol>
                  </VRow>
                </VCol>
              </VRow>
            </VCard>
          </VCol>
        </template>
      </TransitionGroup>
      <VCol
        v-if="simulationOptionsData.id"
        cols="12"
        class="d-flex justify-center align-center mt-5"
      >
        <VBtn
          @click="onSendUpdatedData"
          text="Valider"
          color="info"
          variant="elevated"
          size="large"
          prepend-icon="material-symbols:deployed-code-update-outline-rounded"
        />
      </VCol>
    </VRow>
  </VContainer>
</template>
<style scoped lang="scss">
.v-card .card-simulation-option {
  border: 0.15rem solid rgb(var(--v-theme-primary));
}

:deep(.option-field .v-field input) {
  color: rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity)) !important;
  text-align: center !important;
  font-size: 1.4rem !important;
}

:deep(.option-field__center .v-field__input) {
  display: flex;
  justify-content: center;
}
</style>
