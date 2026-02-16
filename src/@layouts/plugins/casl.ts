import type { RouteLocationNormalized } from 'vue-router'
import type { NavGroup } from '@layouts/types'
import { ability } from '@/plugins/casl/casl'

/**
 * Check if user can view item based on it's ability
 * Based on item's action and subject & Hide group if all of it's children are hidden
 * @param {object} item navigation object item
 */
export const canViewNavMenuGroup = (item: NavGroup) => {
  const hasAnyVisibleChild = item.children.some(i => ability.can(i.action, i.subject))

  // If subject and action is defined in item => Return based on children visibility (Hide group if no child is visible)
  // Else check for ability using provided subject and action along with checking if has any visible child
  if (!(item.action && item.subject)) return hasAnyVisibleChild

  return ability.can(item.action, item.subject) && hasAnyVisibleChild
}

export const canNavigate = (to: RouteLocationNormalized) => {
  return to.matched.some(route => ability.can(route.meta.action, route.meta.subject))
}
