import axios from 'axios'
import { ability } from '@/plugins/casl/casl'
import { getAbilityFromRole } from '@/plugins/casl/manageAbilityFromRole'

const BASE_URI = import.meta.env.VITE_API_URI

export const useUserStore = defineStore('userStore', {
  state: () => ({
    authUser: null,
    roles: [],
    limits: {},
  }),
  getters: {
    user: state => state.authUser,
  },
  actions: {
    async getUser() {
      await axios
        .get(`${BASE_URI}api/me`, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('x-auth-token')}`,
          },
          withCredentials: true,
        })
        .then(res => {
          this.authUser = res.data

          const caslAbilities = getAbilityFromRole(res.data.roles)

          ability.update(caslAbilities)

          localStorage.setItem('avatar', res.data.picture ? `users/${res.data.picture}` : 'logo/no-avatar.jpg')
          localStorage.setItem('fullname', res.data.fullName ? res.data.fullName : '')
          localStorage.setItem('title', res.data.title ? res.data.title : '')
        })
        .catch(() => {
          this.authUser = null
        })
    },
  },
})
