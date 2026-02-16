import { dataFormatterBeforePersist, deleteById, patchById, post } from '@/services/api'

const typeData = {}

const postBuildingData = async building => {
  const formattedData = dataFormatterBeforePersist(building, typeData)

  return await post('building', formattedData, true)
}

const patchBuildingData = async (building, idBuilding) => {
  const formattedData = dataFormatterBeforePersist(building, typeData, false)
  return await patchById('building', idBuilding, formattedData, true)
}

const removeBuildingData = async idBuilding => {
  return await deleteById('building', idBuilding)
}

export { postBuildingData, patchBuildingData, removeBuildingData }
