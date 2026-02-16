<script setup lang="ts"></script>

<template>
  <VCol cols="6">
    <VCard border>
      <VCardText>
        <VRow justify="space-between">
          <VCol
            class="d-flex align-center justify-center gap-x-5"
            cols="6"
          >
            <VIcon
              size="52"
              icon="cbi:solar-battery-10"
              color="primary"
            />
            <span class="text-h5 font-weight-bold">Modèle de batterie :</span>
          </VCol>
          <VCol
            class="d-flex align-center"
            cols="6"
          >
            <VAutocomplete
              :items="['5kW', '8kW', '11kW']"
              class="calculator-field__center calculator-field"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </VCol>
  <VCol cols="4">
    <VCard border>
      <VCardText>
        <VRow justify="space-between">
          <VCol
            class="d-flex align-center justify-center gap-x-5"
            cols="7"
          >
            <VIcon
              size="52"
              icon="material-symbols:battery-plus"
              color="primary"
            />
            <span class="text-h5 font-weight-bold">Nombre de module :</span>
          </VCol>
          <VCol
            class="d-flex align-center"
            cols="5"
          >
            <VNumberInput
              class="calculator-field"
              :min="0"
              :max="6"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </VCol>
</template>
