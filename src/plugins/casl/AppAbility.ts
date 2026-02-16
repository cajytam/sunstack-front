export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'standard'

export type Subjects = 'Auth' | 'Admin' | 'Simulation' | 'Project' | 'Ressource' | 'sales' | 'all'

export interface UserAbility {
  action: Actions
  subject: Subjects
}
