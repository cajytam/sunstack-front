import { dataFormatterBeforePersist, deleteById, get, patchById, post, sendByPatch } from '@/services/api'
import { getCurrentDateForDatabase } from '@/utils/dateUtils'

const typeDataSimulation = {
  consumptionPrice: 'float',
  consumptionQuantity: 'float',
  nbToitures: 'int',
  nbCharpentesNonVisibles: 'int',
  nbCharpentesBeton: 'int',
  manualPrice: 'float',
  status: 'int',
  otherBuildings: 'int',
  concrete: 'int',
  invisible: 'int',
}

const generateIdentifier = () => {
  return get('simulation', '/identifier/generate')
}

const getSimulationByIdentifier = identifier => {
  return get('simulation', '', true, 'get+ld', { identifier })
}

const getAllSimulationsNotArchived = () => {
  return get('simulation', '', true, 'get', {
    'exists[deletedAt]': false,
  })
}

const getAllSimulationsArchived = () => {
  return get('simulation', '', true, 'get', {
    'exists[deletedAt]': true,
  })
}

const getAllSimulationsSigned = () => {
  return get('simulation', '', true, 'get', {
    'exists[deletedAt]': false,
    'exists[signedAt]': true,
  })
}

const postSimulationData = simulation => {
  const simulationFormatted = dataFormatterBeforePersist(simulation, typeDataSimulation)

  return post('simulation', simulationFormatted, true)
}

const patchSimulationData = (simulationId, simulation) => {
  const simulationFormatted = dataFormatterBeforePersist(simulation, typeDataSimulation)

  patchById('simulation', simulationId, simulationFormatted)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)
    })
    .catch(err => {
      console.error(err)
    })
}

const typeDataItem = {
  nbPanel: 'int',
  energyPotential: 'int',
}

const postSimulationItems = (nbPanel, energyPotential, uriSimulation, uriPdl, uriZone) => {
  const dataItem = {
    energyPotential: Number.parseInt(energyPotential),
    nbPanel: Number.parseInt(nbPanel),
    simulation: uriSimulation,
    pdl: uriPdl,
    zone: uriZone,
  }

  return post('simulation_item', dataItem, true)
}

const patchSimulationItems = (itemId, item) => {
  const itemFormatted = dataFormatterBeforePersist(item, typeDataItem)

  patchById('simulation_item', itemId, itemFormatted)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)
    })
    .catch(err => {
      console.error(err)
    })
}

const deleteSimulation = idSimulation => {
  return sendByPatch('simulation', idSimulation, {
    deletedAt: getCurrentDateForDatabase(),
  })
}

const restoreSimulation = idSimulation => {
  return sendByPatch('simulation', idSimulation, {
    deletedAt: null,
  })
}

const deleteSimulationItem = itemId => {
  return deleteById('simulation_item', itemId)
}

export {
  generateIdentifier,
  getSimulationByIdentifier,
  getAllSimulationsNotArchived,
  getAllSimulationsArchived,
  getAllSimulationsSigned,
  postSimulationData,
  patchSimulationData,
  postSimulationItems,
  patchSimulationItems,
  deleteSimulation,
  restoreSimulation,
  deleteSimulationItem,
}
