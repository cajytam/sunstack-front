import dashboard from './dashboard'
import simulations from './simulations'
import administration from './administration'
import resources from '@/navigation/horizontal/resources'
import type { HorizontalNavItems } from '@layouts/types'

export default [...dashboard, ...simulations, ...resources, ...administration] as HorizontalNavItems
