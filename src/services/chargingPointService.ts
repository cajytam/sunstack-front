import {
  dataFormatterBeforePersist,
  deleteById,
  fetchPatchById,
  fetchPost,
  getAll,
  patchById,
  post,
} from '@/services/api'
import { getCurrentDateForDatabase } from '@/utils/dateUtils'

const typeData = {
  power: 'float',
}

const getAllChargingPoint = () => {
  return getAll('chargingPoint')
}

const postChargingPointData = chargingPoint => {
  const formattedData = dataFormatterBeforePersist(chargingPoint, typeData)

  return post('chargingPoint', formattedData, true)
}

const patchChargingPointData = (chargingPointId, data) => {
  const formattedData = dataFormatterBeforePersist(data, typeData)

  return patchById('chargingPoint', chargingPointId, formattedData)
}

const postChargingPointToSimulation = (uriSimulation, idChargingPoint, quantity) => {
  return post('simulationChargingPoint', {
    simulation: uriSimulation,
    chargingPoint: `/api/charging_points/${idChargingPoint}`,
    quantity: quantity,
  })
}

const deleteChargingPointSimulation = idChargingPointSimulation => {
  return deleteById('simulationChargingPoint', idChargingPointSimulation)
}

/*
  GESTION DES PRIX
*/
const addChargingPointPrice = (chargingPointId, userUri, price, startDate, endDate = null) => {
  return fetchPost('chargingPoint', {
    chargingPoint: `/api/charging_points/${chargingPointId}`,
    updatedBy: userUri,
    price: Number.parseFloat(price),
    startDate,
    endDate,
    updatedAt: getCurrentDateForDatabase(),
  })
}

const patchChargingPointPrice = (chargingPointId, data) => {
  return fetchPatchById('chargingPoint', chargingPointId, data)
}

export {
  getAllChargingPoint,
  postChargingPointData,
  patchChargingPointData,
  postChargingPointToSimulation,
  deleteChargingPointSimulation,
  addChargingPointPrice,
  patchChargingPointPrice,
}
