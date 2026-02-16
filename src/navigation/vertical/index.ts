import dashboard from './dashboard'
import simulation from './simulations'
import resources from './resources'
import administration from './administration'
import type { VerticalNavItems } from '@/@layouts/types'

export default [...dashboard, ...simulation, ...resources, ...administration] as VerticalNavItems
