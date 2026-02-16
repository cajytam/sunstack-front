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
  <VLayout>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1600 3200"
      class="position-fixed"
      style="left: 0; top: 0"
      preserveAspectRatio="none"
    >
      <rect
        fill="var(--primary-500)"
        width="1600"
        height="3200"
      />
      <path
        fill="var(--primary-400)"
        d="M478.4 581c3.2 0.8 6.4 1.7 9.5 2.5c196.2 52.5 388.7 133.5 593.5 176.6c174.2 36.6 349.5 29.2 518.6-10.2V0H0v574.9c52.3-17.6 106.5-27.7 161.1-30.9C268.4 537.4 375.7 554.2
  478.4 581z"
      />
      <path
        fill="var(--primary-300)"
        d="M181.8 259.4c98.2 6 191.9 35.2 281.3 72.1c2.8 1.1 5.5 2.3 8.3 3.4c171 71.6 342.7 158.5 531.3 207.7c198.8 51.8 403.4 40.8 597.3-14.8V0H0v283.2C59 263.6 120.6 255.7 181.8 259.4z"
      />
      <path
        fill="var(--primary-200)"
        d="M454.9 86.3C600.7 177 751.6 269.3 924.1 325c208.6 67.4 431.3 60.8 637.9-5.3c12.8-4.1 25.4-8.4 38.1-12.9V0H288.1c56 21.3 108.7 50.6 159.7 82C450.2 83.4 452.5 84.9 454.9 86.3z"
      />
      <path
        fill="var(--primary-100)"
        d="M1397.5 154.8c47.2-10.6 93.6-25.3 138.6-43.8c21.7-8.9 43-18.8 63.9-29.5V0H643.4c62.9 41.7 129.7 78.2 202.1 107.4C1020.4 178.1 1214.2 196.1 1397.5 154.8z"
      />
    </svg>
    <VLayout>
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
              class="auth-card pa-4 pt-7 mx-auto"
              max-width="448"
            >
              <VCardTitle class="mb-5">
                <VImg
                  class="d-flex mx-auto pt-5"
                  max-width="200"
                  :src="logoSunStack"
                  alt="logo SunStack"
                />
              </VCardTitle>
              <VCardText>
                <VTextField
                  id="username"
                  v-model="loginForm.email"
                  label="Email"
                  type="email"
                  class="login-form__text"
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
                      variant="text"
                      size="small"
                      v-bind="props"
                    />
                  </template>
                  <VCard
                    min-width="300"
                    class="border"
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
  color: #333;
}
</style>
