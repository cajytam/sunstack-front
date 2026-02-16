<script setup lang="ts">
import { getAll, getById, patchById } from '@/services/api'
import { getJsonOfChangedValues } from '@/utils/formUtils'
import { getAcronym } from '@/utils/stringUtils'
import { getDateFormat } from '@/utils/dateUtils'
import { getArrayOfValueFromArrayOfObject } from '@/utils/arrayUtils'
import { list_roles } from '@/services/roleService'
import { useUserStore } from '@/stores/user'

const baseURL = import.meta.env.VITE_API_URI
const route = useRoute()

const userId = route.params.userId

const userStore = useUserStore()
const { authUser } = userStore

const userData = reactive({
  email: null,
  firstname: null,
  lastname: null,
  phone: null,
  title: null,
  location: null,
  picture: null,
  roles: [],
})

const userHistories = ref([])
const userFullName = ref()
const userIsActive = ref()
const tab = ref(null)

/**
 * Mot de passe
 */
const newPassword = ref()
const newPasswordRepeat = ref()
const showPassword = ref(false)
const showRepeat = ref(false)

/**
 * UX
 */
const isDisplayAlert = ref(false)
const isLoading = ref(true)
const isPersisting = ref(false)

const notificationContent = reactive({
  alertType: '',
  title: '',
  text: '',
})

let userDataOld = {}
const openEditUser = ref(false)

/**
 * Upload avatar
 */
const avatarInput = ref(null)
const isUploadingAvatar = ref(false)

const listAgences = ref([])

onMounted(() => {
  getById('user', userId, true, 'get+ld')
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
      userData.roles = res.data.roles

      const indexRoleUser = userData.roles.indexOf('ROLE_USER')
      if (indexRoleUser >= 0) {
        userData.roles.splice(indexRoleUser, 1)
      }

      userDataOld = JSON.parse(JSON.stringify(userData))

      userIsActive.value = res.data.active
      userFullName.value = res.data.fullName
      userHistories.value = res.data.histories.sort((elem1, elem2) => {
        return elem2.id - elem1.id
      })
    })
    .catch(err => console.error(err))
    .finally(() => (isLoading.value = false))

  getAll('location', true, 'get+ld')
    .then(res => {
      listAgences.value = getArrayOfValueFromArrayOfObject(res.data, 'name').sort((a, b) =>
        a.name > b.name ? 1 : b.name > a.name ? -1 : 0,
      )
    })
    .catch(err => console.error(err))
})

const onChangePassword = () => {
  if (!newPassword.value || newPassword.value.trim().length === 0) {
    isDisplayAlert.value = true
    notificationContent.alertType = 'error'
    notificationContent.title = 'Le mot de passe ne peut pas être vide'
    notificationContent.text = null
  } else if (newPassword.value !== newPasswordRepeat.value) {
    isDisplayAlert.value = true
    notificationContent.alertType = 'error'
    notificationContent.title = 'Les mots de passe ne sont pas identiques'
    notificationContent.text = null
  } else {
    isPersisting.value = true
    patchById('user', userId, {
      plainPassword: newPassword.value,
    })
      .then(() => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'success'
        notificationContent.title = 'Mot de passe modifié avec succès'
        notificationContent.text = null
      })
      .catch(err => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'error'
        notificationContent.title = 'erreur lors de la modification du mot de passe'
        notificationContent.text = err.response.data['hydra:description']
        console.error(err)
      })
      .finally(() => (isPersisting.value = false))
  }
}

const onUserChangeStatus = () => {
  isPersisting.value = true

  const data = userIsActive.value ? new Date() : null

  patchById('user', userId, {
    deletedAt: data,
  })
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      userIsActive.value = !userIsActive.value
      isDisplayAlert.value = true
      notificationContent.alertType = 'success'
      notificationContent.title = `Le profil de ${userFullName.value} a bien été ${userIsActive.value ? 'activé' : 'désactivé'}`
      notificationContent.text = null
    })
    .catch(err => {
      isDisplayAlert.value = true
      notificationContent.alertType = 'error'
      notificationContent.title = 'Erreur lors de la modification du statut'
      notificationContent.text = null
      console.error(err)
    })
    .finally(() => (isPersisting.value = false))
}

const onAvatarChange = event => {
  const selectedFile = event.target.files[0]

  if (selectedFile) {
    isUploadingAvatar.value = true

    patchById(
      'user',
      userId,
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
        notificationContent.text = null
      })
      .catch(err => {
        console.error(err)
        isDisplayAlert.value = true
        notificationContent.alertType = 'error'
        notificationContent.title = 'erreur lors de la modification de votre avatar'
        notificationContent.text = err.response.data['hydra:description']
      })
      .finally(() => (isUploadingAvatar.value = false))
  }
}

const onSubmitPatchUser = () => {
  isPersisting.value = true

  const patchData = getJsonOfChangedValues(userDataOld, JSON.parse(JSON.stringify(userData)))

  patchById('user', userId, patchData)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      userData.location =
        typeof res.data.location !== 'undefined'
          ? listAgences.value.find(agence => agence.id === res.data.location)
          : ''

      isDisplayAlert.value = true
      notificationContent.alertType = 'success'
      notificationContent.title = `Le profil de ${userFullName.value} a bien été mis à jour`
      notificationContent.text = null
      openEditUser.value = false
    })
    .catch(err => {
      console.error(err)
      notificationContent.alertType = 'error'
      notificationContent.title = 'erreur lors de la modification du profil'
      notificationContent.text = err.response.data['hydra:description']
    })
    .finally(() => (isPersisting.value = false))
}
</script>

<template>
  <div>
    <VFadeTransition>
      <VMain v-if="!isLoading">
        <VRow>
          <VCol
            md="5"
            lg="4"
            cols="12"
          >
            <VRow>
              <VCol cols="12">
                <VCard variant="elevated">
                  <VCardText class="text-center pt-15">
                    <template v-if="isUploadingAvatar">
                      <VProgressCircular
                        color="primary"
                        indeterminate
                        :size="120"
                        :width="7"
                      />
                    </template>

                    <template v-else>
                      <VAvatar
                        v-if="userData.picture"
                        rounded="lg"
                        size="120"
                        class="cursor-pointer"
                        :image="`${baseURL}/img/users/${userData.picture}`"
                        @click.prevent="$refs.avatarInput.click()"
                      />
                      <VAvatar
                        v-else
                        rounded="lg "
                        size="120"
                        variant="tonal"
                        class="cursor-pointer"
                        @click.prevent="$refs.avatarInput.click()"
                      >
                        <span class="text-5xl font-weight-medium">
                          {{ getAcronym(userFullName) }}
                        </span>
                      </VAvatar>
                      <input
                        ref="avatarInput"
                        type="file"
                        name="file"
                        accept="image/*"
                        style="display: none"
                        @change="onAvatarChange"
                      />
                    </template>
                    <h6 class="mt-6 text-h6">
                      {{ userFullName ? userFullName : '-' }}
                    </h6>
                    <div v-if="userData.roles.length > 0">
                      <RoleChip
                        v-for="role in userData.roles"
                        :key="role.id"
                        class="mt-3"
                        :text="role"
                      />
                    </div>
                    <div
                      v-else
                      class="font-italic mt-3 text-caption"
                    >
                      Aucun rôle spécifique attribué à cet utilisateur
                    </div>
                  </VCardText>
                  <VCardText>
                    <h6 class="text-h6">Détails</h6>
                    <VDivider class="my-4" />
                    <VList
                      density="default"
                      variant="text"
                    >
                      <VListItem class="min-height-0">
                        <h6 class="text-sm font-weight-medium">
                          Email :
                          <span class="text-body-2">
                            {{ userData.email }}
                          </span>
                        </h6>
                      </VListItem>
                      <VListItem class="min-height-0">
                        <h6 class="text-sm font-weight-medium">
                          Statut :
                          <VChip
                            class="text-capitalize"
                            :text="userIsActive ? 'Actif' : 'Désactivé'"
                            :color="userIsActive ? 'success' : 'error'"
                            rounded="sm"
                          />
                        </h6>
                      </VListItem>
                      <VListItem class="min-height-0">
                        <h6 class="text-sm font-weight-medium">
                          Nom :
                          <span class="text-body-2">
                            {{ userData.lastname ? userData.lastname : '-' }}
                          </span>
                        </h6>
                      </VListItem>
                      <VListItem class="min-height-0">
                        <h6 class="text-sm font-weight-medium">
                          Prénom :
                          <span class="text-body-2">
                            {{ userData.firstname ? userData.firstname : '-' }}
                          </span>
                        </h6>
                      </VListItem>
                      <VListItem class="min-height-0">
                        <h6 class="text-sm font-weight-medium">
                          Téléphone :
                          <span class="text-body-2">
                            {{ userData.phone ? userData.phone : '-' }}
                          </span>
                        </h6>
                      </VListItem>
                      <VListItem class="min-height-0">
                        <h6 class="text-sm font-weight-medium">
                          Fonction :
                          <span class="text-body-2">
                            {{ userData.title ? userData.title : '-' }}
                          </span>
                        </h6>
                      </VListItem>
                      <VListItem class="min-height-0">
                        <h6 class="text-sm font-weight-medium">
                          Agence :
                          <span class="text-body-2">
                            {{ userData.location ? userData.location.name : '-' }}
                          </span>
                        </h6>
                      </VListItem>
                      <VListItem class="min-height-0">
                        <h6 class="text-sm font-weight-medium">
                          Date de naissance :
                          <span class="text-body-2">
                            {{ userData.dateBirthday ? getDateFormat(userData.dateBirthday, 'dateFormatFRBis') : '-' }}
                          </span>
                        </h6>
                      </VListItem>
                    </VList>
                  </VCardText>
                  <VCardText class="d-flex justify-center gap-4">
                    <VBtn
                      text="Éditer"
                      variant="elevated"
                      @click.prevent="openEditUser = true"
                    />
                    <VBtn
                      v-if="parseInt(authUser.id) !== parseInt(userId)"
                      :text="userIsActive ? 'Désactiver' : 'Activer'"
                      variant="outlined"
                      :color="userIsActive ? 'error' : 'success'"
                      :loading="isPersisting"
                      @click.prevent="onUserChangeStatus"
                    />
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </VCol>
          <VCol
            md="7"
            lg="8"
            cols="12"
          >
            <VTabs
              v-model="tab"
              class="v-tabs-pill"
              centered
              show-arrows
              color="info"
            >
              <VTab value="tab-1">
                <VIcon
                  icon="material-symbols:history"
                  class="me-1"
                />
                Activités
              </VTab>
              <VTab value="tab-2">
                <VIcon
                  icon="mingcute:user-security-fill"
                  class="me-1"
                />
                Sécurité
              </VTab>
              <VTab value="tab-3">
                <VIcon
                  icon="fluent-mdl2:permissions"
                  class="me-1"
                />
                Rôles et permissions
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
                      <VCardTitle class="bg-info-700">
                        <span class="text-h6 text-white"> Activités </span>
                      </VCardTitle>
                      <VSpacer />
                      <VCardText>
                        <VTimeline
                          v-if="userHistories.length > 0"
                          align="start"
                          density="comfortable"
                          side="end"
                          class="history-timeline__dot ml-5"
                        >
                          <VTimelineItem
                            v-for="history in userHistories"
                            :key="history.id"
                            width="auto"
                          >
                            <template #icon>
                              <VAvatar
                                :image="
                                  userData.picture
                                    ? `${baseURL}img/users/${userData.picture}`
                                    : `${baseURL}img/logo/no-avatar.jpg
                              `
                                "
                              />
                            </template>

                            <template #opposite>
                              <div class="text-center">
                                <h6 class="text-body-1">
                                  {{ getDateFormat(history.doneAt).split('à')[0].trim() }}
                                </h6>
                                <span class="font-italic">
                                  à {{ getDateFormat(history.doneAt).split('à')[1].trim() }}
                                </span>
                              </div>
                            </template>
                            <VCard class="history-card__shadow px-3 pb-3 mr-3">
                              <h2>
                                <RouterLink
                                  v-if="history.simulation"
                                  v-ripple
                                  :to="{
                                    name: 'simulation-show-simulationId',
                                    params: { simulationId: history.simulation.id },
                                  }"
                                >
                                  {{ history.userTitle }}
                                </RouterLink>
                                <span v-else>
                                  {{ history.userTitle }}
                                </span>
                              </h2>
                              <span class="d-block pt-2 text-subtitle-1">
                                {{ history.title }}
                              </span>
                              <span
                                v-if="history.description"
                                class="text-body-2 font-italic"
                                v-html="history.description.replaceAll('\n', '<br>')"
                              />
                            </VCard>
                          </VTimelineItem>
                        </VTimeline>
                        <p v-else>Aucun historique à afficher</p>
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
                      <VCardTitle class="bg-info-700">
                        <span class="text-h6 text-white"> Modifier le mot de passe </span>
                      </VCardTitle>
                      <VDivider />
                      <VCardItem>
                        <VForm>
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
              <!-- Permissions -->
              <VWindowItem
                key="3"
                value="tab-3"
                class="no-transition"
              >
                <VRow>
                  <VCol cols="12">
                    <VCard>
                      <VCardTitle class="bg-info-700">
                        <span class="text-h6 text-white"> Rôles </span>
                      </VCardTitle>
                      <VCardItem>
                        <VRow>
                          <VCol cols="12">
                            <VRow
                              align="center"
                              justify="center"
                            >
                              <VCol col="3"> Rôles attribués :</VCol>
                              <VCol cols="9">
                                <VAutocomplete
                                  v-model="userData.roles"
                                  color="info"
                                  theme="info"
                                  variant="filled"
                                  closable-chips
                                  auto-select-first
                                  chips
                                  multiple
                                  :items="list_roles"
                                  item-value="id"
                                  item-title="name"
                                />
                              </VCol>
                            </VRow>
                          </VCol>
                          <VCol
                            cols="12"
                            class="d-flex justify-center"
                          >
                            <VBtn
                              color="info"
                              variant="elevated"
                              text="Modifier groupes"
                              prepend-icon="la:user-edit"
                              :loading="isPersisting"
                              @click.prevent="onSubmitPatchUser"
                            />
                          </VCol>
                        </VRow>
                      </VCardItem>
                    </VCard>
                  </VCol>
                </VRow>
              </VWindowItem>
            </VWindow>
          </VCol>
        </VRow>
      </VMain>
    </VFadeTransition>
    <VMain
      v-if="isLoading"
      class="d-flex justify-center mt-8"
    >
      <VProgressCircular
        size="150"
        width="12"
        color="primary"
        indeterminate
      />
    </VMain>
    <VDialog
      v-model="openEditUser"
      persistent
      width="1024"
    >
      <VCard>
        <VCardTitle> Modifier le profil de {{ userFullName }}</VCardTitle>
        <DialogCloseBtn @click="openEditUser = false" />
        <VForm class="mt-6">
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="userData.lastname"
                  label="Nom"
                  color="primary"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="userData.firstname"
                  label="Prénom"
                  color="primary"
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
                  color="primary"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="userData.phone"
                  label="Numéro de téléphone"
                  color="primary"
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
                  color="primary"
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
                  color="primary"
                />
              </VCol>
            </VRow>
          </VCardText>
          <VCardText class="d-flex justify-center">
            <VBtn
              color="primary"
              variant="elevated"
              text="Modifier utilisateur"
              prepend-icon="la:user-edit"
              :loading="isPersisting"
              @click.prevent="onSubmitPatchUser"
            />
          </VCardText>
        </VForm>
      </VCard>
    </VDialog>
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
.history-card__shadow {
  box-shadow:
    rgba(var(--v-theme-grey-900), 0.25) 0 4px 8px -2px,
    rgba(var(--v-theme-grey-900), 0.08) 0 0 0 1px;
}

:deep(.history-timeline__dot .v-timeline-divider__inner-dot) {
  background-color: transparent !important;
}
</style>
