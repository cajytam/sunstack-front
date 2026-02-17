<route lang="json">
{
  "meta": {
    "layout": "blank"
  }
}
</route>

<script setup lang="ts">
import { useTheme } from 'vuetify'
import axios from 'axios'

import { fetchPost } from '@/services/api'

import logoSunStack from '@images/sunstack.png'
import { config } from '@layouts/config'
import { themeConfig } from '@themeConfig'

const baseURI = import.meta.env.VITE_API_URI

const vuetifyTheme = useTheme()
vuetifyTheme.change('light')

const router = useRouter()

const showPassword = ref(false)
const isLoading = ref(false)
const isDisplayAlert = ref(false)

const displayResetPassword = ref(false)
const resetPasswordEmail = ref(null)
const isSendingEmail = ref(false)

const loginForm = reactive({
  email: null,
  password: null,
})

const notificationContent = reactive({
  alertType: '',
  title: '',
  text: '',
})

const onSubmit = () => {
  isLoading.value = true

  const data = { ...loginForm, _remember_me: true }

  axios
    .post(`${baseURI}api/login`, JSON.stringify(data), {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(res => {
      isDisplayAlert.value = true
      notificationContent.alertType = 'success'
      notificationContent.title = 'Connexion réussie'
      notificationContent.text = 'Redirection en cours...'

      // localStorage.setItem('x-auth-token', res.data.token)
      if (res.data.settings && JSON.stringify(res.data.settings).length > 0) {
        localStorage.setItem('user_settings', JSON.stringify(res.data.settings))

        if (res.data.settings?.theme) {
          localStorage.setItem(`${themeConfig.app.title}-theme`, res.data.settings.theme.toString())
          vuetifyTheme.global.name.value = res.data.settings.theme
        }

        // disposition navigation
        if (res.data.settings?.app_content_layout_nav) {
          config.app.contentLayoutNav.value = res.data.settings.app_content_layout_nav.toString()
        }

        // largeur contenu
        if (res.data.settings?.content_width) {
          config.app.contentWidth.value = res.data.settings.content_width.toString()
        }

        // couleur principale
        if (res.data.settings?.main_color) {
          for (let color of ['light', 'dark']) {
            vuetifyTheme.themes.value[color].colors.primary = res.data.settings.main_color
            localStorage.setItem(`${themeConfig.app.title}-${color}ThemePrimaryColor`, res.data.settings.main_color)
          }
          localStorage.setItem(`${themeConfig.app.title}-initial-loader-color`, res.data.settings.main_color)
        }
      }

      setTimeout(() => {
        if (router.currentRoute.value.query && 'redirect' in router.currentRoute.value.query)
          router.push({ path: router.currentRoute.value.query.redirect })
        else router.push({ name: 'dashboard' })
      }, 500)
    })
    .catch(err => {
      isDisplayAlert.value = true
      notificationContent.alertType = 'error'
      notificationContent.title = 'Erreur lors de la tentative de connexion'
      notificationContent.text = err?.response
        ? err.response.data.error && err.response.data.error !== 'Invalid credentials.'
          ? err.response.data.error
          : 'Email et/ou mot de passe incorrect(s)'
        : 'Erreur inattendue lors de la tentative de connexion'
      console.error(err)
    })
    .finally(() => {
      isLoading.value = false
    })
}

const onSendResetPassword = () => {
  if (resetPasswordEmail.value === null || resetPasswordEmail.value.length <= 0) return

  const pattern =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

  if (!pattern.test(resetPasswordEmail.value)) return

  isSendingEmail.value = true

  fetchPost(
    'sendEmailResetPassword',
    {
      email: resetPasswordEmail.value,
    },
    false,
  )
    .then(res => {
      if ('error' in res) {
        throw res
      } else {
        isDisplayAlert.value = true
        notificationContent.alertType = 'success'
        notificationContent.title = 'Mail de réinitialisation envoyé avec succès'
        notificationContent.text = ''
      }
    })
    .catch(err => {
      console.error(err)
      isDisplayAlert.value = true
      notificationContent.alertType = 'error'
      notificationContent.title = 'Erreur'
      notificationContent.text = err.error ? err.error : ''
    })
    .finally(() => (isSendingEmail.value = false))
}
</script>

<template>
  <VLayout class="auth-shell">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1600 3200"
      class="position-fixed auth-waves"
      style="left: 0; top: 0"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id="sunstack-sky"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="#fff6e6"
          />
          <stop
            offset="35%"
            stop-color="#fde2bf"
          />
          <stop
            offset="70%"
            stop-color="#f6c58d"
          />
          <stop
            offset="100%"
            stop-color="#ef6b1f"
          />
        </linearGradient>
      </defs>
      <rect
        fill="url(#sunstack-sky)"
        width="1600"
        height="3200"
      />
      <path
        fill="var(--sunstack-400)"
        opacity="0.55"
        d="M0 520C220 430 480 420 760 480C1020 540 1250 690 1600 640L1600 0H0Z"
      />
      <path
        fill="var(--sunstack-300)"
        opacity="0.7"
        d="M0 360C260 280 520 300 780 360C1040 420 1290 540 1600 500L1600 0H0Z"
      />
      <path
        fill="var(--sunstack-200)"
        opacity="0.85"
        d="M0 220C280 140 560 180 820 240C1100 305 1340 420 1600 380L1600 0H0Z"
      />
    </svg>
    <VLayout>
      <div class="auth-glow" />
      <VRow
        class="auth-wrapper pa-4"
        align="center"
        justify="center"
      >
        <VCol
          cols="12"
          md="4"
        >
          <VForm @submit="onSubmit">
            <VCard
              class="auth-card sunstack-card pa-4 pt-7 mx-auto"
              max-width="448"
            >
              <VCardTitle class="mb-2">
                <VImg
                  class="d-flex mx-auto pt-5"
                  max-width="200"
                  :src="logoSunStack"
                  alt="logo SunStack"
                />
              </VCardTitle>
              <VCardText class="text-center mb-2">
                <h1 class="auth-title">Bienvenue sur SunStack</h1>
                <p class="auth-subtitle">Connectez-vous pour accéder à votre espace.</p>
              </VCardText>
              <VCardText>
                <VTextField
                  id="username"
                  v-model="loginForm.email"
                  label="Email"
                  type="email"
                  class="login-form__text"
                  variant="outlined"
                  density="comfortable"
                />
              </VCardText>
              <VCardText>
                <VTextField
                  id="password"
                  v-model="loginForm.password"
                  class="login-form__text"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  :type="showPassword ? 'text' : 'password'"
                  label="Mot de passe"
                  variant="outlined"
                  density="comfortable"
                  @click:append-inner="showPassword = !showPassword"
                />
              </VCardText>
              <div class="d-flex justify-center gap-x-3 mt-2 mb-5">
                <VBtn
                  text="Me connecter"
                  variant="flat"
                  size="large"
                  type="submit"
                  append-icon="material-symbols:login"
                  :loading="isLoading"
                  :disabled="isLoading"
                  class="login-submit"
                  @click.prevent="onSubmit"
                />
              </div>
              <VCardActions class="d-flex justify-end gap-x-3">
                <VMenu
                  v-model="displayResetPassword"
                  location="bottom end"
                  activator="parent"
                  transition="slide-y-reverse-transition"
                  :close-on-content-click="false"
                >
                  <template #activator="{ props }">
                    <VBtn
                      text="Mot de passe oublié"
                      class="reset-link"
                      variant="text"
                      size="small"
                      v-bind="props"
                    />
                  </template>
                  <VCard
                    min-width="300"
                    class="border reset-card"
                  >
                    <VCardTitle>
                      <span class="text-caption font-italic">
                        Recevoir un email pour réinitialiser votre mot de passe ?
                      </span>
                    </VCardTitle>
                    <VCardText>
                      <VTextField
                        v-model="resetPasswordEmail"
                        variant="filled"
                        color="info"
                        class="login-form__text"
                        placeholder="Votre adresse mail"
                        name="email"
                      />
                    </VCardText>
                    <VCardActions class="d-flex justify-center">
                      <VBtn
                        text="Réinitialiser le mot de passe"
                        variant="elevated"
                        size="small"
                        color="info"
                        :loading="isSendingEmail"
                        @click="onSendResetPassword"
                      />
                    </VCardActions>
                  </VCard>
                </VMenu>
              </VCardActions>
              <VSnackbar
                :timeout="5000"
                :color="notificationContent.alertType"
                v-model="isDisplayAlert"
                location="top"
              >
                <h3 class="text-h6 text-white font-weight-bold mb-2">{{ notificationContent.title }}</h3>
                {{ notificationContent.text }}
              </VSnackbar>
            </VCard>
          </VForm>
        </VCol>
      </VRow>
    </VLayout>
  </VLayout>
</template>

<style scoped lang="scss">
.layout-blank .auth-wrapper {
  min-block-size: calc(var(--vh, 1vh) * 100);
}

.auth-shell {
  --sunstack-500: #e46a2d;
  --sunstack-400: #e9b490;
  --sunstack-300: #f1d4bf;
  --sunstack-200: #f6e6d9;
  --sunstack-100: #faf4ee;
  background:
    radial-gradient(1100px circle at 10% 10%, rgba(255, 255, 255, 0.4), transparent 65%),
    linear-gradient(160deg, #f8f0e8 0%, #fff 60%, #f3eee9 100%);
  position: relative;
  overflow: hidden;
}

.auth-waves {
  opacity: 0.75;
  filter: saturate(0.9);
}

.auth-glow {
  position: absolute;
  inset: -30% -10% auto auto;
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, rgba(228, 106, 45, 0.12), transparent 65%);
  filter: blur(2px);
  animation: glow-float 10s ease-in-out infinite;
  pointer-events: none;
}

.layout-blank .auth-wrapper .auth-footer-mask {
  position: absolute;
  inset-block-end: 0;
  min-inline-size: 100%;
}

.layout-blank .auth-wrapper .auth-footer-start-tree,
.layout-blank .auth-wrapper .auth-footer-end-tree {
  position: absolute;
  z-index: 1;
}

.layout-blank .auth-wrapper .auth-footer-start-tree {
  inset-block-end: 0;
  inset-inline-start: 0;
}

.layout-blank .auth-wrapper .auth-footer-end-tree {
  inset-block-end: 0;
  inset-inline-end: 0;
}

.layout-blank .auth-wrapper .auth-illustration {
  z-index: 1;
}

.layout-blank .auth-card {
  box-shadow:
    rgba(0, 0, 0, 0.25) 0 14px 28px,
    rgba(0, 0, 0, 0.22) 0 10px 10px !important;
  z-index: 1 !important;
}

.sunstack-card {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.9));
  border: 1px solid rgba(228, 106, 45, 0.12);
  backdrop-filter: blur(10px);
  animation: card-rise 600ms ease-out;
}

.auth-title {
  font-family: 'Space Grotesk', 'Plus Jakarta Sans', 'Avenir Next', 'Segoe UI', sans-serif;
  font-size: 1.6rem;
  line-height: 1.2;
  color: #2a211b;
  letter-spacing: -0.02em;
  margin: 0 0 0.4rem;
}

.auth-subtitle {
  font-size: 0.95rem;
  color: #6b5a4b;
  margin: 0;
}

@media (min-width: 960px) {
  .skin--bordered .auth-card-v2 {
    border-inline-start: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
  }
}

.auth-logo {
  position: absolute;
  z-index: 1;
  inset-block-start: 2rem;
  inset-inline-start: 2.3rem;
}

.auth-card-v2 {
  background-color: rgb(var(--v-theme-surface));
}

.login-form__text {
  color: #2a211b;
}

.login-form__text :deep(.v-field) {
  border-radius: 14px;
  background-color: rgba(255, 255, 255, 0.9);
}

.login-form__text :deep(.v-field__outline) {
  --v-field-border-opacity: 0.28;
}

.login-form__text :deep(.v-field--focused .v-field__outline) {
  color: #e46a2d;
}

.login-submit {
  background: linear-gradient(135deg, #e46a2d 0%, #ee9a66 55%, #f3c1a0 100%);
  color: #fff;
  border-radius: 999px;
  text-transform: none;
  letter-spacing: 0.01em;
  box-shadow: 0 12px 24px rgba(228, 106, 45, 0.2);
}

.login-submit:hover {
  transform: translateY(-1px);
}

.reset-link {
  color: #6b5a4b !important;
  text-transform: none;
}

.reset-card {
  background: #fffaf2;
  border-color: rgba(228, 106, 45, 0.12) !important;
}

@keyframes glow-float {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
    opacity: 0.85;
  }
  50% {
    transform: translate3d(-14px, 10px, 0);
    opacity: 1;
  }
}

@keyframes card-rise {
  from {
    transform: translateY(12px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
