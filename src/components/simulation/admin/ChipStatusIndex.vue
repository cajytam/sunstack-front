<script setup lang="ts">
import { getDateFormat } from '@/utils/dateUtils'

interface Props {
  latestStatus: object | undefined
  rounded?: string | undefined
  id?: string | undefined
}

const props = defineProps<Props>()

const getLatestStatusName = latestStatus => {
  let text = latestStatus.status ? latestStatus.status.name : latestStatus.name
  if (latestStatus.option_selected) text += ` : ${latestStatus.option_selected}`

  if (latestStatus.date_event) text += ` : ${getDateFormat(latestStatus.date_event, 'dateFormatFRBis')}`

  return text
}

const statusSuccess = ['validé', 'envoyé', 'ok', 'carton vert']
const statusWarning = ['modifier', 'en cours', 'carton orange']
const statusError = ['refusé', 'ko', 'carton rouge']

const isInString = (str: string, listToFind: Array): boolean => {
  return listToFind.some(v => str.toUpperCase().includes(v.toUpperCase()))
}
</script>

l
<template>
  <VChip
    :id="props.id ? props.id : null"
    :class="props.class ? props.class : null"
    :rounded="props.rounded ? props.rounded : null"
    :text="props.latestStatus ? getLatestStatusName(props.latestStatus) : 'Devis généré'"
    :color="
      !props.latestStatus
        ? 'secondary'
        : isInString(getLatestStatusName(props.latestStatus), statusSuccess)
          ? 'success'
          : isInString(getLatestStatusName(props.latestStatus), statusError)
            ? 'error'
            : isInString(getLatestStatusName(props.latestStatus), statusWarning)
              ? 'warning'
              : props.latestStatus.status
                ? props.latestStatus.status.color
                : props.latestStatus.color
    "
  />
</template>

<style scoped lang="scss"></style>
