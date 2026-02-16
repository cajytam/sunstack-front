<script setup lang="ts">
import logoSunStack from '@images/sunstack.png'

interface Props {
  logoWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  logoWidth: '200',
})

const logo = computed(() => {
  return logoSunStack
})
</script>

<template>
  <img
    class="mb-5"
    :src="logo"
    :width="props.logoWidth"
    alt="logo SunStack"
  />
</template>
