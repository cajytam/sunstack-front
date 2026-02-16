<script setup lang="ts">
import { getNumberFormat } from '@/utils/numberUtils'

interface Props {
  title: string
  content: string | number | undefined
  dividerBottom: boolean
  formatCurrency?: boolean
  formatNumber?: boolean
  nbDecimals?: string
  addPrefix?: string | number
  addSuffix?: string | number
  styleItalic?: boolean
  makeClickable?: boolean
}

const props = defineProps<Props>()

const isClickable = ref(false)
const isHover = ref(false)
const iconCopy = ref('icon-park-outline:copy')
const iconColor = ref('info')

onMounted(() => {
  if (props.makeClickable) {
    if (props.content && props.content !== '-') isClickable.value = true
  }
})

const copyContent = () => {
  navigator.clipboard.writeText(props.content)
  iconCopy.value = 'typcn:tick'
  iconColor.value = 'success'

  setTimeout(() => {
    iconCopy.value = 'icon-park-outline:copy'
    iconColor.value = 'info'
  }, 3500)
}
</script>

<template>
  <VListItem>
    <div class="d-flex justify-space-between align-center">
      <span
        class="font-weight-medium me-1 text-medium-emphasis"
        :class="styleItalic ? 'font-italic text-body-2' : ''"
      >
        {{ props.title }}
      </span>
      <div class="d-flex align-center ga-2">
        <VFadeTransition mode="out-in">
          <VIcon
            v-if="isHover && isClickable"
            :icon="iconCopy"
            :color="iconColor"
          />
        </VFadeTransition>
        <span
          :class="{ 'cursor-pointer': isClickable }"
          class="text-body-1 text-wrap text-right"
          @mouseover="isClickable ? (isHover = true) : null"
          @mouseleave="isClickable ? (isHover = false) : null"
          @click="isClickable ? copyContent() : null"
        >
          {{ props.addPrefix ? ` ${props.addPrefix}` : '' }}
          {{
            props.content
              ? props.formatNumber || props.formatCurrency
                ? getNumberFormat(
                    props.content,
                    props.nbDecimals ? props.nbDecimals : 2,
                    props.nbDecimals ? props.nbDecimals : 2,
                  ) + (props.formatCurrency ? ' €' : '')
                : props.content
              : '-'
          }}
          {{ props.addSuffix ? props.addSuffix : '' }}
        </span>
      </div>
    </div>
    <VDivider
      v-if="props.dividerBottom"
      class="mt-2"
    />
  </VListItem>
</template>

<style scoped lang="scss"></style>
