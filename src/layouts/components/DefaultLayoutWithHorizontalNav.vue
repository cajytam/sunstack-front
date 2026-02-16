<script lang="ts" setup>
import navItems from '@/navigation/horizontal'
import { useThemeConfig } from '@core/composable/useThemeConfig'

// Components
import NavBarNotifications from '@/layouts/components/NavBarNotifications.vue'
import NavbarShortcuts from '@/layouts/components/NavbarShortcuts.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import { HorizontalNavLayout } from '@layouts'

const { appRouteTransition } = useThemeConfig()
</script>

<template>
  <HorizontalNavLayout :nav-items="navItems">
    <!-- 👉 navbar -->
    <template #navbar>
      <RouterLink
        to="/"
        class="app-logo d-flex align-center ga-1"
      >
        <LogoTheme logo-width="160" />
      </RouterLink>

      <!-- 👉 Search -->
      <div class="d-flex align-center ml-8">
        <VBtn
          text="Retour"
          color="secondary"
          variant="elevated"
          prepend-icon="ic:baseline-arrow-back"
          @click="!$router?.options?.history?.state?.back.startsWith('/simulation/solar/copy/') ? $router.back() : null"
        />
      </div>

      <VSpacer />

      <NavbarShortcuts
        class="me-1"
        v-if="false"
      />
      <NavBarNotifications class="me-1" />
      <NavbarThemeSwitcher class="me-2" />
      <UserProfile />
    </template>

    <!-- 👉 Pages -->
    <RouterView v-slot="{ Component }">
      <Transition
        :name="appRouteTransition"
        mode="out-in"
      >
        <Component :is="Component" />
      </Transition>
    </RouterView>
  </HorizontalNavLayout>
</template>
