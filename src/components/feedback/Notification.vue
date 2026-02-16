<script setup lang="ts">
const props = defineProps({
  alertType: { type: String, required: true },
  title: { type: String, required: true },
  text: { type: String },
  icon: { type: String },
  isClosable: { type: Boolean, default: false },
  autocloseTime: { type: Number, default: 5000 },
})

const emit = defineEmits(['isAutoClosed'])

const isIconProminent = computed(() => {
  return !!props.icon
})

const isVisible = ref(true)

onMounted(() => {
  setTimeout(() => {
    isVisible.value = false
  }, props.autocloseTime)
  setTimeout(() => {
    emit('isAutoClosed')
  }, props.autocloseTime + 500)
})
</script>

<template>
  <VRow>
    <VCol
      cols="12"
      md="3"
    >
      <VScrollYTransition>
        <VAlert
          v-if="isVisible"
          class="position-fixed notification-alert"
          min-width="400"
          :color="props.alertType"
          :title="props.title"
          :text="props.text"
          :icon="props.icon"
          :closable="props.isClosable"
          :prominent="isIconProminent"
        />
      </VScrollYTransition>
    </VCol>
  </VRow>
</template>

<style scoped lang="scss">
.notification-alert {
  z-index: 9999 !important;
  position: absolute;
  top: 2rem;
  right: 50%;
  transform: translateX(50%);
}
</style>
