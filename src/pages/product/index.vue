<template>
  <VMain>
    <p class="text-2xl mb-6">Produits principaux</p>
    <VRow align="stretch">
      <VCol
        cols="12"
        xl="3"
        lg="4"
        md="6"
      >
        <VCard class="fill-height">
          <VCardTitle class="text-md-h5 text-primary">
            <VIcon
              icon="fa6-solid:solar-panel"
              class="me-2"
            />
            Panneaux
          </VCardTitle>
          <VCardText> Ajouter ou modifier les panneaux, ainsi que leurs prix</VCardText>
          <VCardText>
            <VBtn
              text="Ouvrir"
              variant="tonal"
              prepend-icon="fluent:open-16-regular"
              :to="{ name: 'product-panel' }"
            />
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        xl="3"
        lg="4"
        md="6"
      >
        <VCard class="fill-height">
          <VCardTitle class="text-md-h5 text-primary">
            <VIcon
              icon="cbi:huawei-solar-inverter"
              class="me-2"
            />
            Onduleurs
          </VCardTitle>
          <VCardText> Ajouter ou modifier les onduleurs, ainsi que leurs prix</VCardText>
          <VCardText>
            <VBtn
              text="Ouvrir"
              variant="tonal"
              prepend-icon="fluent:open-16-regular"
              :to="{ name: 'product-inverter' }"
            />
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        xl="3"
        lg="4"
        md="6"
      >
        <VCard class="fill-height">
          <VCardTitle class="text-md-h5 text-primary">
            <VIcon
              icon="fa6-solid:car-battery"
              class="me-2"
            />
            Batteries
          </VCardTitle>
          <VCardText> Ajouter ou modifier les batteries, ainsi que leurs prix</VCardText>
          <VCardText>
            <VBtn
              text="Ouvrir"
              variant="tonal"
              prepend-icon="fluent:open-16-regular"
              :to="{ name: 'product-battery' }"
            />
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        xl="3"
        lg="4"
        md="6"
      >
        <VCard class="fill-height">
          <VCardTitle class="text-md-h5 text-primary">
            <VIcon
              icon="ri:charging-pile-2-fill"
              class="me-2"
            />
            Bornes de recharge
          </VCardTitle>
          <VCardText> Ajouter ou modifier les bornes de rechargement, ainsi que leurs prix</VCardText>
          <VCardText>
            <VBtn
              text="Ouvrir"
              variant="tonal"
              prepend-icon="fluent:open-16-regular"
              :to="{ name: 'product-charging-point' }"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
    <p class="text-2xl mt-12">Accessoires</p>
    <VCol
      cols="12"
      xl="3"
      lg="4"
      md="6"
    >
      <VCard class="fill-height">
        <VCardTitle class="text-md-h5 text-primary">
          <VIcon
            icon="material-symbols:cable"
            class="me-2"
          />
          Câble d'onduleur
        </VCardTitle>
        <VCardText> Ajouter ou modifier les câbles des onduleurs, ainsi que leurs prix</VCardText>
        <VCardText>
          <VBtn
            text="Ouvrir"
            variant="tonal"
            prepend-icon="fluent:open-16-regular"
            :to="{ name: 'product-inverter-cable' }"
          />
        </VCardText>
      </VCard>
    </VCol>
    <p class="text-2xl mt-12">Autres</p>
    <VRow>
      <VCol
        cols="12"
        xl="3"
        lg="4"
        md="6"
      >
        <VCard>
          <VCardTitle class="text-md-h5 text-primary">
            <VIcon
              icon="solar:tag-price-bold"
              class="me-2"
            />
            Composantes du prix
          </VCardTitle>
          <VCardText> Gérer les autres éléments composants les prix</VCardText>
          <VCardText>
            <VBtn
              text="Ouvrir"
              variant="tonal"
              prepend-icon="fluent:open-16-regular"
              :to="{ name: 'product-factor' }"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </VMain>
</template>
<script setup lang="ts"></script>
