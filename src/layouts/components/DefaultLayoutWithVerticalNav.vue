<script lang="ts" setup>
import navItems from '@/navigation/vertical'
import { useThemeConfig } from '@core/composable/useThemeConfig'

// Components
import NavBarNotifications from '@/layouts/components/NavBarNotifications.vue'
import NavbarShortcuts from '@/layouts/components/NavbarShortcuts.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'

// @layouts plugin
import { VerticalNavLayout } from '@layouts'

const { appRouteTransition, isLessThanOverlayNavBreakpoint } = useThemeConfig()
const { width: windowWidth } = useWindowSize()
</script>

<template>
  <VerticalNavLayout :nav-items="navItems">
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <IconBtn
          v-if="isLessThanOverlayNavBreakpoint(windowWidth)"
          id="vertical-nav-toggle-btn"
          class="ms-n3"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon
            size="26"
            icon="tabler-menu-2"
          />
        </IconBtn>

        <!-- 👉 Search -->
        <div class="d-flex align-center ml-5 ml-md-0">
          <VBtn
            text="Retour"
            color="secondary"
            variant="elevated"
            prepend-icon="ic:baseline-arrow-back"
            @click="
              !$router?.options?.history?.state?.back.startsWith('/simulation/solar/copy/') ? $router.back() : null
            "
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
      </div>
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
  </VerticalNavLayout>
</template>
