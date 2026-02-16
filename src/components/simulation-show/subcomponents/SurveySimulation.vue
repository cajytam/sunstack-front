<script setup lang="ts">
import { getSurveysSteps, postSurveySimulation, statusesSurvey } from '@/services/surveyService'
import { useUserStore } from '@/stores/user'
import { ability } from '@/plugins/casl/casl'

const props = defineProps<Props>()

const router = useRouter()

interface Props {
  surveys: Array
  surveySimulation: Array
  idSimulation: string
}

const userStore = useUserStore()
const { authUser } = userStore

/**
 * Data
 */
const listSurveysSteps = ref([])

/**
 * UX
 */
const isCreatingSurvey = ref(false)
const isSurveyCreated = ref(false)

const canSee = (rolesCanDo: Array, rolesControl: Array): boolean => {
  if (ability.can('manage', 'all')) return true

  const roles = rolesCanDo.concat(rolesControl)

  return authUser.roles.some(r => {
    return roles.includes(r)
  })
}

onMounted(() => {
  getSurveysSteps()
    .then(res => {
      listSurveysSteps.value = res
      listSurveysSteps.value.forEach(step => {
        step.step = []
        step.idSurvey = null
        step.theme = {}
        step.theme.background = 'secondary'
        step.theme.index = -1
        step.theme.text = 'Non débuté'
        step.theme.control = [
          {
            label: 'Créer',
            color: 'green-sunstack-darker',
          },
        ]

        const surveyElement = props.surveySimulation.filter(s => s.surveyStep.id === step.id)
        if (surveyElement && surveyElement.length > 0) {
          step.idSurvey = surveyElement[0].id
          step.theme.text = statusesSurvey[surveyElement[0].highestStatus].text
          step.theme.background = statusesSurvey[surveyElement[0].highestStatus].color
          step.theme.control = statusesSurvey[surveyElement[0].highestStatus].control
          step.theme.index = statusesSurvey[surveyElement[0].highestStatus].index
        }

        let survey = null
        step.surveyItems.forEach(item => {
          survey = props.surveys.filter(s => s.surveyItem.id === item.id)

          if (survey && survey.length > 0) {
            if (step.theme.index < statusesSurvey[survey[0].statusValidation].index) {
              step.theme.text = statusesSurvey[survey[0].statusValidation].text
              step.theme.background = statusesSurvey[survey[0].statusValidation].color
              step.theme.control = statusesSurvey[survey[0].statusValidation].control
              step.theme.index = statusesSurvey[survey[0].statusValidation].index
            }

            if (statusesSurvey[survey[0].statusValidation].icon) {
              step.step.push({
                element: survey[0].surveyItem.name,
                color: statusesSurvey[survey[0].statusValidation].icon.color,
                icon: statusesSurvey[survey[0].statusValidation].icon.icon,
              })
            }
          }
        })
      })
      if (process.env.NODE_ENV === 'development') console.log(listSurveysSteps.value)
    })
    .catch(err => console.error(err))
})

const onViewSurvey = (idSurveySimulation, idSurveyStep) => {
  if (!idSurveySimulation) {
    isCreatingSurvey.value = true
    postSurveySimulation(props.idSimulation, idSurveyStep, 'B')
      .then(res => {
        isSurveyCreated.value = true
        router.push({ name: 'survey-show-surveyId', params: { surveyId: res.id } })
      })
      .finally(() => (isCreatingSurvey.value = false))
  } else {
    router.push({ name: 'survey-show-surveyId', params: { surveyId: idSurveySimulation } })
  }
}
</script>

<template>
  <VRow justify="start">
    <template
      v-for="surveyStep in listSurveysSteps"
      :id="surveyStep.id"
    >
      <VCol
        v-if="canSee(surveyStep.whoCanDo, surveyStep.whoCanControl)"
        cols="6"
      >
        <VCard
          class="my-2 fill-height d-flex flex-column"
          variant="tonal"
          :color="surveyStep.theme.background"
          border
        >
          <VCardTitle :class="`text-body-2 text-uppercase bg-${surveyStep.theme.background} text-wrap`">
            {{ surveyStep.name }}
          </VCardTitle>
          <VCardItem class="mt-2">
            <VChip
              class="text-wrap"
              :text="surveyStep.theme.text"
            />
          </VCardItem>
          <VList v-if="surveyStep.step.length > 0">
            <div v-for="step in surveyStep.step">
              <div
                v-if="surveyStep.theme.background === step.color"
                :class="`d-flex align-center justify-center py-0 text-body-2 my-2 text-${step.color}`"
              >
                <VIcon
                  :icon="step.icon"
                  size="small"
                  class="mr-2"
                />
                <span class="text-wrap">
                  {{ step.element }}
                </span>
              </div>
            </div>
          </VList>
          <VCardText class="d-flex justify-center align-end">
            <VBtn
              v-for="btn in surveyStep.theme.control"
              :text="btn.label"
              :color="btn.color"
              :loading="isCreatingSurvey"
              :disabled="isSurveyCreated"
              @click="
                onViewSurvey(
                  !surveyStep.idSurvey ? null : surveyStep.idSurvey,
                  !surveyStep.idSurvey ? surveyStep.id : null,
                )
              "
            />
          </VCardText>
        </VCard>
      </VCol>
    </template>
  </VRow>
</template>
