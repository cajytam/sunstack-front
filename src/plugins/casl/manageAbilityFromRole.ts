import { UserAbility } from '@/plugins/casl/AppAbility'

const roleAbilities: Record<string, UserAbility> = {
  ROLE_USER: {
    action: 'standard',
    subject: 'all',
  },
  ROLE_ADMIN: {
    action: 'manage',
    subject: 'all',
  },
  ROLE_SALES: {
    action: 'standard',
    subject: 'sales',
  },
}

const getAbilityFromRole = (userRoles: string[]): UserAbility[] => {
  const abilities: UserAbility[] = []

  userRoles.forEach(role => {
    const ability = roleAbilities[role]
    if (ability) {
      abilities.push(ability)
    }
  })

  return abilities
}

export { getAbilityFromRole }
