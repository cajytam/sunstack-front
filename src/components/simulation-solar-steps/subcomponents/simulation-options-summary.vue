<script setup lang="ts">
import { baseOptionList } from '@/services/simulationOptionsService'

type Props = {
  simulationOptions: object
}
const props = defineProps<Props>()

const getSubtitle = (value, listItem?) => {
  const classesSelectedValue = 'text-body-1 font-weight-bold py-1 px-2 bg-primary rounded'
  if (listItem) {
    let noms = listItem.map(item => {
      if (item.key === value) return `<span class="${classesSelectedValue}">${item.title}</span>`
      return `<span class="font-italic">${item.title}</span>`
    })
    return noms.join(' / ')
  }
  return `<span class="${classesSelectedValue}">${value}</span>`
}
</script>

<template>
  <VList class="w-75 ml-5">
    <VListItem
      v-for="option in baseOptionList"
      :key="option.variableName"
      density="comfortable"
      :prepend-icon="option.icon"
    >
      <VListItemTitle class="d-flex flex-row align-center gap-x-2">
        <span class="font-weight-bold text-h6">{{ option.name }} : </span>
        <span
          class="text-body-2"
          v-html="getSubtitle(props.simulationOptions[option.variableName], option?.options)"
        />
      </VListItemTitle>
    </VListItem>
  </VList>
</template>

<style scoped lang="scss"></style>
