export default [
  { heading: 'Ressources', action: 'standard', subject: 'sales' },
  {
    title: 'Documentation',
    icon: { icon: 'fluent-mdl2:doc-library' },
    to: 'doc',
    action: 'standard',
    subject: 'all',
  },
  {
    title: 'Prix',
    icon: { icon: 'entypo:price-tag' },
    to: 'calculator-price',
    action: 'manage',
    subject: 'all',
  },
  {
    title: 'Onduleurs',
    icon: { icon: 'cbi:fronius-inverter-gen24' },
    to: 'calculator-inverter',
    action: 'manage',
    subject: 'all',
  },
]
