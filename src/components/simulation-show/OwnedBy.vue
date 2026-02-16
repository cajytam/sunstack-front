<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { getByRole } from '@/services/userService'
import { fetchGetById, fetchPatchById } from '@/services/api'
import { postSimulationHistory } from '@/services/historyService'
import { ability } from '@/plugins/casl/casl'

interface Props {
  ownerImage: string | null
  ownerName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  changeOwnerImage: [value: string]
  changeOwnerName: [value: string]
}>()

const route = useRoute()

const baseURL = import.meta.env.VITE_API_URI

const simulationId = route.params.simulationId
const isDisplayAlert = ref(false)
const isPersisting = ref(false)

const notificationContent = reactive({
  alertType: '',
  title: '',
  text: '',
})

const userStore = useUserStore()
const { authUser } = userStore

const salersItems = ref([])
const isChangingOwner = ref(false)
const newSaler = ref(null)

onMounted(() => {
  if (ability.can('manage', 'all')) {
    getByRole('ROLE_SALES')
      .then(res => {
        salersItems.value = res.data['hydra:member'].sort((a, b) =>
          a.fullName > b.fullName ? 1 : b.fullName > a.fullName ? -1 : 0,
        )
      })
      .catch(err => console.error(err))
  }
})

const onSubmitChangeOwner = () => {
  if (newSaler.value !== null) {
    isPersisting.value = true

    fetchPatchById('simulation', simulationId, {
      ownedBy: newSaler.value,
    })
      .then(() => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'success'
        notificationContent.title = 'Le commercial a bien été mis à jour'

        const previousOwner = props.ownerName

        fetchGetById('user', newSaler.value.split('/').pop())
          .then(res => {
            emit('changeOwnerName', res.fullName)
            emit('changeOwnerImage', res.picture)

            postSimulationHistory(
              simulationId,
              'Changement du responsable du devis',
              userStore.user.uri,
              `Nouveau responsable : ${res.fullName} (Précédemment : ${previousOwner})`,
            )
              .then(res => {
                if (process.env.NODE_ENV === 'development') console.log(res)

                // getHistory()
              })
              .catch(err => console.error(err))
          })
          .finally(() => {
            newSaler.value = null
            isChangingOwner.value = false
          })
      })
      .catch(err => {
        isDisplayAlert.value = true
        notificationContent.alertType = 'error'
        notificationContent.title = 'Erreur lors de la prise en compte du tarif manuel'
        notificationContent.text = err.response.data['hydra:description']
        console.error(err)
      })
      .finally(() => (isPersisting.value = false))
  }
}
</script>

<template>
  <VCardText>
    <div class="d-flex justify-space-between align-center">
      <h6 class="d-flex align-center text-h6 ml-3 font-weight-bold">
        <VIcon
          icon="mdi-user-tie"
          color="primary"
        />
        <span class="ml-2">{{ isChangingOwner ? 'Changer le responsable' : 'Responsable' }}</span>
      </h6>
      <VBtn
        v-if="ability.can('manage', 'all')"
        :icon="isChangingOwner ? 'carbon:return' : 'lucide:pen-line'"
        color="info"
        variant="text"
        @click.prevent="isChangingOwner = !isChangingOwner"
      />
    </div>
    <VDivider class="mx-3" />
    <VRow
      justify="center"
      align="center"
      class="my-5"
    >
      <div v-if="!isChangingOwner">
        <VAvatar
          class="mr-5"
          size="64"
          :image="
            props.ownerImage
              ? `${baseURL}img/users/${props.ownerImage}`
              : `${baseURL}img/logo/no-avatar.jpg
            `
          "
        />
        <span class="text-h5 font-weight-bold">
          {{ props.ownerName }}
        </span>
      </div>
      <div
        v-else
        class="w-75"
      >
        <VAutocomplete
          v-model="newSaler"
          :items="salersItems"
          item-value="@id"
          item-title="fullName"
          variant="filled"
        >
          <template #selection="{ props, item }">
            <VListItem
              v-bind="props"
              :prepend-avatar="
                item.raw.picture
                  ? `${baseURL}img/users/${item.raw.picture}`
                  : `${baseURL}img/logo/no-avatar.jpg
              `
              "
              :title="item.raw.fullName"
              :subtitle="item.raw.location ? item.raw.location.name : ''"
            />
          </template>
          <template #item="{ props, item }">
            <VListItem
              v-bind="props"
              :prepend-avatar="
                item.raw.picture
                  ? `${baseURL}img/users/${item.raw.picture}`
                  : `${baseURL}img/logo/no-avatar.jpg
              `
              "
              :title="item.raw.fullName"
              :subtitle="item.raw.location ? item.raw.location.name : ''"
            />
          </template>
        </VAutocomplete>
        <div class="d-flex justify-center mt-5">
          <VBtn
            text="Modifier"
            color="info"
            :loading="isPersisting"
            prepend-icon="iconamoon:edit"
            @click.prevent="onSubmitChangeOwner"
          />
        </div>
      </div>
    </VRow>
  </VCardText>
  <VSnackbar
    :timeout="5000"
    :color="notificationContent.alertType"
    v-model="isDisplayAlert"
  >
    <h3 class="text-h6 text-white font-weight-bold mb-2">{{ notificationContent.title }}</h3>
    {{ notificationContent.text }}
  </VSnackbar>
</template>

<style scoped lang="scss"></style>
