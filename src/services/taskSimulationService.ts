import { fetchGet, fetchPatchById, fetchPost } from '@/services/api'
import { id } from 'vuetify/locale'

interface Task {
  idSimulation: string
  title: string
  description: string
  openedBy: string
  targetGroups?: Array
  targetUser?: string
}

interface TaskComment {
  uriUser: string
  comment: string
  idTask: string | number
}

const getAllTasksFromSimulation = idSimulation => {
  return fetchGet('taskSimulation', '', true, 'get', { simulation: idSimulation })
}

const postTaskSimulationData = (task: Task) => {
  return fetchPost('taskSimulation', {
    title: task.title,
    description: task.description,
    simulation: `/api/simulations/${task.idSimulation}`,
    openedBy: task.openedBy,
    targetGroups: task.targetGroups,
    targetUser: task.targetUser,
  })
}

const patchTaskSimulationData = (taskId, data) => {
  return fetchPatchById('taskSimulation', taskId, data)
}

const postTaskSimulationCommentData = (comment: TaskComment) => {
  return fetchPost('taskCommentSimulation', {
    addedBy: comment.uriUser,
    comment: comment.comment,
    task: `/api/task_simulations/${comment.idTask}`,
  })
}

const getTasksOpenedForUser = (idUser: number) => {
  return fetchGet('tasks', `target/${idUser}`)
}

const getTasksOpenedByUser = (idUser: number) => {
  return fetchGet('tasks', `target/${idUser}`)
}

const getAllTasksOpenedByUser = (idUser: number) => {
  return fetchGet('tasks', `all/${idUser}`)
}

const postNotificationTask = (
  idUserWhichSent,
  rolesTargeted,
  usersTargeted,
  title,
  message,
  urlId,
  userOpenedId,
  query = null,
  typeNotification = null,
  urlName = 'simulation_show',
  urlIdName = 'simulationId',
) => {
  return fetchPost('notifTask', {
    idUserWhichSent,
    rolesTargeted,
    usersTargeted,
    title,
    message,
    urlId,
    userOpenedId,
    query,
    typeNotification,
    urlName,
    urlIdName,
  })
}

export {
  getAllTasksFromSimulation,
  postTaskSimulationData,
  patchTaskSimulationData,
  postTaskSimulationCommentData,
  getTasksOpenedForUser,
  getTasksOpenedByUser,
  getAllTasksOpenedByUser,
  postNotificationTask,
}
