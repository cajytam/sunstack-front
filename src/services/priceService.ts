import { get } from '@/services/api'

const getPriceFromSimulationId = (idSimulation: string, marginSunstack: string = null): Promise => {
  let params = `?simulation_id=${idSimulation}`
  if (marginSunstack) {
    params += `&margin_sunstack=${marginSunstack}`
  }

  return get('simulation_price', params)
}

export { getPriceFromSimulationId }
