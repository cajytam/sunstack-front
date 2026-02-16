<script setup lang="ts">
interface Props {
  errorCode?: string
  errorTitle?: string
  errorDescription?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="text-center">
    <!-- 👉 Title and subtitle -->
    <h1
      v-if="props.errorCode"
      class="text-h1 font-weight-medium"
    >
      {{ props.errorCode }}
    </h1>
    <h4
      v-if="props.errorTitle"
      class="text-h2 font-weight-bold mb-3"
    >
      {{ props.errorTitle }}
    </h4>
    <p
      v-if="props.errorDescription"
      class="text-subtitle-1"
    >
      {{ props.errorDescription }}
    </p>
  </div>
</template>
