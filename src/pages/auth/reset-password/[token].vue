<route lang="json">
{
  "meta": {
    "layout": "blank"
  }
}
</route>

<script setup lang="ts">
import { useTheme } from 'vuetify'
import { fetchGet, fetchPost } from '@/services/api'

import logoSunStack from '@images/sunstack.png'

const vuetifyTheme = useTheme()

vuetifyTheme.change('light')

const router = useRouter()
const route = useRoute()

const isPersisting = ref(false)
const isDisabled = ref(false)
const isDisplayAlert = ref(false)
const token = ref(null)

/**
 * Mot de passe
 */
const newPassword = ref()
const newPasswordRepeat = ref()
const showPassword = ref(false)
const showRepeat = ref(false)

const notificationContent = reactive({
  icon: '',
  alertType: '',
  title: '',
  text: '',
})

onBeforeMount(() => {
  token.value = route.params.token ? route.params.token : null
  if (token.value === null) router.push({ name: 'auth-login' })

  fetchGet('resetPassword', token.value, false)
    .then(res => {
      if ('error' in res) router.push({ name: 'auth-login' })
    })
    .catch(err => console.error(err))
})

const onChangePassword = () => {
  if (!newPassword.value || newPassword.value.trim().length === 0) {
    isDisplayAlert.value = true
    notificationContent.icon = 'ic:outline-error'
    notificationContent.alertType = 'error'
    notificationContent.title = 'Le mot de passe ne peut pas être vide'
  } else if (newPassword.value !== newPasswordRepeat.value) {
    isDisplayAlert.value = true
    notificationContent.icon = 'ic:outline-error'
    notificationContent.alertType = 'error'
    notificationContent.title = 'Les mots de passe ne sont pas identiques'
  } else {
    isPersisting.value = true
    fetchPost(
      'resetPassword',
      {
        plainPassword: newPassword.value,
        token: token.value,
      },
      false,
      'get+ld',
      `/${token.value}`,
    )
      .then(() => {
        isDisplayAlert.value = true
        notificationContent.icon = 'teenyicons:shield-tick-solid'
        notificationContent.alertType = 'success'
        notificationContent.title = 'Mot de passe modifié avec succès'
        notificationContent.text = 'Redirection en cours...'
        isDisabled.value = true

        setTimeout(() => {
          router.push({ name: 'dashboard' })
        }, 3000)
      })
      .catch(err => {
        isDisplayAlert.value = true
        notificationContent.icon = 'ic:outline-error'
        notificationContent.alertType = 'error'
        notificationContent.title = 'erreur lors de la modification du mot de passe'
        notificationContent.text = err.response.data['hydra:description']
        console.error(err)
      })
      .finally(() => (isPersisting.value = false))
  }
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
        fill="var(--info-400)"
        width="1600"
        height="3200"
      />
      <path
        fill="var(--info-300)"
        d="M478.4 581c3.2 0.8 6.4 1.7 9.5 2.5c196.2 52.5 388.7 133.5 593.5 176.6c174.2 36.6 349.5 29.2 518.6-10.2V0H0v574.9c52.3-17.6 106.5-27.7 161.1-30.9C268.4 537.4 375.7 554.2
  478.4 581z"
      />
      <path
        fill="var(--info-200)"
        d="M181.8 259.4c98.2 6 191.9 35.2 281.3 72.1c2.8 1.1 5.5 2.3 8.3 3.4c171 71.6 342.7 158.5 531.3 207.7c198.8 51.8 403.4 40.8 597.3-14.8V0H0v283.2C59 263.6 120.6 255.7 181.8 259.4z"
      />
      <path
        fill="var(--info-100)"
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
          <VForm @submit="onChangePassword">
            <VCard
              class="auth-card pa-4 pt-7 mx-auto"
              max-width="448"
            >
              <VCardTitle class="mb-5">
                <VImg
                  class="d-flex mx-auto pt-5 pb-10"
                  max-width="200"
                  :src="logoSunStack"
                  alt="logo SunStack"
                />
              </VCardTitle>
              <VCardText>
                <VTextField
                  id="password"
                  v-model="newPassword"
                  class="form__text"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Mot de passe"
                  color="green-sunstack-darker"
                  @click:append-inner="showPassword = !showPassword"
                />
              </VCardText>
              <VCardText>
                <VTextField
                  id="passwordRepeat"
                  v-model="newPasswordRepeat"
                  class="form__text"
                  :append-inner-icon="showRepeat ? 'mdi-eye-off' : 'mdi-eye'"
                  :type="showRepeat ? 'text' : 'password'"
                  placeholder="Répéter mot de passe"
                  color="green-sunstack-darker"
                  @click:append-inner="showRepeat = !showRepeat"
                />
              </VCardText>
              <VCardActions class="d-flex justify-center gap-x-3 mt-2 mb-5">
                <VBtn
                  text="Modifier mon mot de passe"
                  variant="flat"
                  color="green-sunstack-darker"
                  :loading="isPersisting"
                  type="submit"
                  :disabled="isDisabled"
                  @click.prevent="onChangePassword"
                />
              </VCardActions>
              <VCardActions class="d-flex justify-center">
                <VBtn
                  size="small"
                  text="Se connecter"
                  @click="$router.push({ name: 'auth-login' })"
                />
              </VCardActions>
              <Notification
                v-if="isDisplayAlert"
                :icon="notificationContent.icon"
                :alert-type="notificationContent.alertType"
                :title="notificationContent.title"
                :text="notificationContent.text"
                :is-closable="true"
                :autoclose-time="3000"
                @is-auto-closed="e => (isDisplayAlert = !isDisplayAlert)"
              />
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

.form__text {
  color: #333;
}
</style>
