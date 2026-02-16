import { dataFormatterBeforePersist, get, post } from '@/services/api'

const typeData = {}

const getStatusesSimulation = simulationId => {
  return get('StatusSimulation', '', true, 'get', {
    simulation: simulationId,
  })
}

const postStatusSimulation = (data, simulationId, userURI) => {
  const formattedData = dataFormatterBeforePersist(
    {
      ...data,
      simulation: `/api/simulations/${simulationId}`,
      ownedBy: userURI,
    },
    typeData,
  )

  return post('StatusSimulation', formattedData, true)
}

export { getStatusesSimulation, postStatusSimulation }
