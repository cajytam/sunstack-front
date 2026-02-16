const roles: Array = ['ROLE_ADMIN', 'ROLE_BO', 'ROLE_SALES', 'ROLE_INSTALLATEUR']

const roles_name: object = {
  ROLE_ADMIN: { fullname: 'Groupe administrateurs' },
  ROLE_BO: { fullname: 'Groupe Back-Office' },
  ROLE_SALES: { fullname: 'Groupe commerciaux' },
  ROLE_INSTALLATEUR: { fullname: 'Groupe installateurs' },
}

const list_roles: object = [
  { id: 'ROLE_ADMIN', name: 'Administrateurs' },
  { id: 'ROLE_BO', name: 'Back-Office' },
  { id: 'ROLE_SALES', name: 'Commerciaux' },
  { id: 'ROLE_INSTALLATEUR', name: 'Installateurs' },
]

export { roles, roles_name, list_roles }
