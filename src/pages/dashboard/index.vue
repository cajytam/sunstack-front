<script setup lang="ts">
import { getTitle } from '@/utils/stringUtils'
import { useUserStore } from '@/stores/user'

const baseURL = import.meta.env.VITE_API_URI

const userStore = useUserStore()
const { authUser } = userStore
</script>

<template>
  <VRow>
    <!-- 👉 DEVIS -->
    <VCol
      cols="12"
      lg="4"
    >
      <VCard class="mb-5">
        <VCardText class="pb-2">
          <h4 class="text-h4 font-weight-bold">
            {{
              `${new Date().getHours() > 18 || new Date().getHours() < 4 ? 'Bonsoir' : 'Bonjour'} ${
                authUser.prenom ? getTitle(authUser.prenom) : ''
              }`
            }}
          </h4>
          <VDivider class="mx-5 mt-5 pb-2" />
        </VCardText>
        <VCardText class="mt-2">
          <h3 class="text-h6 text-lg-h5 font-weight-bold">Devis</h3>
          <VBtn
            size="large"
            class="mt-3"
            variant="elevated"
            text="Créer un devis"
            prepend-icon="mdi-invoice-add"
            :to="{ name: 'simulation-solar-simulationIdentifier', params: { simulationIdentifier: 'new' } }"
          />
          <VDivider class="mx-5 mt-8" />
        </VCardText>
        <VCardText>
          <h3 class="text-h6 text-lg-h5 font-weight-bold">Tâches</h3>
          <Tasks />
        </VCardText>
      </VCard>
    </VCol>
    <VCol
      cols="12"
      lg="8"
    >
      <ListSimulation :user="authUser" />
      <SellerBonusAbstract
        v-if="authUser.roles.includes('ROLE_SALES')"
        :user="authUser"
      />
    </VCol>
  </VRow>
</template>
