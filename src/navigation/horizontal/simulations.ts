export default [
  {
    title: 'Prospection',
    icon: { icon: 'tabler:file-invoice' },
    children: [
      {
        title: 'Devis',
        icon: { icon: 'teenyicons:invoice-outline' },
        to: { name: 'simulation', query: { 'exists[deletedAt]': false } },
        action: 'standard',
        subject: 'sales',
      },
      {
        title: 'Devis archivés',
        icon: { icon: 'pajamas:archive' },
        to: 'simulation-archived',
        action: 'standard',
        subject: 'sales',
      },
      {
        title: 'Devis signés',
        icon: { icon: 'fluent-mdl2:work-item' },
        to: 'simulation-signed',
        action: 'standard',
        subject: 'sales',
      },
    ],
  },
]
