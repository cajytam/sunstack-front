<script lang="ts" setup>
import type { Notification } from '@layouts/types'
import {
  deleteNotification,
  getNotificationsForUser,
  mappingNotificationRoute,
  patchNotification,
} from '@/services/notificationService'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const { authUser } = userStore

const router = useRouter()

const notifications = ref<Notification[]>([])

onMounted(() => {
  getNotificationsForUser(authUser.uri)
    .then(res => {
      const rawNotifications = res['hydra:member']

      notifications.value = rawNotifications

      if (process.env.NODE_ENV === 'development') console.log(res)
    })
    .catch(err => console.error(err))
})

const onOpenNotification = (notification: Notification) => {
  router.replace('/dashboard').then(() => {
    router.push({
      name: mappingNotificationRoute.route[notification.url.name],
      params: { [notification.url.id_name]: notification.url.id },
      query: notification.url?.query ? notification.url.query : null,
    })
  })
}

const removeNotification = (notificationId: number) => {
  notifications.value.forEach((item, index) => {
    if (notificationId === item.id) {
      notifications.value.splice(index, 1)
      deleteNotification(item.id)
        .then(res => {
          if (process.env.NODE_ENV === 'development') console.log(res)
        })
        .catch(err => console.error(err))
    }
  })
}

const markRead = async (notificationId: number[]) => {
  for (const item of notifications.value) {
    for (const id of notificationId) {
      if (id === item.id && !item.isRead) {
        item.isRead = true
        await patchNotification(item.id, {
          isRead: true,
        })
          .then(res => {
            if (process.env.NODE_ENV === 'development') console.log(res)
          })
          .catch(err => console.error(err))
      }
    }
  }
}

const markUnRead = (notificationId: number[]) => {
  notifications.value.forEach(item => {
    notificationId.forEach(id => {
      if (id === item.id && item.isRead) {
        item.isRead = false
        patchNotification(item.id, {
          isRead: false,
        })
          .then(res => {
            if (process.env.NODE_ENV === 'development') console.log(res)
          })
          .catch(err => console.error(err))
      }
    })
  })
}

const handleNotificationClick = async (notification: Notification) => {
  if (!notification.isRead) await markRead([notification.id])

  onOpenNotification(notification)
}
</script>

<template>
  <Notifications
    :notifications="notifications"
    @remove="removeNotification"
    @read="markRead"
    @unread="markUnRead"
    @click:notification="handleNotificationClick"
  />
</template>
