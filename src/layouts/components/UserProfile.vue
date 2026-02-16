<script setup lang="ts">
const uriApiPath = import.meta.env.VITE_API_URI

const userAvatar = localStorage.getItem('avatar') ? localStorage.getItem('avatar') : 'logo/no-avatar.jpg'
const userFullName = localStorage.getItem('fullname')
const userTitle = localStorage.getItem('title')
</script>

<template>
  <VAvatar class="cursor-pointer">
    <VImg :src="`${uriApiPath}img/${userAvatar}`" />

    <!-- SECTION Menu -->
    <VMenu
      activator="parent"
      width="230"
      location="bottom end"
      offset="14px"
    >
      <VList>
        <!-- 👉 User Avatar & Name -->
        <VListItem>
          <template #prepend>
            <VListItemAction start>
              <VAvatar>
                <VImg :src="`${uriApiPath}img/${userAvatar}`" />
              </VAvatar>
            </VListItemAction>
          </template>

          <VListItemTitle class="font-weight-semibold">
            {{ userFullName }}
          </VListItemTitle>
          <VListItemSubtitle>{{ userTitle }}</VListItemSubtitle>
        </VListItem>
        <VDivider class="my-2" />

        <!-- 👉 Profile -->
        <VListItem :to="{ name: 'me-settings' }">
          <template #prepend>
            <VIcon
              class="me-2"
              icon="bx-user"
              size="22"
            />
          </template>

          <VListItemTitle>Mon profil</VListItemTitle>
        </VListItem>

        <VDivider class="my-2" />

        <!-- 👉 Logout -->
        <VListItem :to="{ name: 'auth-logout' }">
          <template #prepend>
            <VIcon
              class="me-2"
              icon="bx-log-out"
              size="22"
            />
          </template>
          <VListItemTitle>Déconnexion</VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
    <!-- !SECTION -->
  </VAvatar>
</template>
