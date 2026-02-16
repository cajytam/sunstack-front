<script setup lang="ts">
const props = defineProps({
  text: { type: String, required: true },
})

const getRoleName = role => {
  return role.split('_')[1]
}

const getChipColor = role => {
  switch (getRoleName(role).toLowerCase()) {
    case 'admin':
      return 'error'
    case 'sales':
      return 'info'
  }
}
</script>

<template>
  <VChip
    v-if="getRoleName(props.text) !== 'USER'"
    :text="getRoleName(props.text)"
    :color="getChipColor(props.text)"
    class="text-capitalize me-2"
    variant="tonal"
    rounded="sm"
  />
</template>

<style scoped lang="scss"></style>
