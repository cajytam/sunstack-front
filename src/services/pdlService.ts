import { dataFormatterBeforePersist, deleteById, patchById, post } from '@/services/api'

const typeData = {
  streetNumber: 'string',
}

const postPDLData = pdl => {
  const formattedData = dataFormatterBeforePersist(pdl, typeData)

  return post('pdl', formattedData, true)
}

const patchPDLData = (pdlId, pdl) => {
  const formattedData = dataFormatterBeforePersist(pdl, typeData)

  patchById('pdl', pdlId.split('/').pop(), formattedData)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)
    })
    .catch(err => {
      console.error(err)
    })
}

const deletePDL = pdlId => {
  return deleteById('pdl', pdlId)
}

export { postPDLData, patchPDLData, deletePDL }
