<script setup lang="ts">
interface Props {
  electricalPhase?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:electricalPhase', value: string): void
}>()

const selectedPhase = ref(props.electricalPhase)

const handlePhaseChange = () => {
  emit('update:electricalPhase', selectedPhase.value)
}
</script>

<template>
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
              icon="ic:outline-electric-meter"
              color="primary"
            />
            <span class="text-h5 font-weight-bold">Compteur :</span>
          </VCol>
          <VCol
            class="d-flex align-center justify-center gap-x-5"
            cols="5"
          >
            <VRadioGroup
              v-model="selectedPhase"
              @update:model-value="handlePhaseChange()"
            >
              <VRadio
                class="font-weight-bold"
                label="Monophasé"
                value="SP"
              />
              <VRadio
                class="font-weight-bold"
                label="Triphasé"
                value="TP"
              />
            </VRadioGroup>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </VCol>
</template>
