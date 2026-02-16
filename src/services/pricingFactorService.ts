import { PricingFactorCondition, PricingFactorPrice, PricingFactorType } from '@core/types'
import { dataFormatterBeforePersist, deleteById, getAll, patchById, post } from '@/services/api'
import { typeRoofList } from '@/services/simulationOptionsService'

const conditionsTypes: object = {
  panel: { name: 'Panneau', type: 'number' },
  battery: { name: 'Batterie', type: 'number' },
  installation: { name: 'Devis', type: 'number' },
  building: { name: 'Bâtiment', type: 'number' },
  wp_total: { name: 'Watt-crête', type: 'number' },
  inverter: { name: 'Onduleur', type: 'number' },
  roof_type: { name: 'Type de toiture', type: 'list', list: [...typeRoofList] },
  location_type: { name: "Type d'installation", type: 'list', list: ['Toiture', 'Sol', 'Ombrière'] },
  customer_type: { name: 'Typologie client', type: 'list', list: ['Particulier', 'Professionnel'] },
  asbestos: { name: 'Amiante', type: 'bool' },
}

const conditionsLimitTypes: object = {
  by: { name: 'Tous les' },
  from: { name: 'A partir de' },
}

const typeData = {}

const typeDataPrice = {
  markedPrice: 'float',
  unmarkedPrice: 'float',
  applyUntilNbPanel: 'int',
}

const typeDataCondition = {
  value: 'string',
}

/**
 * PRINCING FACTOR TYPES
 */
const getAllPricingFactorTypes = () => {
  return getAll('pricingFactorTypes', true, 'get+ld')
}

const postPricingFactorType = (pricingFactorType: PricingFactorType) => {
  const formattedData = dataFormatterBeforePersist(pricingFactorType, typeData)

  return post('pricingFactorTypes', formattedData, true)
}

const patchPricingFactorType = (pricingFactorTypeId: number, pricingFactorType: PricingFactorType) => {
  const formattedData = dataFormatterBeforePersist(pricingFactorType, typeData)

  return patchById('pricingFactorTypes', pricingFactorTypeId, formattedData)
}

/**
 * PRINCING FACTOR PRICE
 */
const postPricingFactorPrice = (pricingFactorPrice: PricingFactorPrice) => {
  const formattedData = dataFormatterBeforePersist(pricingFactorPrice, typeDataPrice)

  return post('pricingFactorPrices', formattedData, true)
}

const patchPricingFactorPrice = (pricingFactorPriceId: number, pricingFactorPrice: PricingFactorPrice) => {
  const formattedData = dataFormatterBeforePersist(pricingFactorPrice, typeDataPrice, false)

  return patchById('pricingFactorPrices', pricingFactorPriceId, formattedData)
}

/**
 * PRINCING FACTOR CONDITIONS
 */
const postPricingFactorCondition = (pricingFactorCondition: PricingFactorCondition) => {
  const formattedData = dataFormatterBeforePersist(pricingFactorCondition, typeDataCondition)

  return post('pricingFactorConditions', formattedData, true)
}

const deletePricingFactorCondition = (idPricingFactorCondition: number) => {
  return deleteById('pricingFactorConditions', idPricingFactorCondition)
}

export {
  conditionsTypes,
  conditionsLimitTypes,
  getAllPricingFactorTypes,
  postPricingFactorType,
  patchPricingFactorType,
  postPricingFactorPrice,
  patchPricingFactorPrice,
  postPricingFactorCondition,
  deletePricingFactorCondition,
}
