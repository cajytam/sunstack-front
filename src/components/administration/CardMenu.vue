<script setup lang="ts">
interface Props {
  cols?: string
  sm?: string
  lg?: string
  md?: string
  icon: string
  title: string
  description: string
  link: object
}

const props = defineProps<Props>()

const cols = props.cols || '12'
const sm = props.sm || '6'
const lg = props.lg || '3'
const md = props.md || '4'
</script>

<template>
  <VCol
    :cols="cols"
    :sm="sm"
    :lg="lg"
    :md="md"
  >
    <VCard class="fill-height d-flex flex-column">
      <VCardTitle class="text-md-h5 text-primary">
        <VIcon
          :icon="icon"
          class="me-2"
        />
        {{ title }}
      </VCardTitle>
      <VCardText>{{ description }}</VCardText>
      <VCardText>
        <VBtn
          text="Ouvrir"
          variant="tonal"
          prepend-icon="fluent:open-16-regular"
          :to="link"
        />
      </VCardText>
    </VCard>
  </VCol>
</template>
