import { dataFormatterBeforePersist, getAll, patchById, post } from '@/services/api'

const typeData = {}

const getAllCompanyType = () => {
  return getAll('company_type', true, 'get+ld')
}

const postCompanyTypeData = companyType => {
  const formattedData = dataFormatterBeforePersist(companyType, typeData)

  return post('company_type', formattedData, true)
}

const patchCompanyTypeData = (companyTypeId, companyType) => {
  const formattedData = dataFormatterBeforePersist(companyType, typeData)

  patchById('company_type', companyTypeId.split('/').pop(), formattedData)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)
    })
    .catch(err => {
      console.error(err)
    })
}

export { getAllCompanyType, postCompanyTypeData, patchCompanyTypeData }
