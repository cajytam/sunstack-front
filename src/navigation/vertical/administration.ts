export default [
  { heading: 'Administration', action: 'manage', subject: 'all' },
  {
    title: 'Utilisateurs',
    icon: { icon: 'fa-solid:users' },
    to: 'user',
    action: 'manage',
    subject: 'all',
  },
  {
    title: 'Produits',
    icon: { icon: 'fluent-mdl2:product-variant' },
    to: 'product',
    action: 'manage',
    subject: 'all',
  },
  {
    title: 'Paramètres',
    icon: { icon: 'iconamoon:options-duotone' },
    to: 'admin',
    action: 'manage',
    subject: 'all',
  },
]
