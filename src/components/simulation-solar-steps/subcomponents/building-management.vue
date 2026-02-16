<script setup lang="ts">
import { vMaska } from 'maska'
import { noSpacesCounter } from '@/utils/formUtils'
import { BuildingData } from '@domain/types/simulation'
import { useSimulationStore } from '@/stores/simulation'

const simulationStore = useSimulationStore()
const { buildings } = storeToRefs(simulationStore)

const emit = defineEmits<{
  (e: 'buildingDataChanged', value: object): void
  (e: 'deleteBuilding', value: number): void
}>()

interface Props {
  idBuilding: number
  building: BuildingData
}

const props = defineProps<Props>()

const maskPDL = { mask: '## ### ### ### ###' }

const itemsAttestation = [
  { key: 'is-customer-certifies-ownership', text: "J'atteste être légalement propriétaire de l'Immeuble." },
  {
    key: 'is-agreement-bare-owner',
    text: "J'atteste être locataire de l'Immeuble et bénéficier d'une autorisation écrite du propriétaire.",
  },
]

const buildingData = reactive({
  idBuilding: props.idBuilding,
  name: null,
  pdlNumber: null,
  isCustomerCertifiesOwnership: null,
  isAgreementBareOwner: null,
})

const attestationField = ref(null)

watch(buildingData, newValue => {
  emit('buildingDataChanged', newValue)
})

watch(attestationField, () => {
  if (!attestationField.value) return

  if (attestationField.value === 'is-agreement-bare-owner') {
    props.building.isAgreementBareOwner = true
    props.building.isCustomerCertifiesOwnership = null
  } else if (attestationField.value === 'is-customer-certifies-ownership') {
    props.building.isCustomerCertifiesOwnership = true
    props.building.isAgreementBareOwner = null
  } else {
    props.building.isAgreementBareOwner = null
    building.isCustomerCertifiesOwnership = null
  }
})

onMounted(() => {
  if (props.building.isAgreementBareOwner || props.building.isCustomerCertifiesOwnership) {
    if (props.building.isAgreementBareOwner) {
      attestationField.value = 'is-agreement-bare-owner'
    } else {
      attestationField.value = 'is-customer-certifies-ownership'
    }
  }
})

const onDeleteBuilding = idBuilding => {
  emit('deleteBuilding', idBuilding)
}
</script>

<template>
  <VRow
    align="center"
    justify="center"
  >
    <VCol cols="6">
      <VForm>
        <VCard
          class="py-5 px-10 my-2 card__building"
          border
        >
          <VRow
            align="center"
            justify="center"
          >
            <VCol class="d-flex align-center justify-center gap-x-2 py-2">
              <VLabel
                for="denomination"
                class="text-primary font-weight-bold me-2"
              >
                Dénomination
              </VLabel>
              <VTextField
                v-model="building.name"
                id="denomination"
                variant="filled"
                density="compact"
              />
            </VCol>
            <DialogCloseBtn
              v-if="buildings.length > 1"
              @click="onDeleteBuilding(props.idBuilding)"
              class="btn__delete-building"
              color="error"
              icon="material-symbols:delete"
              size="x-small"
            />
          </VRow>
          <VRow
            align="center"
            justify="center"
          >
            <VCol class="d-flex align-top justify-center gap-x-2 py-2">
              <VLabel
                for="pdl"
                class="text-primary font-weight-bold me-2"
              >
                Numéro de PDL
              </VLabel>
              <VTextField
                v-model="building.pdlNumber"
                id="pdl"
                variant="filled"
                density="compact"
                :counter="14"
                v-maska:[maskPDL]
                placeholder="14 chiffres"
                :counter-value="noSpacesCounter"
              />
            </VCol>
          </VRow>
          <VRow
            align="center"
            justify="center"
          >
            <VCol>
              <VSelect
                v-model="attestationField"
                id="attestation"
                label="Attestation"
                variant="outlined"
                item-value="key"
                item-title="text"
                :items="itemsAttestation"
              />
            </VCol>
          </VRow>
        </VCard>
      </VForm>
    </VCol>
  </VRow>
</template>

<style scoped lang="scss">
:deep(.v-field__field .v-field__input .v-select__selection span.v-select__selection-text) {
  text-wrap: pretty !important;
}

.card__building {
  .btn__delete-building {
    display: none;
  }

  &:hover {
    .btn__delete-building {
      display: block;
    }
  }
}
</style>
