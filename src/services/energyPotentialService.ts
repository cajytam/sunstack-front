import { dataFormatterBeforePersist, post } from '@/services/api'

const typeData = {
  inclinaison: 'int',
  azimuth: 'int',
  lat: 'float',
  lon: 'float',
}

const getPVGISDetailedEnergyPotential = pvgisData => {
  const formattedData = dataFormatterBeforePersist(pvgisData, typeData)

  return post('pvgis', formattedData)
}

export { getPVGISDetailedEnergyPotential }
