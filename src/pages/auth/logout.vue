<route lang="json">
{
  "meta": {
    "layout": "blank"
  }
}
</route>

<script setup lang="ts">
import axios from 'axios'

const baseURI = import.meta.env.VITE_API_URI

onMounted(() => {
  axios
    .get(`${baseURI}api/logout`, {
      withCredentials: true,
    })
    .finally(() => {
      localStorage.clear()
      window.location.replace('/auth/login')
    })
})
</script>

<template>
  <VRow class="mt-8 text-center">
    <VCol>
      <h1 class="text-h2">Déconnexion...</h1>
      <VIcon
        class="mt-5"
        icon="icon-park-outline:bye"
        color="primary"
        size="x-large"
      />
    </VCol>
  </VRow>
</template>
