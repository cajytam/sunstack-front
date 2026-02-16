<script setup lang="ts">
import { getAllTasksOpenedByUser } from '@/services/taskSimulationService'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const { authUser } = userStore

const allTasks = ref([])
const isLoading = ref(true)
const activeTab = ref('received')

onMounted(() => {
  getAllTasksOpenedByUser(authUser.id)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.table('tasksReceived => ', res)

      allTasks.value = res
    })
    .catch(err => console.error(err))
    .finally(() => (isLoading.value = false))
})

const receivedTasks = computed(() => allTasks.value.filter(task => !task.opened))
const openedTasks = computed(() => allTasks.value.filter(task => task.opened))

watch(
  receivedTasks,
  value => {
    if (value.length <= 0) {
      activeTab.value = 'opened'
    } else {
      activeTab.value = 'received'
    }
  },
  { immediate: true },
)
</script>

<template>
  <v-container>
    <VTabs
      v-model="activeTab"
      grow
    >
      <VTab
        value="received"
        class="text-none"
        >Tâches qui me sont adressées
      </VTab>
      <VTab
        value="opened"
        class="text-none"
        >Tâches que j'ai créé
      </VTab>
    </VTabs>

    <VFadeTransition mode="out-in">
      <div v-if="!isLoading">
        <VWindow v-model="activeTab">
          <VWindowItem value="received">
            <TaskList :tasks="receivedTasks" />
          </VWindowItem>

          <VWindowItem value="opened">
            <TaskList
              :tasks="openedTasks"
              :is-opened-by="true"
            />
          </VWindowItem>
        </VWindow>
      </div>
      <div v-else>
        <VSkeletonLoader
          class="ma-5"
          type="card"
        />
      </div>
    </VFadeTransition>
  </v-container>
</template>

<style scoped lang="scss">
.v-window {
  margin-top: 20px;
}

.v-tab {
  text-transform: none;
}
</style>
