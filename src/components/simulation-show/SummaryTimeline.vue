<script setup lang="ts">
import { getDateFormat, getTimeAgo } from '@/utils/dateUtils'

interface Props {
  statuses: object
  histories: object
  direction: 'start' | 'end' | null
}

const props = defineProps<Props>()

const listSteps = ref([])

const baseURL = import.meta.env.VITE_API_URI

const refreshHistory = () => {
  listSteps.value = []

  props.statuses.forEach(status => {
    const tmpStatus = {}

    tmpStatus.title = `Statut : ${status.status.name}`
    tmpStatus.description = status.dateEvent
      ? `Le ${getDateFormat(status.dateEvent, 'dateFormatFRBis')}`
      : status.reasonEvent
        ? status.reasonEvent
        : status.optionSelected
          ? status.optionSelected
          : null
    tmpStatus.userName = status.ownedBy.fullName
    tmpStatus.userPicture = status.ownedBy.picture
    tmpStatus.datetime = status.createdAt
    tmpStatus.color = status.status.color
    listSteps.value.push(tmpStatus)
  })
  props.histories.forEach(history => {
    const tmpHistory = {}

    tmpHistory.title = history.title
    tmpHistory.description = history.description ? history.description : null
    tmpHistory.userName = history.userId.fullName
    tmpHistory.userPicture = history.userId.picture
    tmpHistory.datetime = history.doneAt
    tmpHistory.color = null
    listSteps.value.push(tmpHistory)
  })
  listSteps.value = listSteps.value.sort((a, b) => (a.datetime > b.datetime ? -1 : b.datetime > a.datetime ? 1 : 0))
}

onMounted(() => {
  refreshHistory()
})

onUpdated(() => {
  refreshHistory()
})
</script>

<template>
  <VCard
    :border="true"
    class="pa-3 bg-var-theme-background"
  >
    <VCardTitle class="d-flex align-center justify-center font-weight-bold">
      <VIcon
        color="primary"
        icon="eos-icons:content-lifecycle-management"
      />
      <span class="ml-3">Étapes du devis</span>
    </VCardTitle>
    <VDivider class="mx-3" />
    <VTimeline
      v-if="listSteps.length > 0"
      :side="props.direction"
      class="text-wrap"
    >
      <VTimelineItem
        v-for="(item, id) in listSteps"
        :key="id"
        size="large"
        class="text-right"
      >
        <template #icon>
          <VAvatar
            :image="
              item.userPicture
                ? `${baseURL}img/users/${item.userPicture}`
                : `${baseURL}img/logo/no-avatar.jpg
            `
            "
          />
        </template>
        <template #opposite>
          <div class="timeline-card__left-container">
            <h6 class="text-body-1 font-weight-bold timeline-card__left-username">
              {{ item.userName }}
            </h6>
            <VTooltip
              :text="getDateFormat(item.datetime)"
              location="bottom"
            >
              <template #activator="{ props }">
                <span
                  v-bind="props"
                  class="text-caption font-italic"
                >
                  {{ getTimeAgo(item.datetime) }}
                </span>
              </template>
            </VTooltip>
          </div>
        </template>
        <VCard
          class="elevation-2 text-left py-2 timeline-card__right-container"
          :class="item.color ? `border-${item.color}` : ''"
        >
          <VCardTitle
            class="text-subtitle-1 font-weight-bold py-0 pb-1 pl-3"
            :class="item.color ? `text-${item.color}` : ''"
          >
            {{ item.title }}
          </VCardTitle>
          <VCardText
            v-if="item.description"
            class="text-body-2 font-italic pt-0 py-2 pl-3"
          >
            <span v-html="item.description.replaceAll('\n', '<br>')" />
          </VCardText>
        </VCard>
      </VTimelineItem>
    </VTimeline>
    <VCardText v-else>
      <h6 class="text-body-2 font-italic">Aucun historique à afficher</h6>
    </VCardText>
  </VCard>
</template>

<style scoped lang="scss">
.timeline-card__left-container {
  line-height: 0.8rem !important;
}

.timeline-card__right-container {
  border-left: transparent solid 0.5rem;
}

.timeline-card__left-username {
  line-height: 1.2rem !important;
}

:deep(.v-timeline-divider .v-timeline-divider__inner-dot) {
  background-color: transparent !important;
}
</style>
