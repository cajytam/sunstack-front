import { fetchDeleteById, fetchGet, fetchGetById, fetchPatchById, fetchPost } from '@/services/api'

const statusesSurvey = {
  A: {
    text: 'En attente de validation',
    color: 'yellow-sunstack',
    control: [
      {
        label: 'Voir',
        color: 'info',
      },
    ],
    index: 2,
  },
  B: {
    text: 'Brouillon',
    color: 'purple',
    control: [
      {
        label: 'Éditer',
        color: 'secondary',
      },
    ],
    index: 0,
  },
  V: {
    text: 'Validé',
    color: 'success',
    control: [
      {
        label: 'Ouvrir',
        color: 'secondary',
      },
    ],
    icon: {
      icon: 'icon-park-outline:correct',
      color: 'success',
    },
    index: 1,
  },
  R: {
    text: 'Refusé',
    color: 'error',
    control: [
      {
        label: 'Ouvrir',
        color: 'secondary',
      },
    ],
    icon: {
      icon: 'icon-park-outline:error',
      color: 'error',
    },
    index: 4,
  },
  C: {
    text: 'à corriger',
    color: 'warning',
    control: [
      {
        label: 'Corriger',
        color: 'warning',
      },
    ],
    icon: {
      icon: 'ph:warning-bold',
      color: 'warning',
    },
    index: 3,
  },
}

/**
 * SURVEY STEP
 */
const getSurveysSteps = () => {
  return fetchGet('surveyStep')
}

const postSurveysStep = data => {
  return fetchPost('surveyStep', data)
}

const patchSurveysStep = (idSurveyStep, data) => {
  return fetchPatchById('surveyStep', idSurveyStep, data)
}

/**
 * SURVEY
 */
const postSurvey = (idSimulation, idSurveyItem, uriUser, content, statusValidation) => {
  return fetchPost('survey', {
    content,
    simulation: `/api/simulations/${idSimulation}`,
    surveyItem: `/api/survey_items/${idSurveyItem}`,
    sentBy: uriUser,
    statusValidation,
  })
}

const patchSurvey = (idSurvey, data) => {
  return fetchPatchById('survey', idSurvey, data)
}

/**
 * SURVEY SIMULATION
 */
const getSurveySimulation = idSimulation => {
  return fetchGetById('surveySimulation', idSimulation)
}

const getAllSurveySimulation = () => {
  return fetchGet('surveySimulation')
}

const postSurveySimulation = (idSimulation, idSurveyStep, status) => {
  return fetchPost('surveySimulation', {
    simulation: `/api/simulations/${idSimulation}`,
    surveyStep: `/api/survey_steps/${idSurveyStep}`,
    status,
  })
}

const patchSurveySimulation = (idSurveySimulation, data) => {
  return fetchPatchById('surveySimulation', idSurveySimulation, data)
}

/**
 * ITEM SURVEY
 */
const getItemsSurveyFromStep = idSurveyStep => {
  return fetchGet('surveyItem', '', true, 'get', {
    'surveyStep.id': idSurveyStep,
  })
}

const postItemSurvey = data => {
  return fetchPost('surveyItem', data)
}

const patchItemSurvey = (idItemSurvey, data) => {
  return fetchPatchById('surveyItem', idItemSurvey, data)
}

/**
 * FILE SURVEY
 */
const getFileSurveyBySurvey = idSurvey => {
  return fetchGet('fileSurvey', '', true, 'get', { survey: idSurvey })
}

const deleteFileSurvey = idSurvey => {
  return fetchDeleteById('fileSurvey', idSurvey)
}

const rotateImageSurvey = (idFileSurvey, direction) => {
  return fetchGet('surveyImage', `${idFileSurvey}/rotate/${direction}`)
}

export {
  statusesSurvey,
  postSurvey,
  patchSurvey,
  getSurveysSteps,
  postSurveysStep,
  patchSurveysStep,
  getAllSurveySimulation,
  getSurveySimulation,
  postSurveySimulation,
  patchSurveySimulation,
  getItemsSurveyFromStep,
  postItemSurvey,
  patchItemSurvey,
  getFileSurveyBySurvey,
  deleteFileSurvey,
  rotateImageSurvey,
}
