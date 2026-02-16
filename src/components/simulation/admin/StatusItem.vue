<script setup lang="ts">
const props = defineProps<{
  status: object
}>()
</script>

<template>
  <VCardText>
    <VRow>
      <VCol cols="12">
        <VCard class="bg-var-theme-background card--status-item cursor-pointer py-1">
          <VCardTitle class="d-flex align-center">
            <template v-if="props.status.isKeyStep">
              <VIcon
                icon="ic:round-star"
                color="yellow-sunstack"
              />
              <span class="text-body-2 px-2">-</span>
            </template>
            <span class="text-info font-weight-bold text-h5">{{ props.status.sort }}</span>
            <span class="text-body-2 px-2">-</span>
            <span class="font-weight-bold text-h4">{{ props.status.name }}</span>
            <span class="text-body-2 px-2">-</span>
            <VChip
              :color="props.status.color ? props.status.color : 'secondary'"
              :text="props.status.name"
            />
          </VCardTitle>
          <template v-if="props.status.required.length !== 0">
            <VDivider class="mx-2" />
            <VCardItem>
              <h5 class="text-body-2 font-italic mb-2">Ce champ comporte des éléments requis :</h5>
              <VList lines="two">
                <VListItem
                  v-for="(item, key) in props.status.required"
                  density="compact"
                  class="my-0"
                >
                  <template #prepend>
                    <VIcon icon="pepicons-print:circle-filled" />
                  </template>
                  <span v-if="key === 'datetime'"> Date de l'évènement </span>
                  <template v-else-if="key === 'select'">
                    <span> Sélection d'un des éléments : </span>
                    <ul class="v-list pl-5 font-italic text-body-2">
                      <li v-for="el in item">
                        {{ el }}
                      </li>
                    </ul>
                  </template>
                  <span v-else-if="key === 'reason'"> Motif </span>
                </VListItem>
              </VList>
            </VCardItem>
          </template>
        </VCard>
      </VCol>
    </VRow>
  </VCardText>
</template>

<style scoped lang="scss">
.card--status-item {
  transition: all 0.2s ease-in-out;
  border: 3px solid transparent;

  &:hover {
    border-color: var(--primary-700);
  }
}
</style>
