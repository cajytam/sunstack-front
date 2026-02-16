<script setup lang="ts">
import { getStatusFromGroup } from '@/services/statusService'
import { getAll } from '@/services/api'
import { useUserStore } from '@/stores/user'
import { ability } from '@/plugins/casl/casl'

const props = defineProps<{
  openDialogStatus: boolean
  isSaving: boolean
}>()

const emit = defineEmits<{
  (e: 'isCloseStatusDialog', value: boolean): void
  (e: 'onSubmitStatus', value: object): void
}>()

const userStore = useUserStore()
const { authUser } = userStore

const isLoading = ref(false)

const listStatusGroup = ref([])
const listStatus = ref([])

const statusGroupSelected = ref(null)
const statusSelected = ref(null)

const requirement = reactive({
  select: null,
  datetime: null,
  reason: null,
})

onMounted(() => {
  getAll('statusGroup')
    .then(res => {
      console.log(res)
      res.data.forEach(group => {
        group.whoCanChange.every(role => {
          if (authUser.roles.includes(role) || ability.can('manage', 'all') || authUser.roles.includes('ROLE_ADAM')) {
            listStatusGroup.value.push(group)

            return false
          }

          return true
        })
      })
      listStatusGroup.value = listStatusGroup.value.sort((elem1, elem2) => {
        return elem1.sort - elem2.sort
      })
    })
    .catch(err => {
      console.error(err)
    })
})

watch(statusGroupSelected, () => {
  if (statusGroupSelected.value) {
    isLoading.value = true
    statusSelected.value = null
    getStatusFromGroup(statusGroupSelected.value)
      .then(res => {
        listStatus.value = res.data
          .filter(elem => elem.name)
          .sort((elem1, elem2) => {
            return elem1.sort - elem2.sort
          })
      })
      .catch(err => {
        console.error(err)
      })
      .finally(() => (isLoading.value = false))
  }
})

const isRequirementIncludes = (fieldName: string): boolean => {
  return JSON.stringify(statusSelected.value.required).includes(fieldName)
}

const isRequirementValid = (fieldName: string): boolean => {
  return isRequirementIncludes(fieldName) ? requirement[fieldName] !== null : true
}

watch(statusSelected, () => {
  if (statusSelected.value) {
    if (!isRequirementIncludes('datetime')) requirement.datetime = null

    if (!isRequirementIncludes('reason')) requirement.reason = null

    if (!isRequirementIncludes('select')) requirement.select = null
  }
})

const onSubmit = () => {
  if (
    statusSelected.value &&
    statusSelected.value.required &&
    !(isRequirementValid('datetime') && isRequirementValid('reason') && isRequirementValid('select'))
  )
    return

  emit('onSubmitStatus', {
    dateEvent: requirement.datetime,
    reasonEvent: requirement.reason,
    optionSelected: requirement.select,
    status: `/api/statuses/${statusSelected.value.id}`,
  })

  requirement.datetime = null
  requirement.reason = null
  requirement.select = null
  statusSelected.value = null
  statusGroupSelected.value = null
}
</script>

<template>
  <VDialog
    v-model="props.openDialogStatus"
    width="1024"
    persistent
  >
    <VCard>
      <VCardTitle>
        <span class="text-h5"> Modifier le statut du devis </span>
      </VCardTitle>
      <VCardText>
        <VContainer>
          <VCardText>
            <VAutocomplete
              v-model="statusGroupSelected"
              label="Catégorie du statut"
              :items="listStatusGroup"
              item-title="name"
              item-value="id"
              variant="filled"
              no-data-text="Aucun groupe de statut disponible"
            />
          </VCardText>
          <VSlideYTransition mode="out-in">
            <VCardText v-if="statusGroupSelected">
              <VAutocomplete
                v-model="statusSelected"
                label="Statut"
                variant="filled"
                :items="listStatus"
                item-title="name"
                item-value="id"
                :loading="isLoading"
                no-data-text="Aucun statut disponible"
                return-object
              />
            </VCardText>
          </VSlideYTransition>
          <VSlideYTransition mode="out-in">
            <div v-if="statusSelected">
              <template v-for="(item, key) in statusSelected.required">
                <VFadeTransition mode="out-in">
                  <VRow
                    v-if="key === 'reason'"
                    justify="center"
                    class="mt-1"
                  >
                    <VCol cols="11">
                      <VTextarea
                        v-model="requirement.reason"
                        variant="solo-filled"
                        label="Motif ou raison"
                      />
                    </VCol>
                  </VRow>
                  <VRow
                    v-else-if="key === 'select'"
                    class="mt-1"
                    justify="center"
                  >
                    <VCol cols="10">
                      <VSelect
                        v-model="requirement.select"
                        placeholder="Sélectionnez une option"
                        :items="item"
                        variant="solo-filled"
                      />
                    </VCol>
                  </VRow>
                  <VRow
                    v-else-if="key === 'datetime'"
                    class="mt-1"
                    justify="center"
                  >
                    <VCol cols="9">
                      <VTextField
                        v-model="requirement.datetime"
                        label="Date de l'évènement"
                        type="date"
                        min="2023-01-01"
                        max="2030-12-31"
                        variant="filled"
                      />
                    </VCol>
                  </VRow>
                </VFadeTransition>
              </template>
            </div>
          </VSlideYTransition>
        </VContainer>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="text"
          text="Fermer"
          @click="$emit('isCloseStatusDialog')"
        />
        <VBtn
          color="primary"
          variant="elevated"
          text="Valider"
          :loading="isSaving"
          @click="onSubmit"
        />
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped lang="scss"></style>
