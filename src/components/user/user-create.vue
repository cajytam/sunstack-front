<script setup lang="ts">
import { getAll } from '@/services/api'
import { postUser } from '@/services/userService'

const props = defineProps({
  dialog: { type: Boolean, required: true },
})

const emit = defineEmits(['isCloseDialog'])

const newUser = reactive({
  email: null,
  lastname: null,
  plainPassword: null,
  firstname: null,
  location: null,
  title: null,
  phone: null,
})

const isLoading = ref(false)

const isDisplayAlert = ref(false)

const notificationContent = reactive({
  icon: '',
  alertType: '',
  title: '',
  text: '',
})

const onCloseDialog = () => {
  emit('isCloseDialog')
}

const listLocations = ref([])

onMounted(() => {
  getAll('location', true, 'get+ld').then(res => {
    listLocations.value = res.data['hydra:member'].sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
  })
})

const onSubmitNewUser = () => {
  isLoading.value = true
  postUser(newUser)
    .then(() => {
      isDisplayAlert.value = true
      notificationContent.icon = 'teenyicons:shield-tick-solid'
      notificationContent.alertType = 'success'
      notificationContent.title = 'Utilisateur créé avec succès'

      newUser.email = null
      newUser.lastname = null
      newUser.plainPassword = null
      newUser.firstname = null
      newUser.location = null
      newUser.title = null
      newUser.phone = null
      onCloseDialog()
    })
    .catch(err => {
      console.error(err)
      isDisplayAlert.value = true
      notificationContent.icon = 'ic:outline-error'
      notificationContent.alertType = 'error'
      notificationContent.title = "erreur lors de la création de l'utilisateur"
      notificationContent.text = err.response.data['hydra:description']
    })
    .finally(() => (isLoading.value = false))
}
</script>

<template>
  <VDialog
    v-model="props.dialog"
    persistent
    width="1024"
  >
    <VCard>
      <VCardTitle class="pt-5 mb-0">
        <span class="text-h5"> Créer un utilisateur </span>
      </VCardTitle>
      <VCardText class="pt-0">
        <VContainer>
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="newUser.email"
                label="Adresse mail*"
                required
                name="email"
              />
            </VCol>
          </VRow>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="newUser.lastname"
                label="Nom*"
                name="name"
                required
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="newUser.firstname"
                label="Prénom*"
                required
                name="firstname"
              />
            </VCol>
            <VCol
              v-if="false"
              cols="12"
            >
              <VSelect
                :items="['', 'Administrateur', 'Commercial']"
                label="Groupe*"
                required
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="newUser.plainPassword"
                label="Mot de passe*"
                required
                type="password"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
              md="4"
            >
              <VAutocomplete
                v-model="newUser.location"
                label="Bureau"
                :items="listLocations"
                item-value="@id"
                item-title="name"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
              md="4"
            >
              <VTextField
                v-model="newUser.title"
                label="Titre"
                name="title"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
              md="4"
            >
              <VTextField
                v-model="newUser.phone"
                label="Numéro de téléphone"
                name="phone"
              />
            </VCol>
          </VRow>
        </VContainer>
        <small>*Champs obligatoires</small>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="text"
          text="Annuler"
          @click.prevent="onCloseDialog"
        />
        <VBtn
          color="primary"
          variant="elevated"
          text="Créer utilisateur"
          :loading="isLoading"
          @click.prevent="onSubmitNewUser"
        />
      </VCardActions>
    </VCard>
  </VDialog>
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
</template>

<style scoped lang="scss"></style>
