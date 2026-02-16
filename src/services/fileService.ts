import { fetchGet, post } from '@/services/api'

const getFileSimulationBySimulation = idSimulation => {
  return fetchGet('fileSimulation', '', true, 'get', {
    simulation: idSimulation,
  })
}

const postFileSimulation = (idSimulation, label, file, userUri) => {
  return post(
    'fileSimulation',
    {
      file,
      label,
      simulation: `/api/simulations/${idSimulation}`,
      user: userUri,
    },
    true,
    'multipart',
  )
}

/**
 * Task Simulation
 */
const postFileTaskSimulation = (uriTask, file, userUri) => {
  return post(
    'fileTask',
    {
      task: uriTask,
      file,
      user: userUri,
    },
    true,
    'multipart',
  )
}

export { getFileSimulationBySimulation, postFileSimulation, postFileTaskSimulation }
