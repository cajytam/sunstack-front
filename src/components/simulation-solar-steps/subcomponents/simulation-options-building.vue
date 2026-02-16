<script setup lang="ts">
import { getFormatPDL } from '@/utils/numberUtils'

type Props = {
  building: object
}

const props = defineProps<Props>()
</script>

<template>
  <div class="d-flex justify-center mb-7">
    <div class="bg-primary text-white text-center rounded-shaped py-3 d-inline-block elevation-12">
      <div class="px-12 d-flex align-baseline justify-center">
        <VIcon
          size="small"
          color="white"
          icon="fluent:building-home-16-filled"
          class="me-2"
        />
        <span class="text-h5 text-md-h4 text-white font-weight-bold">{{ building.name }}</span>
      </div>
      <VDivider
        thickness="3"
        opacity=".8"
        color="white"
        class="mt-2 my-3"
      />
      <div class="px-12 d-flex align-center justify-center">
        <VIcon
          size="small"
          icon="material-symbols:electric-meter"
          class="me-2"
        />
        <span class="text-white text-body-1 text-md-h6 font-italic">{{ getFormatPDL(building.pdlNumber) }}</span>
      </div>
    </div>
  </div>
</template>
