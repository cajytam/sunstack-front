<script setup lang="ts">
interface Props {
  nbPanel: number
  nbRoof: number | undefined
  nbNotVisibleFramework: number | undefined
  nbConcreteFramework: number | undefined
  isArdoiseClouee: boolean
}

const props = defineProps<Props>()

const panelLimitResidentiel = import.meta.env.VITE_PANEL_LIMIT_RESIDENTIEL
</script>

<template>
  <VCard>
    <VCardTitle class="text-left">
      <VIcon
        icon="material-symbols:roofing-outline"
        color="primary"
        size="large"
        class="mr-2"
      />
      <span>Toitures</span>
    </VCardTitle>
    <VDivider class="mt-2 mx-6" />
    <VCardText v-if="props.nbPanel >= panelLimitResidentiel">
      <DisplayList
        :title="`Nombre totale de charpente${props.nbRoof > 1 ? 's' : ''}`"
        :content="props.nbRoof"
        :divider-bottom="true"
      />
      <DisplayList
        :title="`dont charpente${props.nbNotVisibleFramework > 1 ? 's' : ''} non visible${props.nbNotVisibleFramework > 1 ? 's' : ''}`"
        :style-italic="true"
        :content="props.nbNotVisibleFramework"
        :divider-bottom="true"
      />
      <DisplayList
        :title="`dont charpente${props.nbConcreteFramework > 1 ? 's' : ''} en béton`"
        :style-italic="true"
        :content="props.nbConcreteFramework"
        :divider-bottom="false"
      />
    </VCardText>
    <VCardText
      v-else
      class="pt-4"
    >
      <DisplayList
        title="Toiture en ardoises clouées ou collées"
        :content="props.isArdoiseClouee ? 'Oui' : 'Non'"
        :divider-bottom="false"
      />
    </VCardText>
  </VCard>
</template>

<style scoped lang="scss"></style>
