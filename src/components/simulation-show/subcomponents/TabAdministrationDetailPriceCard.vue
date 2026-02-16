<script setup lang="ts">
import { getNumberFormat } from '@/utils/numberUtils'
import { getCoefficientFromMargin } from '@/services/calculation'
import { computed, ref } from 'vue'

// Définition des types
type PriceDetailOtherFactor = {
  marked: number
  unmarked: number
  onceBySimulation: boolean
}

type PriceDetail = {
  panel: number
  inverter: number
  inverter_option: number
  other: { [key: string]: PriceDetailOtherFactor } // Ajout de la clé 'other'
}

type Props = {
  priceDetail: PriceDetail // Utilisation du type PriceDetail
  sunstackMargin: string
}

const props = defineProps<Props>()

// Définition de dataPrice avec Autres vides initialement
const dataPrice = [
  {
    'Panneaux et pose': [
      { panneau: 'panel', isMarged: true },
      { pose: 'other.Prix de pose', isMarged: 'auto' },
      { 'câblage DC': 'other.Câblage DC', isMarged: 'auto' },
      { transport: 'other.Transport', isMarged: 'auto' },
      { élévateur: 'lift', isMarged: true },
      { 'éco-participation': 'eco_participation', isMarged: false },
    ],
  },
  {
    Onduleurs: [
      { onduleurs: 'inverter', isMarged: true },
      { 'câblage AC': 'inverter_cable', isMarged: true },
      { 'Option des onduleurs': 'inverter_option', isMarged: true },
      { 'Coffrets de protection': 'inverter_protection_box', isMarged: true },
      { 'Garantie 20 ans': 'inverters_warranty', isMarged: false },
    ],
  },
  {
    Autres: [
      { 'maison mère': 'maison_mere_margin', isMarged: true },
      { 'étude de stabilité principale': 'surveyMainBuilding', isMarged: true },
      { 'étude stabilité autre batiment': 'surveyOtherBuilding', isMarged: false },
      { 'surplus charpente non visible': 'surveyCharpentesNonVisibles', isMarged: false },
      { 'surplus charpente béton': 'surveyCharpentesBeton', isMarged: false },
    ],
  },
]

const isMargedVisible = ref(true)

const findAmountInNestedData = (key: string): number | null => {
  const keyInData = key.split('.')
  let current: any = props.priceDetail
  let amount = 0
  let isMarged

  for (const k of keyInData) {
    if (current[k] === undefined) {
      return null
    }
    current = current[k]
  }

  if (current?.marked) {
    amount = current.marked
    isMarged = true
  } else {
    amount = current.unmarked
    isMarged = false
  }

  return {
    price: amount,
    isMarged,
  }
}

const getAmountInSource = (key: string, isMarged: boolean): string => {
  if (!key) return ''

  const dataLocation = Object.values(key)[0]
  const indexInArray = dataLocation.indexOf('.')
  let valueIsMarged

  let amount
  let amountInDetail

  if (indexInArray !== -1) {
    amountInDetail = findAmountInNestedData(dataLocation)
    if (amountInDetail) {
      amount = amountInDetail.price
    }
    valueIsMarged = key.isMarged === 'auto' ? amountInDetail.isMarged : key.isMarged
  } else {
    amount = props.priceDetail[dataLocation]
    valueIsMarged = key.isMarged
  }

  if (valueIsMarged === isMarged) {
    const finalAmount =
      isMargedVisible.value && isMarged ? amount / (1 - getCoefficientFromMargin(props.sunstackMargin)) : amount
    return getNumberFormat(finalAmount, 2, 2) + '€'
  }
  return ''
}

const shouldDisplayItem = (subItem: any) => {
  const amountMarged = getAmountInSource(subItem, true)
  const amountNonMarged = getAmountInSource(subItem, false)
  const isAmountMargedValid = amountMarged !== '' && parseFloat(amountMarged) !== 0
  const isAmountNonMargedValid = amountNonMarged !== '' && parseFloat(amountNonMarged) !== 0

  return isAmountMargedValid || isAmountNonMargedValid
}
const getIncludedKeys = () => {
  const includedKeys = new Set()
  dataPrice.forEach(category => {
    const items = category[Object.keys(category)[0]]
    items.forEach(item => {
      includedKeys.add(Object.values(item)[0])
    })
  })
  return includedKeys
}

const getOtherKeys = () => {
  return Object.keys(props.priceDetail.other).map(key => `other.${key}`)
}

const generateCompleteAutresCategory = () => {
  const includedKeys = getIncludedKeys()
  const otherKeys = getOtherKeys()
  const missingItems = otherKeys
    .filter(key => !includedKeys.has(key))
    .map(key => ({
      [key.split('.')[1]]: key,
      isMarged: 'auto',
    }))
  return [...dataPrice[2]['Autres'], ...missingItems]
}

const updatedDataPrice = computed(() => {
  const updatedAutresCategory = generateCompleteAutresCategory()
  return [...dataPrice.slice(0, 2), { Autres: updatedAutresCategory }]
})
</script>

<template>
  <div>
    <div v-if="!props.priceDetail">
      <p class="text-body-2 text-center">Aucun détail de prix trouvé</p>
    </div>
    <VCard v-else>
      <VCardText>
        <VRow
          align="center"
          justify="center"
        >
          <VCol
            cols="12"
            xl="7"
          >
            <VSwitch
              v-model="isMargedVisible"
              label="Appliquer la marge aux montants"
              class="mb-5"
            />
            <div class="grid-price__detail pb-5">
              <h6
                class="text-left font-weight-bold text-h6 text-xl-h5 mb-2 pa-3 bg-primary-200 border-b rounded-ts price-detail__title"
              >
                Éléments
              </h6>
              <h6
                class="text-center font-weight-bold text-h6 text-xl-h5 mb-2 pa-3 bg-primary-200 border-b price-detail__title"
              >
                Prix margés
              </h6>
              <h6
                class="text-center font-weight-bold text-h6 text-xl-h5 mb-2 pa-3 bg-primary-200 border-b rounded-te price-detail__title"
              >
                Prix non margés
              </h6>
              <template
                v-for="(item, index) in updatedDataPrice"
                :key="index"
              >
                <h6 class="text-left font-weight-bold text-h6 mt-5 mb-2 px-2">{{ Object.keys(item)[0] }}</h6>
                <span></span>
                <span></span>
                <template
                  v-for="(subItem, subIndex) in item[Object.keys(item)[0]]"
                  :key="subIndex"
                >
                  <template v-if="shouldDisplayItem(subItem)">
                    <h4 class="text-left ps-6 text-body-1 my-1">
                      <VIcon
                        class="me-2 my-1"
                        icon="ph:dot-outline"
                        size="small"
                      />
                      <span class="text-body-1 text-capitalize">{{ Object.keys(subItem)[0] }}</span>
                    </h4>
                    <span class="font-weight-bold text-body-1 my-1 px-2 text-right">
                      {{ getAmountInSource(subItem, true) }}
                    </span>
                    <span class="font-weight-bold text-body-1 my-1 px-2">
                      {{ getAmountInSource(subItem, false) }}
                    </span>
                  </template>
                </template>
              </template>
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped lang="scss">
.grid-price__detail {
  display: grid;
  grid-template-columns: 4fr repeat(2, 1fr);
  grid-column-gap: 3px;
  grid-row-gap: 3px;

  border: rgb(var(--v-theme-secondary)) solid 1px;
  border-radius: 0.5rem;
}

.price-detail__title {
  color: black !important;
}
</style>
