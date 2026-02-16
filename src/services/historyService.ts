import { get, post } from '@/services/api'

const postSimulationHistory = (idSimulation, title, userURI, description = null) => {
  return post('history', {
    simulation: `/api/simulations/${idSimulation}`,
    title,
    userId: userURI,
    description,
  })
}

const postSimulationStatus = (idSimulation, userURI, statusId, description) => {
  return post('history', {
    simulation: `/api/simulations/${idSimulation}`,
    element: 'status',
    elementId: statusId,
    title: 'Modification du statut',
    userId: userURI,
    description,
  })
}

const getSimulationHistory = simulationId => {
  return get('history', '', true, 'get', {
    simulation: simulationId,
  })
}

export { postSimulationHistory, postSimulationStatus, getSimulationHistory }
