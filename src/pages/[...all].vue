<script setup lang="ts">
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import pages404 from '@images/pages/404.jpg'
import miscMaskDark from '@images/pages/misc-mask-dark.png'
import miscMaskLight from '@images/pages/misc-mask-light.png'

const authThemeMask = useGenerateImageVariant(miscMaskLight, miscMaskDark)
</script>

<template>
  <div class="misc-wrapper">
    <ErrorHeader
      error-title="Page introuvable"
      error-description="Oops! 😖 La page demandée n'a pas été trouvée."
    />
    <VBtn
      :to="{ name: 'dashboard' }"
      class="mb-12"
    >
      Retour à l'accueil
    </VBtn>

    <!-- 👉 Image -->
    <div class="misc-avatar w-100 text-center">
      <VImg
        :src="pages404"
        alt="Coming Soon"
        :max-width="420"
        class="mx-auto"
        rounded="xl"
      />
    </div>

    <VImg
      :src="authThemeMask"
      class="misc-footer-img d-none d-md-block"
    />
  </div>
</template>

<style lang="scss">
@use '@core/scss/template/pages/misc.scss';
</style>

<route lang="json">
{
  "meta": {
    "no_login": true,
    "layout": "blank"
  }
}
</route>
