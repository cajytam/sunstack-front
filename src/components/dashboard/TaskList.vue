<script lang="ts" setup>
import type { Notification } from '@layouts/types'
import { getDateFormat } from '@/utils/dateUtils'
import { mappingNotificationRoute } from '@/services/notificationService'

const props = defineProps({
  tasks: {
    type: Array,
    required: true,
  },
  isOpenedBy: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()

const getBorderColor = updateDate => {
  const now = new Date()
  const lastUpdate = new Date(updateDate)
  const diffDays = Math.ceil((now - lastUpdate) / (1000 * 60 * 60 * 24))

  if (diffDays <= 2) return 'green'
  if (diffDays <= 5) return 'orange'
  return 'red'
}

const onOpenNotification = (notification: Notification) => {
  router.push({
    name: mappingNotificationRoute.route[notification.name],
    params: { [notification.id_name]: notification.id },
    query: notification?.query ? notification.query : null,
  })
}
</script>

<template>
  <VRow v-if="tasks.length > 0">
    <VCol cols="12">
      <VCard
        @click="onOpenNotification(task.link)"
        v-for="task in tasks"
        :key="task.link.id"
        class="ma-4 pl-2 card-hover cursor-pointer"
        :class="[
          `border-left-${getBorderColor(task.updatedAt || task.createdAt)}`,
          props.isOpenedBy && 'bg-var-theme-background',
        ]"
      >
        <VCardTitle class="text-h6 d-flex flex-row align-center mb-1">
          <VIcon
            :color="props.isOpenedBy ? 'info' : 'primary'"
            class="mr-2"
            :icon="props.isOpenedBy ? 'mdi:invoice-send-outline' : 'mdi-clipboard-text-outline'"
          />
          <div>
            <h2 class="text-h6 mb-1">{{ task.customer_name }}</h2>
            <h4 class="text-overline">{{ task.simulation_title }}</h4>
          </div>
        </VCardTitle>
        <VCardText>
          <p class="mb-2">{{ task.title }}</p>
          <VChip
            :color="task.updatedAt ? 'secondary' : props.isOpenedBy ? 'info' : 'primary'"
            size="small"
            class="mt-2 mr-2"
          >
            Créée le : {{ getDateFormat(task.createdAt, 'dateLiteral') }}
          </VChip>
          <VChip
            v-if="task.updatedAt"
            color="primary"
            size="small"
            class="mt-2"
          >
            dernière MAJ : {{ getDateFormat(task.updatedAt, 'dateLiteral') }}
          </VChip>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
  <VRow v-else>
    <VCol cols="12">
      <VAlert
        type="info"
        variant="tonal"
        text="Aucune tâche à afficher"
      />
    </VCol>
  </VRow>
</template>

<style scoped lang="scss">
.card-hover {
  border: white 1px solid;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
}

.card-hover:hover {
  box-shadow:
    rgba(50, 50, 93, 0.25) 0 6px 12px -2px,
    rgba(0, 0, 0, 0.3) 0 3px 7px -3px;
  transform: translateY(-3px);
}

.border-left-green::before,
.border-left-orange::before,
.border-left-red::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0.4rem;
}

.border-left-green {
  border-color: #4caf50;

  &::before {
    background-color: #4caf50;
  }
}

.border-left-orange {
  border-color: #ff9800;

  &::before {
    background-color: #ff9800;
  }
}

.border-left-red {
  border-color: #f44336;

  &::before {
    background-color: #f44336;
  }
}
</style>
