<script setup lang="ts">
interface Props {
  surveys: Array
  surveySimulation: Array
  idSimulation: string
}

const props = defineProps<Props>()
</script>

<template>
  <VRow class="mb-8 mt-0">
    <VCol cols="12">
      <VCard
        border
        class="pb-3"
      >
        <VCardTitle class="d-flex align-center justify-center font-weight-bold bg-purple">
          <VIcon
            icon="wpf:survey"
            color="white"
          />
          <span class="ml-3 text-white">Survey</span>
        </VCardTitle>
        <VCardText class="mt-5">
          <SurveySimulation
            :surveys="props.surveys"
            :survey-simulation="props.surveySimulation"
            :id-simulation="props.idSimulation"
          />
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style scoped lang="scss"></style>
