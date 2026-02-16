<script setup lang="ts">
import { useThemeConfig } from '@core/composable/useThemeConfig'
import type { ThemeSwitcherTheme } from '@layouts/types'

const props = defineProps<{
  themes: ThemeSwitcherTheme[]
}>()

const { theme } = useThemeConfig()

const {
  state: currentThemeName,
  next: getNextThemeName,
  index: currentThemeIndex,
} = useCycleList(
  props.themes.map(t => t.name),
  { initialValue: theme.value },
)

const changeTheme = () => {
  theme.value = getNextThemeName()
  if (!localStorage.getItem('user_settings')) localStorage.setItem('user_settings', '{}')

  const userSettings = JSON.parse(localStorage.getItem('user_settings'))

  userSettings.theme = theme.value
  localStorage.setItem('user_settings', JSON.stringify(userSettings))
}

// Update icon if theme is changed from other sources
watch(theme, val => {
  currentThemeName.value = val
})
</script>

<template>
  <IconBtn @click="changeTheme">
    <VIcon
      size="26"
      :icon="props.themes[currentThemeIndex].icon"
    />
    <VTooltip
      activator="parent"
      open-delay="1000"
      scroll-strategy="close"
    >
      <span class="text-capitalize">{{ currentThemeName }}</span>
    </VTooltip>
  </IconBtn>
</template>
