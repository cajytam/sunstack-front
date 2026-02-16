import { dataFormatterBeforePersist, fetchPatchById, fetchPost, get, post } from '@/services/api'
import { getCurrentDateForDatabase } from '@/utils/dateUtils'

const typeData = {
  power: 'float',
  price: 'float',
  yieldLossFirstYear: 'float',
  yieldLossOtherYears: 'float',
  voltageOpenCircuit: 'float',
  coefVoc: 'float',
  shortCircuitCurrent: 'float',
  coefIsc: 'float',
}

const postPanelData = panel => {
  const formattedData = dataFormatterBeforePersist(panel, typeData)

  return post('panel', formattedData, true)
}

const patchPanelData = (panelId, panel) => {
  const formattedData = dataFormatterBeforePersist(panel, typeData, false)

  return fetchPatchById('panel', panelId, formattedData)
}

const getPanelByTypeInstallation = typeInstallation => {
  return get('panel', '', true, 'get', {
    installationType: typeInstallation,
  })
}

const getActivePanelByInstallationLocation = (installationLocation, dateCreation = null) => {
  return get('panelGetActive', `/${installationLocation}${dateCreation !== null ? `/${dateCreation}` : ''}`)
}

/*
  GESTION DES PRIX
*/
const addPanelPrice = (panelId, userUri, price, startDate, endDate = null) => {
  return fetchPost('panelPrice', {
    panel: `/api/panels/${panelId}`,
    updatedBy: userUri,
    price: Number.parseFloat(price),
    startDate,
    endDate,
    updatedAt: getCurrentDateForDatabase(),
  })
}

const patchPanelPrice = (panelPriceId, data) => {
  return fetchPatchById('panelPrice', panelPriceId, data)
}

export {
  patchPanelData,
  postPanelData,
  getPanelByTypeInstallation,
  getActivePanelByInstallationLocation,
  addPanelPrice,
  patchPanelPrice,
}
