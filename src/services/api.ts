import axios from 'axios'

/* const authToken = localStorage.getItem('x-auth-token')
if (authToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
} */

const baseURL = `${import.meta.env.VITE_API_URI}api`

const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URI}api/`,
})

const listURIResources = {
  simulation: '/simulations',
  simulation_item: '/simulation_items',
  simulation_option: '/simulation_options',
  simulation_price: '/price/simulation',
  temp_customer: '/temp_customers',
  company_type: '/company_types',
  profile: '/profiles',
  siret: '/siret',
  addressSuggestion: '/searchAddress',
  panel: '/panels',
  panelPrice: '/panel_prices',
  pdl: '/pdls',
  user: '/users',
  signature: '/signatures',
  signatureSimulation: '/signature_simulations',
  location: '/locations',
  history: '/histories',
  survey: '/surveys',
  surveyStep: '/survey_steps',
  surveyItem: '/survey_items',
  surveyImage: '/file/survey',
  surveySimulation: '/survey_simulations',
  fileSimulation: '/file_simulations',
  fileSurvey: '/file_surveys',
  inverter: '/inverters',
  inverterPrice: '/inverter_prices',
  inverterCable: '/inverter_cables',
  inverterCablePrice: '/inverter_cable_prices',
  battery: '/batteries',
  chargingPoint: '/charging_points',
  simulationChargingPoint: '/simulation_charging_points',
  batteryPrice: '/battery_prices',
  statusGroup: '/status_groups',
  status: '/statuses',
  StatusSimulation: '/status_simulations',
  sendEmailResetPassword: '/email-reset-password',
  resetPassword: '/reset-password',
  price: '/prices',
  sale: '/sales',
  notification: '/notifications',
  notifSurveyRoles: '/notif/survey-roles',
  notifSurveyUser: '/notif/survey-user',
  taskSimulation: '/task_simulations',
  tasks: '/task_simulation',
  taskCommentSimulation: '/task_comment_simulations',
  fileTask: '/file_tasks',
  notifTask: '/notif/task-user',
  docCategory: '/doc_categories',
  docFile: '/doc_files',
  docHistory: '/doc_histories',
  panelGetActive: '/panels/get-active',
  calculationInverter: '/inverters/sizing',
  pricingFactorTypes: '/pricing_factor_types',
  pricingFactorPrices: '/pricing_factor_prices',
  pricingFactorConditions: '/pricing_factor_conditions',
  building: '/buildings',
  pvgis: '/pvgis/radiation',
}

const configs = {
  get: {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
  'get+ld': {
    headers: {
      Accept: 'application/ld+json',
      'Content-Type': 'application/json',
    },
  },
  'get+ld-patch': {
    headers: {
      Accept: 'application/ld+json',
      'Content-Type': 'application/merge-patch+json',
    },
  },
  multipart: {
    headers: {
      Accept: 'application/ld+json',
      'Content-Type': 'multipart/form-data',
    },
  },
}

const dataFormatterBeforePersist = (source, formatData = {}, ignoreNullValue = true) => {
  if (formatData.length < 1) return source

  const data = {}
  for (const key in source) {
    if (undefined !== source[key]) {
      if (source[key] === null && ignoreNullValue) continue

      if (key in formatData) {
        if (typeof formatData[key] === 'object') {
          if ('api' in formatData[key]) {
            data[key] = `/api/${formatData[key].api}/${source[key]}`
          }
        } else {
          switch (formatData[key]) {
            case 'float':
              data[key] = Number.parseFloat(source[key])
              break
            case 'int':
              data[key] = Number.parseInt(source[key])
              break
            case 'string':
              data[key] = source[key].toString()
              break
            case 'no_space':
              data[key] = source[key].replaceAll(/\s/g, '')
              break
            default:
              data[key] = source[key]
              console.warn(`Pas de formatage prévu pour le type (${formatData[key]})`)
          }
        }
      } else {
        data[key] = source[key]
      }
    }
  }
  return data
}

const get = (mainResource, restOfResource = '', isUseCredentials = true, configType = 'get', parameters = {}) => {
  return apiClient.get(listURIResources[mainResource] + restOfResource, {
    ...configs[configType],
    withCredentials: isUseCredentials,
    params: parameters,
  })
}

const fetchGet = (mainResource, restOfResource = '', isCredentials = true, configType = 'get', params = null) => {
  return fetch(
    baseURL +
      listURIResources[mainResource] +
      (restOfResource ? `/${restOfResource}` : '') +
      (params ? `?${new URLSearchParams({ ...params })}` : ''),
    {
      method: 'GET',
      credentials: isCredentials ? 'include' : 'omit',
      ...configs[configType],
    },
  ).then(res => res.json())
}

const getAll = (resource, isUseCredentials = true, configType = 'get') => {
  return apiClient.get(listURIResources[resource], {
    ...configs[configType],
    withCredentials: isUseCredentials,
  })
}

const getById = (resource, id, isUseCredentials = true, configType = 'get') => {
  return apiClient.get(`${listURIResources[resource]}/${id}`, {
    ...configs[configType],
    withCredentials: isUseCredentials,
  })
}

const fetchGetById = (resource, id, isCredentials = true, configType = 'get') => {
  return fetch(`${baseURL + listURIResources[resource]}/${id}`, {
    method: 'GET',
    credentials: isCredentials ? 'include' : 'omit',
    ...configs[configType],
  }).then(res => res.json())
}

const post = (resource, data, isUseCredentials = true, configType = 'get+ld') => {
  return apiClient.post(listURIResources[resource], data, {
    ...configs[configType],
    withCredentials: isUseCredentials,
  })
}

const fetchPost = (resource, data, isCredentials = true, configType = 'get+ld', restOfResource = '') => {
  return fetch(baseURL + listURIResources[resource] + restOfResource, {
    method: 'POST',
    body: configType === 'multipart' ? data : JSON.stringify(data),
    credentials: isCredentials ? 'include' : 'omit',
    ...configs[configType],
  }).then(res => res.json())
}

const patchById = (resource, id, data, isUseCredentials = true, configType = 'get+ld-patch') => {
  return apiClient.patch(`${listURIResources[resource]}/${id}`, data, {
    ...configs[configType],
    withCredentials: isUseCredentials,
  })
}

const fetchPatchById = (resource, id, data, isCredentials = true, configType = 'get+ld-patch') => {
  return fetch(`${baseURL + listURIResources[resource]}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    credentials: isCredentials ? 'include' : 'omit',
    ...configs[configType],
  }).then(res => res.json())
}

const getZone = (department, panelTilt, roofOrientation, isUseCredentials = true, configType = 'get+ld') => {
  const paramsURL = {
    params: {
      department,
      panelTilt,
      roofOrientation,
    },
  }

  const paramsRequest = {
    ...configs[configType],
    ...paramsURL,
    withCredentials: isUseCredentials,
  }

  return apiClient.get('zones', paramsRequest)
}

const deleteById = (resource, id, isUseCredentials = true) => {
  return apiClient.delete(`${listURIResources[resource]}/${id}`, {
    withCredentials: isUseCredentials,
  })
}

const fetchDeleteById = (resource, id, isCredentials = true) => {
  return fetch(`${baseURL + listURIResources[resource]}/${id}`, {
    method: 'DELETE',
    credentials: isCredentials ? 'include' : 'omit',
  })
}

const sendByPatch = (resource, id, data) => {
  return fetch(`${baseURL + listURIResources[resource]}/${id}`, {
    credentials: 'include',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/merge-patch+json',
    },
    body: JSON.stringify({
      ...data,
    }),
  })
}

export {
  get,
  fetchGet,
  getAll,
  getById,
  fetchGetById,
  post,
  fetchPost,
  patchById,
  fetchPatchById,
  getZone,
  dataFormatterBeforePersist,
  deleteById,
  fetchDeleteById,
  sendByPatch,
}
