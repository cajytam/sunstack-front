<script setup lang="ts">
import { getAll } from '@/services/api'

const router = useRouter()

const baseURL = import.meta.env.VITE_API_URI

const userList = ref()
const isError = ref(false)
const isLoading = ref(true)
const search = ref('')
const openCreateUserDialog = ref(false)

const headers = [
  { title: 'Utilisateur', align: 'start', key: 'fullName' },
  { title: 'Email', align: 'start', key: 'email' },
  { title: 'Région', align: 'start', key: 'location' },
  { title: 'Rôle', align: 'start', key: 'roles' },
]

const getAllUsers = () => {
  getAll('user')
    .then(res => {
      userList.value = res.data
    })
    .catch(err => {
      isError.value = true
      console.error(err)
    })
    .finally(() => {
      isLoading.value = false
    })
}

onMounted(() => {
  getAllUsers()
})

const onCloseCreateUserDialog = () => {
  openCreateUserDialog.value = !openCreateUserDialog
  getAllUsers()
}

const onSelectUser = row => {
  router.push({ name: 'user-show-userId', params: { userId: row.id } })
}
</script>

<template>
  <div>
    <VMain>
      <VCard
        v-if="false"
        class="mb-6"
      >
        <VCardTitle> Filtres </VCardTitle>
        <VCardText>
          <VRow
            justify="space-around"
            align="center"
          >
            <VCol cols="4">
              <VSelect label="Rôles" />
            </VCol>
            <VCol cols="4">
              <VSelect label="Région" />
            </VCol>
            <VCol cols="4">
              <VSelect label="Statut" />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
      <VCard>
        <VCardText class="d-flex flex-wrap gap-4">
          <VBtn
            v-if="false"
            text="Exporter"
            variant="tonal"
            color="secondary"
            prepend-icon="ph:export"
          />
          <div class="flex-grow-1" />
          <div class="d-flex gap-6 app-user-search-filter align-center">
            <VTextField
              v-model="search"
              density="compact"
              clearable
              placeholder="Rechercher utilisateur..."
            />
            <VBtn
              text="Créer utilisateur"
              color="info"
              @click.prevent="openCreateUserDialog = !openCreateUserDialog"
            />
          </div>
        </VCardText>
        <VDataTable
          class="rounded-0 text-body-1"
          :headers="headers"
          :loading="isLoading"
          :search="search"
          :items="userList"
          :sort-by="[{ key: 'fullName', order: 'asc' }]"
        >
          <template #item="{ item }">
            <tr
              class="cursor-pointer"
              :class="{ 'user--disabled': !item.active }"
              @click="onSelectUser(item)"
            >
              <td>
                <VList class="background-transparent">
                  <VListItem
                    :prepend-avatar="
                      item.picture
                        ? `${baseURL}img/users/${item.picture}`
                        : `${baseURL}img/logo/no-avatar.jpg
                  `
                    "
                    :title="item.fullName"
                    :subtitle="item.title"
                  />
                </VList>
              </td>
              <td>{{ item.email }}</td>
              <td :class="{ 'font-italic text-body-2': !item.location }">
                {{ item.location ? item.location.name : 'Non renseigné' }}
              </td>
              <td>
                <template v-if="item.active">
                  <RoleChip
                    v-for="role in item.roles"
                    :key="role.id"
                    :text="role"
                  />
                </template>
                <VChip
                  v-else
                  text="Désactivé"
                  rounded="sm"
                />
              </td>
            </tr>
          </template>
        </VDataTable>
      </VCard>
      <Notification
        v-if="isError"
        title="Erreur lors du chargement des données"
        alert-type="error"
        icon="carbon:data-error"
        text="Erreur de communication avec la base de donnée"
        is-closable
      />
    </VMain>
    <UserCreate
      :dialog="openCreateUserDialog"
      @is-close-dialog="e => onCloseCreateUserDialog()"
    />
  </div>
</template>

<style scoped lang="scss">
:deep(.v-data-table__th) {
  background-color: var(--primary-600) !important;
  color: white !important;
}

.app-user-search-filter {
  inline-size: 28.0625rem;
}

.user--disabled {
  opacity: 0.45 !important;
}
</style>
