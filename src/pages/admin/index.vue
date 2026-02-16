<template>
  <div>
    <VMain>
      <p class="text-2xl mb-6">Devis</p>
      <VRow>
        <CardMenu
          icon="icomoon-free:make-group"
          title="Groupe de statuts"
          description="Ajouter ou modifier les groupes de hiérarchie des statuts"
          :link="{ name: 'admin-simulation-status-group' }"
        />
        <CardMenu
          icon="mdi-list-status"
          title="Statuts"
          description="Ajouter ou modifier des statuts d'un devis"
          :link="{ name: 'admin-simulation-status' }"
        />
        <!-- <CardMenu
          icon="tabler:file-settings"
          title="Option des simulations"
          description="Ajuster certaines variables pour le calcul des prix"
          :link="{ name: 'admin-variable' }"
        /> -->
      </VRow>

      <p class="text-2xl mb-6 mt-14">Etudes</p>
      <VRow>
        <CardMenu
          icon="ri:survey-fill"
          title="Etudes"
          description="Ajouter ou modifier des éléments des études"
          :link="{ name: 'admin-survey' }"
        />
      </VRow>

      <p class="text-2xl mb-6 mt-14">Prospects / Clients</p>
      <VRow>
        <CardMenu
          icon="mdi-company"
          title="Types d'entreprise"
          description="Ajouter ou modifier les types d'entreprise sélectionnables dans le devis ou les fiches clients / prospects"
          :link="{ name: 'admin-companyType' }"
        />
      </VRow>

      <p class="text-2xl mb-6 mt-14">Utilisateurs</p>
      <VRow>
        <CardMenu
          icon="icon-park-outline:shop"
          title="Agences"
          description="Ajouter ou modifier les agences affectées aux collaborateurs"
          :link="{ name: 'admin-location' }"
        />
      </VRow>
    </VMain>
  </div>
</template>
