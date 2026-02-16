const getArrayOfValueFromArrayOfObject = (
  arrayOrigin,
  key,
  isAddIdInObject = true,
  keySousArray = null,
  nomKeyInObject = 'id',
  nomValueInObject = 'name',
) => {
  const arrayData = []
  let collection
  let keyId
  if (typeof arrayOrigin === 'object' && 'hydra:member' in arrayOrigin) collection = arrayOrigin['hydra:member']
  else collection = arrayOrigin

  collection.map(e => {
    let value
    if (isAddIdInObject) {
      if ('@id' in e) keyId = '@id'
      else keyId = 'id'

      if (keySousArray) value = { [nomKeyInObject]: e[keyId], [nomValueInObject]: e[key][keySousArray] }
      else value = { [nomKeyInObject]: e[keyId], [nomValueInObject]: e[key] }
    } else {
      if (keySousArray) value = e[key][keySousArray]
      else value = e[key]
    }
    arrayData.push(value)
  })

  return arrayData
}

/*
Check if a value generated from key (value separated with an "_") exists in a object
 */
const isInListOfObject = (obj: object, value: string | number, keys: string[]) => {
  return obj.some(item => {
    let valueToFind = ''

    keys.forEach(key => {
      if (key in item) {
        valueToFind = valueToFind + (valueToFind.length > 0 ? '_' : '') + item[key]
      }
    })
    return valueToFind === value
  })
}

export { getArrayOfValueFromArrayOfObject, isInListOfObject }
