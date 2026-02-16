import { fetchDeleteById, fetchGet, fetchPatchById, fetchPost } from '@/services/api'

const mappingNotificationRoute = {
  route: { simulation_show: 'simulation-show-simulationId' },
}

const getNotificationsForUser = uriUser => {
  return fetchGet('notification', '', true, '', {
    user: uriUser.split('/').pop(),
    'exists[typeNotif]': false,
  })
}

const getSpecifiqueNotificationsForUser = (uriUser, typeNotif) => {
  return fetchGet('notification', '', true, '', {
    user: uriUser.split('/').pop(),
    typeNotif,
  })
}

const postNotificationSurveyToRoles = (
  roles,
  title,
  message,
  urlId,
  query = null,
  urlName = 'simulation_show',
  urlIdName = 'simulationId',
) => {
  return fetchPost('notifSurveyRoles', {
    roles,
    title,
    message,
    urlName,
    urlIdName,
    urlId,
    query,
  })
}

const postNotificationSurveyToUser = (
  listOfUsers,
  title,
  message,
  urlId,
  query = null,
  urlName = 'simulation_show',
  urlIdName = 'simulationId',
) => {
  return fetchPost('notifSurveyUser', {
    listOfUsers,
    title,
    message,
    urlName,
    urlIdName,
    urlId,
    query,
  })
}

const patchNotification = (idNotification, data) => {
  return fetchPatchById('notification', idNotification, data)
}

const deleteNotification = idNotification => {
  return fetchDeleteById('notification', idNotification)
}

export {
  mappingNotificationRoute,
  getNotificationsForUser,
  getSpecifiqueNotificationsForUser,
  postNotificationSurveyToRoles,
  postNotificationSurveyToUser,
  patchNotification,
  deleteNotification,
}
