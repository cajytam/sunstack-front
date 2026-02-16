import { dataFormatterBeforePersist, deleteById, get, patchById, post } from '@/services/api'

const typeData = {
  sort: 'int',
}

const getStatusFromGroup = statusGroupId => {
  return get('status', '', true, 'get', {
    statusGroup: statusGroupId,
  })
}

const postStatusData = status => {
  const formattedData = dataFormatterBeforePersist(status, typeData)

  return post('status', formattedData, true)
}

const patchStatusData = (statusId, status) => {
  const formattedData = dataFormatterBeforePersist(status, typeData)

  return patchById('status', statusId, formattedData)
}

const deleteStatus = statusId => {
  return deleteById('status', statusId)
}

export { postStatusData, patchStatusData, deleteStatus, getStatusFromGroup }
