<script setup lang="ts">
import { getNumberFormat } from '@/utils/numberUtils'

interface Props {
  bonusAmount: number | undefined
}

const props = defineProps<Props>()
</script>

<template>
  <VCard>
    <VCardTitle class="text-left">
      <VIcon
        icon="dashicons:money"
        color="primary"
        size="large"
        class="mr-2"
      />
      <span>Primes</span>
    </VCardTitle>
    <VDivider class="mt-2 mx-6" />
    <VCardText class="text-left pt-0">
      <VList>
        <DisplayList
          title="Prime à l'autoconsommation photovoltaïque"
          :content="props.bonusAmount ? `${getNumberFormat(props.bonusAmount)} €` : 'Non éligible'"
          :divider-bottom="false"
        />
      </VList>
    </VCardText>
  </VCard>
</template>

<style scoped lang="scss"></style>
