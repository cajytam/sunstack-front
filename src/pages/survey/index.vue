<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { getAllSurveySimulation } from '@/services/surveyService'
import { ability } from '@/plugins/casl/casl'

const userStore = useUserStore()
const { authUser } = userStore

const surveysSimulation = ref([])

onMounted(() => {
  if (ability.can('manage', 'all')) {
    getAllSurveySimulation()
      .then(res => {
        surveysSimulation.value = res.sort((elem1, elem2) => {
          return elem2.id - elem1.id
        })
      })
      .catch(err => console.error(err))
  }
})
</script>

<template>
  <VMain>
    <VRow>
      <VCol>
        <VCard>
          <pre>{{ surveysSimulation }}</pre>
        </VCard>
      </VCol>
    </VRow>
  </VMain>
</template>

<style scoped lang="scss"></style>
