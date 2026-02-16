import { deleteById, get, post } from '@/services/api'

const getSignature = (uriSimulation, purposeSignature) => {
  return get('signatureSimulation', '', true, '', {
    simulation: uriSimulation.split('/').pop(),
    purpose: purposeSignature,
  })
}

const postSignature = (uriSimulation, signatureObject) => {
  return post('signature', signatureObject, true)
}

const postSimulationSignature = (uriSimulation, uriSignature, purpose) => {
  const data = {
    simulation: uriSimulation,
    signature: uriSignature,
    purpose,
  }

  return post('signatureSimulation', data, true)
}

const deleteSignature = signatureId => {
  return deleteById('signature', signatureId)
}

const deleteSignatureSimulation = signatureSimulationId => {
  return deleteById('signatureSimulation', signatureSimulationId)
}

export { getSignature, postSignature, postSimulationSignature, deleteSignature, deleteSignatureSimulation }
