import { dataFormatterBeforePersist, getById, patchById, post } from '@/services/api'

const typeData = {
  customerType: 'int',
  phoneNumber: 'no_space',
  siret: 'no_space',
  streetNumber: 'string',
}

const getTempCustomerData = idTempCustomer => {
  return getById('temp_customer', idTempCustomer)
}

const postTempCustomerData = tempCustomer => {
  const formattedData = dataFormatterBeforePersist(tempCustomer, typeData)

  return post('temp_customer', formattedData, true)
}

const patchTempCustomerData = (tempCustomerId, tempCustomer) => {
  const formattedData = dataFormatterBeforePersist(tempCustomer, typeData)

  return patchById(
    'temp_customer',
    isNaN(Number.parseInt(tempCustomerId)) ? tempCustomerId.split('/').pop() : tempCustomerId,
    formattedData,
  )
}

export { getTempCustomerData, postTempCustomerData, patchTempCustomerData }
