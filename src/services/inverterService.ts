import { dataFormatterBeforePersist, fetchPatchById, fetchPost, get, getAll, patchById, post } from '@/services/api'
import { getCurrentDateForDatabase } from '@/utils/dateUtils'

const typeData = {
  power: 'float',
  price: 'float',
  maxInputPower: 'float',
  nbMppt: 'int',
  inverterCable: { api: 'inverter_cables' },
  nbStringPerMppt: 'int',
  mpptVoltageRangeMin: 'int',
  mpptVoltageRangeMax: 'int',
  maxDcInputVoltage: 'int',
  maxShortCircuitCurrentMppt: 'int',
  maxDcInputCurrentMppt: 'int',
}

const postInverterData = inverter => {
  const formattedData = dataFormatterBeforePersist(inverter, typeData)

  return post('inverter', formattedData, true)
}

const patchInverterData = (inverterId, inverter) => {
  const formattedData = dataFormatterBeforePersist(inverter, typeData)

  return patchById('inverter', inverterId, formattedData)
}

const getListInvertersRequired = (powerInstallation, typeInstallation) => {
  return get('inverter', `/number/${Number.parseInt(powerInstallation)}/${typeInstallation}`)
}

const getInverterSizing = (nbPanel, idPanel, chefLieu, azimuthRatio, electricalPhase, IsAddBatterie) => {
  return post('calculationInverter', {
    nbPanel,
    idPanel,
    chefLieu,
    azimuthRatio,
    electricalPhase,
    addBatterie: IsAddBatterie,
  })
}

const getAllInverterCable = () => {
  return getAll('inverterCable')
}

const postInverterCable = inverterCable => {
  return post('inverterCable', inverterCable, true)
}

const patchInverterCable = (inverterCableId, data) => {
  return patchById('inverterCable', inverterCableId, data)
}

/*
  GESTION DES PRIX
*/
const addInverterPrice = (inverterId, userUri, price, priceType, startDate, endDate = null) => {
  return fetchPost('inverterPrice', {
    inverter: `/api/inverters/${inverterId}`,
    updatedBy: userUri,
    price: Number.parseFloat(price),
    type: priceType,
    startDate,
    endDate,
    updatedAt: getCurrentDateForDatabase(),
  })
}

const addInverterCablePrice = (inverterCableId, userUri, price, startDate, endDate = null) => {
  return fetchPost('inverterCablePrice', {
    inverterCable: `/api/inverter_cables/${inverterCableId}`,
    updatedBy: userUri,
    price: Number.parseFloat(price),
    startDate,
    endDate,
    updatedAt: getCurrentDateForDatabase(),
  })
}

const patchInverterPrice = (inverterPriceId, data) => {
  return fetchPatchById('inverterPrice', inverterPriceId, data)
}

const patchInverterCablePrice = (inverterCablePriceId, data) => {
  return fetchPatchById('inverterCablePrice', inverterCablePriceId, data)
}

export {
  postInverterData,
  patchInverterData,
  getListInvertersRequired,
  getAllInverterCable,
  postInverterCable,
  patchInverterCable,
  getInverterSizing,
  addInverterPrice,
  addInverterCablePrice,
  patchInverterPrice,
  patchInverterCablePrice,
}
