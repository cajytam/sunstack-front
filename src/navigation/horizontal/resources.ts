export default [
  {
    title: 'Ressources',
    icon: { icon: 'oui:documentation' },
    children: [
      {
        title: 'Documentation',
        icon: { icon: 'fluent-mdl2:doc-library' },
        to: 'doc',
        action: 'standard',
        subject: 'all',
      },
      {
        title: 'Calculateurs',
        icon: { icon: 'material-symbols:calculate' },
        action: 'manage',
        subject: 'all',
        children: [
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
        ],
      },
    ],
  },
]
