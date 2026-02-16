<script setup lang="ts">
interface Props {
  consumptionPrice: number | undefined
  consumptionQuantity: number | undefined
  profile: object | undefined
  priceEscalation: number | undefined
  salesPriceEscalation: number | undefined
  reducedYield: number | undefined
  reducedYieldFirstYear: number | null
}

const props = defineProps<Props>()
</script>

<template>
  <VCard>
    <VCardTitle class="text-left">
      <VIcon
        icon="iwwa:consumption-o"
        color="primary"
        size="large"
        class="mr-2"
      />
      <span>Consommations et éléments structurels</span>
    </VCardTitle>
    <VDivider class="mt-2 mx-6" />
    <VCardText>
      <DisplayList
        title="Consommation annuelle"
        :content="props.consumptionQuantity"
        :divider-bottom="true"
        :format-number="true"
        nb-decimals="0"
        add-suffix=" kWh"
      />
      <DisplayList
        title="Tarif actuel TTC du kWh"
        :content="props.consumptionPrice"
        :divider-bottom="true"
        :format-currency="true"
      />
      <DisplayList
        title="Profil énergétique"
        :content="props.profile ? `${props.profile.description} (${props.profile.identifier})` : 'Non renseigné'"
        :divider-bottom="true"
      />
      <DisplayList
        title="Indexation prix électricité"
        :content="props.priceEscalation"
        :divider-bottom="true"
        :format-number="true"
        add-suffix="%"
      />
      <DisplayList
        title="Indexation tarif revente EDF OA"
        :content="props.salesPriceEscalation"
        :divider-bottom="true"
        :format-number="true"
        add-suffix="%"
      />
      <DisplayList
        title="Perte efficacité panneaux (1ère année)"
        :content="props.reducedYieldFirstYear ? props.reducedYieldFirstYear : 'Non définie'"
        :divider-bottom="true"
        :format-number="!!props.reducedYieldFirstYear"
        :add-suffix="props.reducedYieldFirstYear ? '%' : ''"
        :add-prefix="props.reducedYieldFirstYear ? '-' : ''"
      />
      <DisplayList
        title="Perte efficacité panneaux (les années suivantes)"
        :content="props.reducedYield"
        :divider-bottom="false"
        :format-number="true"
        add-suffix="%"
        add-prefix="-"
      />
    </VCardText>
  </VCard>
</template>
