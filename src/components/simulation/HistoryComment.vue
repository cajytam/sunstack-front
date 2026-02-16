<script setup lang="ts">
const props = defineProps({
  openDialogHistory: { type: Boolean, default: true },
  isSaving: { type: Boolean, default: false },
})

const emit = defineEmits<{
  (e: 'isCloseHistoryDialog', value: boolean): void
  (e: 'title', value: string): void
  (e: 'content', value: string): void
  (e: 'onSubmit'): void
}>()

const historyCommentData = reactive({
  title: null,
  content: null,
})

const onSubmit = () => {
  emit('onSubmit')
  historyCommentData.title = null
  historyCommentData.content = null
}
</script>

<template>
  <VDialog
    v-model="props.openDialogHistory"
    width="1024"
    persistent
  >
    <VCard>
      <VCardTitle>
        <span class="text-h5"> Ajouter un commentaire </span>
      </VCardTitle>
      <VCardText>
        <VContainer>
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="historyCommentData.title"
                rows="3"
                label="Titre (obligatoire)"
                required
                @input="$emit('title', $event.target.value)"
              />
            </VCol>
          </VRow>
          <VRow>
            <VCol cols="12">
              <VTextarea
                v-model="historyCommentData.content"
                rows="3"
                label="Description"
                @input="$emit('content', $event.target.value)"
              />
            </VCol>
          </VRow>
        </VContainer>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="text"
          text="Fermer"
          :disabled="isSaving"
          @click.prevent="$emit('isCloseHistoryDialog')"
        />
        <VBtn
          color="primary"
          variant="elevated"
          text="Enregistrer"
          :loading="isSaving"
          @click="onSubmit"
        />
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped lang="scss"></style>
