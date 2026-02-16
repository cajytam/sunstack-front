import { dataFormatterBeforePersist, get, patchById, post } from '@/services/api'

const typeDataUser = {}

const postUser = user => {
  const userFormatted = dataFormatterBeforePersist(user, typeDataUser)

  return post('user', userFormatted, true)
}

const patchUser = (userId, user) => {
  const userFormatted = dataFormatterBeforePersist(user, typeDataUser)

  patchById('user', userId, userFormatted)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)
    })
    .catch(err => {
      console.error(err)
    })
}

const getByRole = role => {
  return get('user', '', true, 'get+ld', {
    roles: role,
    'exists[deletedAt]': false,
  })
}

const getAllUsers = () => {
  return get('user', '', true, 'get+ld', {
    'exists[deletedAt]': false,
  })
}

export { postUser, patchUser, getByRole, getAllUsers }
