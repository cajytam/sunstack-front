const isEmptyObject = obj => {
  for (const name in obj) return false

  return true
}

const noSpacesCounter = (value?: string | undefined): number => {
  return value?.replaceAll(/\s/g, '').length || 0
}

const hydrateReactiveObject = (reactiveData, sourceData, transformArrayToLines = false) => {
  const tempData = {}
  let data
  for (const key in sourceData) {
    data = reactiveData[key] === undefined ? sourceData[key] : reactiveData[key]
    if (transformArrayToLines && typeof data === 'object' && !isProxy(data))
      data = `- ${Object.values(data).join('\n- ')}`

    tempData[key] = data
  }

  return tempData
}

const getJsonOfChangedValues = (obj1, obj2) => {
  let result = {}
  let change
  for (const key in obj2) {
    if (typeof obj2[key] == 'object' && typeof obj1[key] == 'object') {
      change = getJsonOfChangedValues(obj1[key], obj2[key])
      if (!(obj1[key] === null && obj1[key] === null)) {
        if (!isEmptyObject(change)) result[key] = change
        else if (obj2[key].length > 0 && obj1[key].length === 0) result[key] = obj2[key]
      }
    } else if (obj2[key] != obj1[key]) {
      if (obj1.length > 0 && obj2.length > 0) result = obj2
      else result[key] = obj2[key]
    }
  }

  return result
}

const isStringValid = data => {
  return data !== null && data.trim().length > 0
}

const isIntValid = data => {
  return data !== null && data > 0
}

export { noSpacesCounter, hydrateReactiveObject, getJsonOfChangedValues, isStringValid, isIntValid }
