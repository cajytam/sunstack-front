<script setup lang="ts">
import { useTheme } from 'vuetify'
import axios from 'axios'

import { getAll, getById, patchById } from '@/services/api'
import { useUserStore } from '@/stores/user'
import { getArrayOfValueFromArrayOfObject } from '@/utils/arrayUtils'
import { getJsonOfChangedValues } from '@/utils/formUtils'
import { useThemeConfig } from '@core/composable/useThemeConfig'
import { AppContentLayoutNav, ContentWidth, NavbarType } from '@layouts/enums'
import { themeConfig } from '@themeConfig'

const baseURL = import.meta.env.VITE_API_URI
const avatarDir = `${baseURL}img/`

const { theme, navbarType, isVerticalNavCollapsed, appContentWidth, appContentLayoutNav } = useThemeConfig()

const userStore = useUserStore()
const { authUser } = userStore

const router = useRouter()

let userDataOld = {}

const userData = reactive({
  email: null,
  firstname: null,
  lastname: null,
  phone: null,
  title: null,
  location: null,
  picture: null,
  settings: {},
})

const userPreferences = reactive({
  theme: 'light',
  navbar_type: 'sticky',
  app_content_layout_nav: 'vertical',
  main_color: '#26a17e',
  content_width: 'boxed',
})

const tab = ref(null)

const oldPassword = ref()
const newPassword = ref()
const newPasswordRepeat = ref()
const showPassword = ref(false)
const showRepeat = ref(false)
const showOldPassword = ref(false)

const listAgences = ref([])

/**
 * Upload avatar
 */
const avatarInput = ref(null)
const isUploadingAvatar = ref(false)

const isDisplayAlert = ref(false)
const isLoading = ref(true)
const isPersisting = ref(false)
const isPersistingPreferences = ref(false)

const notificationContent = reactive({
  alertType: '',
  title: '',
  text: '',
})

const itemTheme = [
  { key: 'system', name: 'Identique système' },
  { key: 'light', name: 'Clair' },
  { key: 'dark', name: 'Sombre' },
]

onMounted(() => {
  getAll('location', true, 'get+ld')
    .then(res => {
      listAgences.value = getArrayOfValueFromArrayOfObject(res.data, 'name').sort((a, b) =>
        a.name > b.name ? 1 : b.name > a.name ? -1 : 0,
      )
    })
    .catch(err => {
      console.error(err)
    })

  getById('user', authUser.id, true, 'get+ld')
    .then(res => {
      userData.location =
        typeof res.data.location !== 'undefined'
          ? {
              id: res.data.location['@id'],
              name: res.data.location.name,
            }
          : ''
      userData.email = res.data.email ? res.data.email : null
      userData.firstname = res.data.firstname ? res.data.firstname : null
      userData.lastname = res.data.lastname ? res.data.lastname : null
      userData.phone = res.data.phone ? res.data.phone : null
      userData.title = res.data.title ? res.data.title : null
      userData.picture = res.data.picture ? res.data.picture : null

      userDataOld = JSON.parse(JSON.stringify(userData))

      if (res.data.settings) {
        if ('content_width' in JSON.parse(JSON.stringify(res.data.settings))) {
          userPreferences.content_width = JSON.parse(JSON.stringify(res.data.settings)).content_width
        }

        if ('theme' in JSON.parse(JSON.stringify(res.data.settings))) {
          userPreferences.theme = JSON.parse(JSON.stringify(res.data.settings)).theme
          theme.value = userPreferences.theme
        }

        if ('main_color' in JSON.parse(JSON.stringify(res.data.settings)))
          userPreferences.main_color = JSON.parse(window.localStorage.getItem('user_settings')).main_color
      } else {
        if (
          localStorage.getItem('user_settings') &&
          'content_width' in JSON.parse(window.localStorage.getItem('user_settings'))
        )
          userPreferences.content_width = JSON.parse(window.localStorage.getItem('user_settings')).content_width

        userData.settings.content_width = userPreferences.content_width

        if (
          localStorage.getItem('user_settings') &&
          'theme' in JSON.parse(window.localStorage.getItem('user_settings'))
        )
          userPreferences.theme = JSON.parse(window.localStorage.getItem('user_settings')).theme

        userData.settings.theme = userPreferences.theme
      }
    })
    .catch(err => console.error(err))
    .finally(() => {
      isLoading.value = false
    })
})

const onChangePassword = () => {
  if (!newPassword.value || newPassword.value.trim().length === 0) {
    isDisplayAlert.value = true
    notificationContent.alertType = 'error'
    notificationContent.title = 'Le mot de passe ne peut pas être vide'
  } else if (newPassword.value !== newPasswordRepeat.value) {
    isDisplayAlert.value = true
    notificationContent.alertType = 'error'
    notificationContent.title = 'Les mots de passe ne sont pas identiques'
  } else if (!oldPassword.value || oldPassword.value.trim().length === 0) {
    isDisplayAlert.value = true
    notificationContent.alertType = 'error'
    notificationContent.title = "Le mot de passe actuel n'est pas renseigné"
  } else {
    isPersisting.value = true
    axios
      .get(`${baseURL}api/checkPassword/${oldPassword.value}`, {
        withCredentials: true,
      })
      .then(() => {
        patchById('user', authUser.id, {
          plainPassword: newPassword.value,
        })
          .then(() => {
            isDisplayAlert.value = true
            notificationContent.alertType = 'success'
            notificationContent.title = 'Mot de passe modifié avec succès'
          })
          .catch(err => {
            isDisplayAlert.value = true
            notificationContent.alertType = 'error'
            notificationContent.title = 'erreur lors de la modification du mot de passe'
            notificationContent.text = err.response.data['hydra:description']
            console.error(err)
          })
          .finally(() => {
            isPersisting.value = false
          })
      })
      .catch(err => {
        console.error(err)
        isDisplayAlert.value = true
        notificationContent.alertType = 'error'
        notificationContent.title = err.response.data.message
      })
      .finally(() => (isPersisting.value = false))
  }
}

const onAvatarChange = event => {
  const selectedFile = event.target.files[0]

  if (selectedFile) {
    isUploadingAvatar.value = true
    patchById(
      'user',
      authUser.id,
      {
        file: selectedFile,
      },
      true,
      'multipart',
    )
      .then(res => {
        userData.picture = res.data.picture
        isDisplayAlert.value = true
        notificationContent.alertType = 'success'
        notificationContent.title = 'Avatar modifié avec succès'
      })
      .catch(err => {
        console.error(err)
        isDisplayAlert.value = true
        notificationContent.alertType = 'error'
        notificationContent.title = 'erreur lors de la modification de votre avatar'
        notificationContent.text = err.response.data['hydra:description']
      })
      .finally(() => {
        isUploadingAvatar.value = false
      })
  }
}

const isPersistedProfil = ref(false)
const onPatchUserData = () => {
  isPersisting.value = true

  const patchData = getJsonOfChangedValues(userDataOld, JSON.parse(JSON.stringify(userData)))

  patchById('user', authUser.id, patchData)
    .then(() => {
      isPersistedProfil.value = true
      setTimeout(() => {
        isPersistedProfil.value = false
      }, 5000)
    })
    .catch(err => {
      console.error(err)
    })
    .finally(() => (isPersisting.value = false))
}

const isPersistedPreferences = ref(false)
const onPatchUserPreferences = () => {
  isPersistingPreferences.value = true

  const localStorageAppContentLayoutNav = localStorage.getItem(`${themeConfig.app.title}-contentLayoutNav`) ?? null
  if (localStorageAppContentLayoutNav) {
    userPreferences.app_content_layout_nav = localStorageAppContentLayoutNav
  }

  const localStorageAppMainColor = localStorage.getItem(`${themeConfig.app.title}-initial-loader-color`) ?? null
  if (localStorageAppMainColor) {
    userPreferences.main_color = localStorageAppMainColor
  }

  const localStorageAppcontentWidth = localStorage.getItem(`${themeConfig.app.title}-contentWidth`) ?? null
  if (localStorageAppcontentWidth) {
    userPreferences.content_width = localStorageAppcontentWidth
  }

  userPreferences.theme = theme.value

  const settings = JSON.parse(JSON.stringify(userPreferences))

  patchById('user', authUser.id, {
    settings,
  })
    .then(() => {
      isPersistedPreferences.value = true
      localStorage.setItem('user_settings', JSON.stringify(userPreferences))
      // router.go(0)
      setTimeout(() => {
        isPersistedPreferences.value = false
      }, 5000)
    })
    .catch(err => {
      console.error(err)
      notificationContent.alertType = 'error'
      notificationContent.title = 'erreur lors de la modification de votre profil'
      notificationContent.text = err.response.data['hydra:description']
    })
    .finally(() => (isPersistingPreferences.value = false))
}

const headerValues = computed(() => {
  return Object.entries(NavbarType)
})

const vuetifyTheme = useTheme()
const currentThemeName = vuetifyTheme.name.value

const localStoragePrimaryColor =
  localStorage.getItem(`${themeConfig.app.title}-${currentThemeName}ThemePrimaryColor`) ?? '#26a17e'

const mainColor = ref(localStoragePrimaryColor)

watch(mainColor, () => {
  userPreferences.main_color = mainColor.value

  for (let color of ['light', 'dark']) {
    vuetifyTheme.themes.value[color].colors.primary = mainColor.value

    // ℹ️ We need to store this color value in localStorage so vuetify plugin can pick on next reload
    localStorage.setItem(`${themeConfig.app.title}-${color}ThemePrimaryColor`, mainColor.value)
  }

  // ℹ️ Update initial loader color
  localStorage.setItem(`${themeConfig.app.title}-initial-loader-color`, mainColor.value)
})
</script>

<template>
  <div>
    <VFadeTransition mode="out-in">
      <VMain v-if="!isLoading">
        <VRow>
          <VCol cols="12">
            <VTabs
              v-model="tab"
              class="v-tabs-pill"
              centered
              show-arrows
              color="info"
            >
              <VTab value="tab-1">
                <VIcon
                  icon="ic:baseline-account-box"
                  class="me-1"
                />
                Mon compte
              </VTab>
              <VTab value="tab-2">
                <VIcon
                  icon="wpf:key-security"
                  class="me-1"
                />
                Sécurité
              </VTab>
            </VTabs>
            <VWindow
              v-model="tab"
              class="mt-6"
            >
              <!-- Activité utilisateur -->
              <VWindowItem
                key="1"
                value="tab-1"
                class="no-transition"
              >
                <VRow>
                  <VCol cols="12">
                    <VCard>
                      <VCardText class="d-flex">
                        <VAvatar
                          class="me-6 avatar-shadow"
                          rounded="sm"
                          style="width: 120px; height: 120px"
                        >
                          <VImg
                            :src="
                              userData.picture
                                ? `${avatarDir}users/${userData.picture}`
                                : `${avatarDir}logo/no-avatar.jpg`
                            "
                          />
                        </VAvatar>
                        <VForm class="d-flex flex-column justify-center">
                          <div class="d-flex flex-wrap">
                            <VBtn
                              type="submit"
                              color="info"
                              variant="tonal"
                              text="Modifier photo"
                              :loading="isUploadingAvatar"
                              @click.prevent="$refs.avatarInput.click()"
                            />
                            <input
                              ref="avatarInput"
                              type="file"
                              name="file"
                              accept="image/*"
                              style="display: none"
                              @change="onAvatarChange"
                            />
                          </div>
                        </VForm>
                      </VCardText>
                      <VCardText>
                        <VForm class="mt-6">
                          <VRow>
                            <VCol
                              cols="12"
                              md="6"
                            >
                              <VTextField
                                v-model="userData.lastname"
                                label="Nom"
                                color="info"
                              />
                            </VCol>
                            <VCol
                              cols="12"
                              md="6"
                            >
                              <VTextField
                                v-model="userData.firstname"
                                label="Prénom"
                                color="info"
                              />
                            </VCol>
                          </VRow>
                          <VRow>
                            <VCol
                              cols="12"
                              md="6"
                            >
                              <VTextField
                                v-model="userData.email"
                                label="Adresse mail"
                                color="info"
                                readonly
                              />
                            </VCol>
                            <VCol
                              cols="12"
                              md="6"
                            >
                              <VTextField
                                v-model="userData.phone"
                                label="Numéro de téléphone"
                                color="info"
                              />
                            </VCol>
                          </VRow>
                          <VRow>
                            <VCol
                              cols="12"
                              md="6"
                            >
                              <VAutocomplete
                                v-model="userData.location"
                                :items="listAgences"
                                label="Agence"
                                color="info"
                                item-value="id"
                                item-title="name"
                              />
                            </VCol>
                            <VCol
                              cols="12"
                              md="6"
                            >
                              <VTextField
                                v-model="userData.title"
                                label="Fonction"
                                color="info"
                              />
                            </VCol>
                            <VCardText class="d-flex align-center">
                              <VBtn
                                type="submit"
                                color="info"
                                variant="tonal"
                                text="Enregistrer mon profil"
                                :loading="isPersisting"
                                @click.prevent="onPatchUserData"
                                prepend-icon="material-symbols:save"
                              />
                              <VScrollYTransition mode="out-in">
                                <div
                                  v-if="isPersistedProfil"
                                  class="d-flex align-center justify-center gap-x-1 ml-5"
                                >
                                  <VIcon
                                    icon="mdi:success-bold"
                                    color="success"
                                  />
                                  <span class="text-success">
                                    Les modifications de votre profil ont bien été enregistrées
                                  </span>
                                </div>
                                <VSpacer v-else />
                              </VScrollYTransition>
                            </VCardText>
                          </VRow>
                        </VForm>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
                <VRow>
                  <VCol cols="12">
                    <VCard>
                      <VCardTitle>Préférences</VCardTitle>
                      <VCardText>
                        <VRow
                          class="my-5"
                          align="center"
                          justify="center"
                        >
                          <VCol
                            cols="12"
                            md="6"
                          >
                            <VRow
                              align="center"
                              justify="center"
                            >
                              <VCol cols="3">
                                <VLabel
                                  class="d-flex justify-center label-preference"
                                  color="info"
                                  text="Thème :"
                                />
                              </VCol>
                              <VCol
                                cols="9"
                                class="bg-var-theme-background"
                              >
                                <VRadioGroup
                                  v-model="theme"
                                  class="d-flex justify-center"
                                  inline
                                >
                                  <VRadio
                                    v-for="themeOption in itemTheme"
                                    :key="themeOption.key"
                                    :label="themeOption.name"
                                    :value="themeOption.key"
                                    class="text-capitalize"
                                  />
                                </VRadioGroup>
                              </VCol>
                            </VRow>
                          </VCol>
                          <VCol
                            cols="12"
                            md="6"
                          >
                            <VRow
                              align="center"
                              justify="center"
                            >
                              <VCol cols="3">
                                <VLabel
                                  class="d-flex justify-center label-preference"
                                  color="info"
                                  text="Couleur principale :"
                                />
                              </VCol>
                              <VCol
                                cols="9"
                                class="d-flex justify-center bg-var-theme-background"
                              >
                                <input
                                  v-model="mainColor"
                                  type="color"
                                />
                              </VCol>
                            </VRow>
                          </VCol>
                        </VRow>
                        <VRow
                          align="center"
                          justify="center"
                          class="my-5"
                        >
                          <VCol
                            cols="12"
                            md="6"
                          >
                            <VRow
                              align="center"
                              justify="center"
                            >
                              <VCol cols="3">
                                <VLabel
                                  class="d-flex justify-center label-preference"
                                  color="info"
                                  :text="
                                    appContentLayoutNav === AppContentLayoutNav.Vertical
                                      ? 'Type barre de navigation :'
                                      : 'Type d\'en-tête :'
                                  "
                                />
                              </VCol>
                              <VCol
                                cols="9"
                                class="bg-var-theme-background"
                              >
                                <VRadioGroup
                                  v-model="navbarType"
                                  class="d-flex justify-center"
                                  inline
                                >
                                  <VRadio
                                    v-for="[key, val] in headerValues"
                                    :key="key"
                                    :label="key"
                                    :value="val"
                                  />
                                </VRadioGroup>
                              </VCol>
                            </VRow>
                          </VCol>
                          <VCol
                            cols="12"
                            md="6"
                          >
                            <VRow
                              align="center"
                              justify="center"
                            >
                              <VCol cols="3">
                                <VLabel
                                  class="d-flex justify-center label-preference"
                                  color="info"
                                  text="Largeur du contenu :"
                                />
                              </VCol>
                              <VCol
                                cols="9"
                                class="bg-var-theme-background"
                              >
                                <!-- 👉 Content Width -->
                                <VRadioGroup
                                  v-model="appContentWidth"
                                  class="d-flex justify-center"
                                  inline
                                >
                                  <VRadio
                                    v-for="[key, val] in Object.entries(ContentWidth)"
                                    :key="key"
                                    :label="key"
                                    :value="val"
                                  />
                                </VRadioGroup>
                              </VCol>
                            </VRow>
                          </VCol>
                        </VRow>
                        <VRow
                          class="my-5"
                          align="center"
                          justify="center"
                        >
                          <VCol
                            cols="12"
                            md="6"
                          >
                            <VRow>
                              <VCol cols="3">
                                <VLabel
                                  class="d-flex justify-center label-preference"
                                  color="info"
                                  text="Disposition menu :"
                                />
                              </VCol>
                              <VCol
                                cols="9"
                                class="bg-var-theme-background"
                              >
                                <VRadioGroup
                                  v-model="appContentLayoutNav"
                                  class="d-flex justify-center"
                                  inline
                                >
                                  <VRadio
                                    v-for="[key, val] in Object.entries(AppContentLayoutNav)"
                                    :key="key"
                                    :label="key"
                                    :value="val"
                                  />
                                </VRadioGroup>
                              </VCol>
                            </VRow>
                          </VCol>
                          <VCol
                            v-if="appContentLayoutNav === AppContentLayoutNav.Vertical"
                            cols="12"
                            md="6"
                          >
                            <VRow class="mt-md-n3 mt-2">
                              <VCol cols="3">
                                <VLabel
                                  class="d-flex justify-center label-preference"
                                  color="info"
                                  text="Barre de navigation réduite :"
                                />
                              </VCol>
                              <VCol
                                cols="9"
                                class="bg-var-theme-background"
                              >
                                <VSwitch
                                  id="customizer-menu-collapsed"
                                  v-model="isVerticalNavCollapsed"
                                  class="d-flex justify-center"
                                />
                              </VCol>
                            </VRow>
                          </VCol>
                          <VSpacer v-else />
                        </VRow>
                      </VCardText>
                      <VCardText class="d-flex align-center">
                        <VBtn
                          type="submit"
                          color="info"
                          variant="tonal"
                          text="Enregistrer mes préférences"
                          :loading="isPersistingPreferences"
                          @click.prevent="onPatchUserPreferences"
                          prepend-icon="material-symbols:save"
                        />
                        <VScrollYTransition mode="out-in">
                          <div
                            v-if="isPersistedPreferences"
                            class="d-flex align-center justify-center gap-x-1 ml-5"
                          >
                            <VIcon
                              icon="mdi:success-bold"
                              color="success"
                            />
                            <span class="text-success"> Vos préférences ont bien été enregistrées </span>
                          </div>
                          <VSpacer v-else />
                        </VScrollYTransition>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </VWindowItem>
              <!-- Sécurité -->
              <VWindowItem
                key="2"
                value="tab-2"
                class="no-transition"
              >
                <VRow>
                  <VCol cols="12">
                    <VCard>
                      <VCardTitle> Modifier mon mot de passe</VCardTitle>
                      <VCardItem>
                        <VForm>
                          <VRow>
                            <VCol
                              cols="12"
                              md="6"
                            >
                              <VTextField
                                v-model="oldPassword"
                                placeholder="Mot de passe actuel"
                                :append-inner-icon="showOldPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                :type="showOldPassword ? 'text' : 'password'"
                                color="info"
                                @click:append-inner="showOldPassword = !showOldPassword"
                              />
                            </VCol>
                          </VRow>
                          <VRow>
                            <VCol
                              cols="12"
                              md="6"
                            >
                              <VTextField
                                v-model="newPassword"
                                placeholder="Nouveau mot de passe"
                                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                :type="showPassword ? 'text' : 'password'"
                                color="info"
                                @click:append-inner="showPassword = !showPassword"
                              />
                            </VCol>
                            <VCol
                              cols="12"
                              md="6"
                            >
                              <VTextField
                                v-model="newPasswordRepeat"
                                placeholder="Répéter mot de passe"
                                :append-inner-icon="showRepeat ? 'mdi-eye-off' : 'mdi-eye'"
                                :type="showRepeat ? 'text' : 'password'"
                                color="info"
                                @click:append-inner="showRepeat = !showRepeat"
                              />
                            </VCol>
                            <VCol>
                              <VBtn
                                text="Modifier mot de passe"
                                type="submit"
                                variant="tonal"
                                color="info"
                                :loading="isPersisting"
                                @click.prevent="onChangePassword"
                              />
                            </VCol>
                          </VRow>
                        </VForm>
                      </VCardItem>
                    </VCard>
                  </VCol>
                </VRow>
              </VWindowItem>
            </VWindow>
          </VCol>
        </VRow>
      </VMain>
      <VContainer
        v-if="isLoading"
        class="mx-auto mt-10"
      >
        <VRow
          align="center"
          justify="center"
        >
          <VCol
            cols="12"
            class="text-center"
          >
            <VProgressCircular
              color="primary"
              indeterminate
              :size="128"
              :width="12"
            />
          </VCol>
        </VRow>
      </VContainer>
    </VFadeTransition>
    <VSnackbar
      :timeout="5000"
      :color="notificationContent.alertType"
      v-model="isDisplayAlert"
    >
      <h3 class="text-h6 text-white font-weight-bold mb-2">{{ notificationContent.title }}</h3>
      {{ notificationContent.text }}
    </VSnackbar>
  </div>
</template>

<style scoped lang="scss">
.avatar-shadow {
  box-shadow:
    rgba(50, 50, 93, 0.25) 0 6px 12px -2px,
    rgba(0, 0, 0, 0.3) 0 3px 7px -3px;
}

.label-preference {
  text-align: center !important;
  text-wrap: wrap !important;
}
</style>
