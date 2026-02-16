import { dataFormatterBeforePersist, fetchPatchById, fetchPost, patchById, post } from '@/services/api'
import { getCurrentDateForDatabase } from '@/utils/dateUtils'

const typeData = {
  capacity: 'float',
}

const postBatteryData = battery => {
  const formattedData = dataFormatterBeforePersist(battery, typeData)

  return post('battery', formattedData, true)
}

const patchBatteryData = (batteryId, battery) => {
  const formattedData = dataFormatterBeforePersist(battery, typeData)

  return patchById('battery', batteryId, formattedData)
}

/*
  GESTION DES PRIX
*/
const addBatteryPrice = (batteryId, userUri, price, startDate, endDate = null) => {
  return fetchPost('batteryPrice', {
    battery: `/api/batteries/${batteryId}`,
    updatedBy: userUri,
    price: Number.parseFloat(price),
    startDate,
    endDate,
    updatedAt: getCurrentDateForDatabase(),
  })
}

const patchBatteryPrice = (batteryPriceId, data) => {
  return fetchPatchById('batteryPrice', batteryPriceId, data)
}

export { postBatteryData, patchBatteryData, addBatteryPrice, patchBatteryPrice }
