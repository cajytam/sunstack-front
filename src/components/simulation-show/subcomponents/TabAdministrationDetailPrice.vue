<script setup lang="ts">
import { getPriceFromSimulationId } from '@/services/priceService'
import { sunstackMargins, getCoefficientFromMargin } from '@/services/calculation'
import { getNumberFormat } from '@/utils/numberUtils'
import { deepClone } from '@/utils/jsonUtils'

type Props = {
  simulationId: string
}
const props = defineProps<Props>()
const tabPrice = ref('E')

const listPricesByMargin = ref({})

onMounted(() => {
  let basePrices = null

  getPriceFromSimulationId(props.simulationId).then(res => {
    if (process.env.NODE_ENV === 'development') console.log(`calculationPrice : marge (E) ===>`, res)

    basePrices = deepClone(res.data)

    for (let i = 0; i < sunstackMargins.length; i++) {
      const margin = sunstackMargins[i]
      const marginPrices = deepClone(basePrices)

      marginPrices['total_price'] =
        marginPrices.unmarginable_prices + marginPrices.sunstack_margin_base / (1 - getCoefficientFromMargin(margin))

      listPricesByMargin.value[margin] = marginPrices
    }
  })
})
</script>

<template>
  <VContainer>
    <VRow
      v-if="Object.keys(listPricesByMargin).length > 0"
      align="center"
      justify="center"
    >
      <VCol
        v-if="listPricesByMargin.E?.error"
        cols="7"
      >
        <VAlert
          variant="tonal"
          color="error"
          prominent
          icon="mdi:file-document-error"
        >
          <VAlertTitle>
            <span class="font-weight-bold text-h6 text-error">{{ listPricesByMargin.E.title }}</span>
          </VAlertTitle>
          <h6 class="text-body-1 text-error text-left">{{ listPricesByMargin.E.error }}</h6>
        </VAlert>
      </VCol>
      <VCol v-else>
        <VTabs
          v-model="tabPrice"
          fixed-tabs
          next-icon="mdi-arrow-right-bold-box-outline"
          prev-icon="mdi-arrow-left-bold-box-outline"
          show-arrows
        >
          <VTab
            v-for="margin in sunstackMargins"
            :key="margin"
            :value="margin"
            class="font-weight-bold text-body-1 tab-prices"
          >
            {{ margin }} -
            {{ getNumberFormat(listPricesByMargin?.[margin]?.total_price, 2, 2) + '€' || 'Chargement...' }}
          </VTab>
        </VTabs>
        <VContainer>
          <VTabsWindow v-model="tabPrice">
            <VTabsWindowItem
              v-for="margin in sunstackMargins"
              :value="margin"
            >
              <TabAdministrationDetailPriceCard
                :price-detail="listPricesByMargin?.[margin]"
                :sunstack-margin="margin"
              />
            </VTabsWindowItem>
          </VTabsWindow>
        </VContainer>
      </VCol>
    </VRow>
  </VContainer>
</template>

<style scoped lang="scss">
.v-tab.v-tab.v-btn.tab-prices {
  font-family: Arial, sans-serif;
  font-size: 1.2rem !important;
  transition: all 0.2s ease;
}

.v-tab.v-tab.v-btn.tab-prices.v-tab-item--selected {
  background-color: var(--green-sunstack-darker);
  color: white !important;
  font-size: 1.4rem !important;
}
</style>
