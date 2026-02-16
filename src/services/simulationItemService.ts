import { dataFormatterBeforePersist, deleteById, post } from '@/services/api'

const typeDataSimulationItem = {
  nbPanel: 'int',
  energyPotential: 'int',
  inclinaison: 'int',
  azimuth: 'int',
}

const postSimulationItemData = simulationItem => {
  const formattedData = dataFormatterBeforePersist(simulationItem, typeDataSimulationItem)

  return post('simulation_item', formattedData, true)
}

const deleteSimulationItemData = simulationItemId => {
  return deleteById('simulation_item', simulationItemId)
}

export { postSimulationItemData, deleteSimulationItemData }
