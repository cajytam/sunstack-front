<script setup lang="ts">
interface Props {
  icon?: string
  iconSize?: string
  color?: string
  size?: string
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'tabler-x',
  iconSize: '22',
  color: null,
  size: 'default',
})
</script>

<template>
  <IconBtn
    variant="elevated"
    class="v-dialog-close-btn ma-3"
    :color="props.color"
    :size="props.size"
  >
    <VIcon
      :icon="props.icon"
      :size="props.iconSize"
    />
  </IconBtn>
</template>
